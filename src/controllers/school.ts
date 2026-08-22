import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { getDbPool, tableExists, runSql } from '../config/db';
import logger from '../config/logger';
import { sendTextMessage } from '../services/whatsapp';

// ─── AUTO-CREATE CLASS_SECTIONS TABLE ON STARTUP ──────────────
let classSectionsReady = false;

const CLASS_SECTIONS_DDL = `
CREATE TABLE IF NOT EXISTS class_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  grade INTEGER NOT NULL,
  section VARCHAR(10) NOT NULL,
  class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  room_number VARCHAR(50),
  capacity INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_grade_section_per_tenant UNIQUE (institution_id, grade, section)
);

CREATE INDEX IF NOT EXISTS idx_class_sections_institution ON class_sections(institution_id);
CREATE INDEX IF NOT EXISTS idx_class_sections_grade ON class_sections(institution_id, grade);

DO $$
BEGIN
  ALTER TABLE class_sections ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "tenant_class_sections_select" ON class_sections;
  CREATE POLICY "tenant_class_sections_select" ON class_sections
    FOR SELECT USING (institution_id = (auth.jwt() ->> 'institution_id')::uuid);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "tenant_class_sections_manage" ON class_sections;
  CREATE POLICY "tenant_class_sections_manage" ON class_sections
    FOR ALL USING (institution_id = (auth.jwt() ->> 'institution_id')::uuid);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
`;

const TIMETABLE_SCHOOL_MIGRATION = `
ALTER TABLE timetable ALTER COLUMN department_id DROP NOT NULL;
ALTER TABLE timetable DROP CONSTRAINT IF EXISTS timetable_teacher_id_fkey;
`;

let timetableSchoolReady = false;

export async function ensureTimetableSchoolReady(): Promise<boolean> {
  if (timetableSchoolReady) return true;
  const pool = getDbPool();
  if (!pool) {
    logger.error('[SCHOOL] Cannot auto-migrate timetable: DATABASE_URL not configured.');
    return false;
  }
  const result = await runSql(TIMETABLE_SCHOOL_MIGRATION);
  if (result.success) {
    timetableSchoolReady = true;
    logger.info('[SCHOOL] Timetable school migration applied.');
    return true;
  }
  logger.error('[SCHOOL] Timetable school migration failed:', result.error);
  return false;
}

export async function ensureClassSectionsTable(): Promise<boolean> {
  // Step 1: Check via Supabase if table already exists
  try {
    const { error } = await supabaseAdmin
      .from('class_sections')
      .select('id')
      .limit(1);

    if (!error) {
      classSectionsReady = true;
      logger.info('[SCHOOL] class_sections table verified via Supabase.');
      return true;
    }
    logger.info('[SCHOOL] class_sections check via Supabase:', error?.message, error?.code);
  } catch (err: any) {
    logger.info('[SCHOOL] class_sections Supabase check failed:', err.message);
  }

  // Step 2: Try direct PostgreSQL connection
  const pool = getDbPool();
  if (!pool) {
    logger.error('[SCHOOL] Cannot auto-create class_sections: DATABASE_URL not configured.');
    logger.error('[SCHOOL] MANUAL FIX: Run the SQL in supabase/migrations/20260703000000_class_sections.sql via Supabase SQL Editor.');
    return false;
  }

  // Check via direct PG
  const exists = await tableExists('class_sections');
  if (exists) {
    classSectionsReady = true;
    logger.info('[SCHOOL] class_sections table verified via direct PG.');
    return true;
  }

  // Step 3: Create the table via direct PG
  logger.warn('[SCHOOL] class_sections table missing. Creating via direct PostgreSQL...');
  const result = await runSql(CLASS_SECTIONS_DDL);

  if (result.success) {
    classSectionsReady = true;
    logger.info('[SCHOOL] class_sections table created successfully via direct PG.');
    return true;
  }

  logger.error('[SCHOOL] Failed to create class_sections table:', result.error);
  return false;
}

export function isClassSectionsReady(): boolean {
  return classSectionsReady;
}

// ─── LIST CLASS SECTIONS ─────────────────────────────────────
export async function listClassSections(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    if (!classSectionsReady) {
      const created = await ensureClassSectionsTable();
      if (!created) {
        return res.status(503).json({
          success: false,
          error: 'Class sections table could not be initialized. Please run the setup schema.',
          setup_required: true,
        });
      }
    }
    await ensureTimetableSchoolReady();

    const { data, error } = await supabaseAdmin
      .from('class_sections')
      .select(`
        id, grade, section, room_number, capacity, created_at,
        class_teacher:class_teacher_id(id, name, email)
      `)
      .eq('institution_id', institution_id)
      .order('grade')
      .order('section');

    if (error) throw error;

    const classes = (data || []).map((c: any) => ({
      id: c.id,
      grade: c.grade,
      section: c.section,
      class_teacher_id: c.class_teacher?.id || null,
      class_teacher_name: c.class_teacher?.name || null,
      room_number: c.room_number,
      capacity: c.capacity,
      student_count: 0,
    }));

    // Count actual students per class section from students table
    const { data: studentCounts } = await supabaseAdmin
      .from('students')
      .select('class_section_id')
      .eq('institution_id', institution_id)
      .not('class_section_id', 'is', null);

    if (studentCounts) {
      const countMap: Record<string, number> = {};
      studentCounts.forEach((s: any) => {
        const csid = s.class_section_id;
        if (csid) {
          countMap[csid] = (countMap[csid] || 0) + 1;
        }
      });
      classes.forEach((c: any) => {
        c.student_count = countMap[c.id] || 0;
      });
    }

    return res.json({ success: true, classes });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[listClassSections] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── CREATE CLASS SECTION ────────────────────────────────────
export async function createClassSection(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    if (!classSectionsReady) {
      const created = await ensureClassSectionsTable();
      if (!created) {
        return res.status(503).json({ success: false, error: 'Class sections table could not be initialized. Please run the setup schema.' });
      }
    }

    const { grade, section, class_teacher_id, room_number, capacity } = req.body;
    if (!grade || !section) {
      return res.status(400).json({ success: false, error: 'Grade and Section are required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('class_sections')
      .insert({
        institution_id,
        grade: Number(grade),
        section: section.toUpperCase(),
        class_teacher_id: class_teacher_id || null,
        room_number: room_number || null,
        capacity: capacity || 40,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, error: `Grade ${grade} Section ${section} already exists.` });
      }
      throw error;
    }

    return res.json({ success: true, class_section: data, message: `Grade ${grade}-${section} created.` });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[createClassSection] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── UPDATE CLASS SECTION ────────────────────────────────────
export async function updateClassSection(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    if (!classSectionsReady) {
      const created = await ensureClassSectionsTable();
      if (!created) {
        return res.status(503).json({ success: false, error: 'Class sections table could not be initialized.' });
      }
    }
    await ensureTimetableSchoolReady();

    const { grade, section, class_teacher_id, room_number, capacity } = req.body;

    const updates: Record<string, unknown> = {};
    if (grade !== undefined) updates.grade = Number(grade);
    if (section !== undefined) updates.section = section.toUpperCase();
    if (class_teacher_id !== undefined) updates.class_teacher_id = class_teacher_id || null;
    if (room_number !== undefined) updates.room_number = room_number || null;
    if (capacity !== undefined) updates.capacity = capacity;

    const { data, error } = await supabaseAdmin
      .from('class_sections')
      .update(updates)
      .eq('id', id)
      .eq('institution_id', institution_id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, class_section: data });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[updateClassSection] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── DELETE CLASS SECTION ────────────────────────────────────
export async function deleteClassSection(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    if (!classSectionsReady) {
      const created = await ensureClassSectionsTable();
      if (!created) {
        return res.status(503).json({ success: false, error: 'Class sections table could not be initialized.' });
      }
    }

    const { error } = await supabaseAdmin
      .from('class_sections')
      .delete()
      .eq('id', id)
      .eq('institution_id', institution_id);

    if (error) throw error;
    return res.json({ success: true, message: 'Class section deleted.' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[deleteClassSection] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── LIST TEACHERS (for dropdown) ────────────────────────────
export async function listTeachers(req: Request, res: Response) {
  try {
    const institution_id = req.user?.institution_id;
    if (!institution_id) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('institution_id', institution_id)
      .eq('role', 'Teacher')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return res.json({ success: true, teachers: data || [] });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[listTeachers] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

const LIBRARY_BOOKS_DDL = `
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  isbn TEXT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT,
  publication_year INTEGER,
  category TEXT,
  subcategory TEXT,
  language TEXT DEFAULT 'English',
  copies_total INTEGER DEFAULT 1,
  copies_available INTEGER DEFAULT 1,
  shelf_location TEXT,
  cover_image_url TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

const LIBRARY_BOOK_ISSUES_DDL = `
CREATE TABLE IF NOT EXISTS book_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  returned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  condition_on_issue TEXT DEFAULT 'good',
  condition_on_return TEXT,
  fine_amount DECIMAL DEFAULT 0,
  fine_paid BOOLEAN DEFAULT false,
  fine_paid_date DATE,
  status TEXT DEFAULT 'issued',
  renewal_count INTEGER DEFAULT 0,
  notes TEXT
);
`;

const LIBRARY_BOOK_RESERVATIONS_DDL = `
CREATE TABLE IF NOT EXISTS book_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  reserved_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'waiting',
  notified_at TIMESTAMPTZ
);
`;

const LIBRARY_EBOOKS_DDL = `
CREATE TABLE IF NOT EXISTS ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT,
  department TEXT,
  semester TEXT,
  description TEXT,
  file_url TEXT NOT NULL,
  cover_url TEXT,
  file_size_mb DECIMAL,
  tags TEXT[] DEFAULT '{}',
  access_level TEXT DEFAULT 'all',
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
`;

const LIBRARY_STUDY_ROOMS_DDL = `
CREATE TABLE IF NOT EXISTS study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER,
  amenities TEXT[] DEFAULT '{}',
  floor INTEGER,
  is_active BOOLEAN DEFAULT true
);
`;

const LIBRARY_STUDY_ROOM_BOOKINGS_DDL = `
CREATE TABLE IF NOT EXISTS study_room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT,
  group_members UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'confirmed',
  qr_code TEXT,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

const LIBRARY_FINES_DDL = `
CREATE TABLE IF NOT EXISTS library_fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES book_issues(id) ON DELETE SET NULL,
  amount DECIMAL NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'unpaid',
  payment_date DATE,
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

const LIBRARY_READING_HISTORY_DDL = `
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  ebook_id UUID,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

// ─── ADMIN: SETUP SCHEMA ENDPOINT ────────────────────────────
const PTM_DDL = `
CREATE TABLE IF NOT EXISTS ptm_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot_time VARCHAR(100) NOT NULL,
  available BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_ptm_slot_teacher UNIQUE (teacher_id, date, slot_time)
);

CREATE INDEX IF NOT EXISTS idx_ptm_slots_teacher ON ptm_slots(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ptm_slots_date ON ptm_slots(date);

CREATE TABLE IF NOT EXISTS ptm_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot_time VARCHAR(100) NOT NULL,
  meet_link TEXT,
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_ptm_booking_slot UNIQUE (teacher_id, date, slot_time)
);

CREATE INDEX IF NOT EXISTS idx_ptm_bookings_parent ON ptm_bookings(parent_id);
CREATE INDEX IF NOT EXISTS idx_ptm_bookings_teacher ON ptm_bookings(teacher_id);
`;

const PARENT_MESSAGES_DDL = `
CREATE TABLE IF NOT EXISTS parent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  sender_role VARCHAR(50) NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sla_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_messages_sender ON parent_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_receiver ON parent_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_institution ON parent_messages(institution_id);
`;

export async function setupSchema(req: Request, res: Response) {
  try {
    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'DATABASE_URL not configured. Cannot run schema setup.',
        hint: 'Add DATABASE_URL to your .env file with the Supabase direct PostgreSQL connection string.',
      });
    }

    const results: { table: string; status: string; error?: string }[] = [];

    const tables = [
      { name: 'class_sections', ddl: CLASS_SECTIONS_DDL },
      { name: 'ptm_slots', ddl: PTM_DDL },
      { name: 'parent_messages', ddl: PARENT_MESSAGES_DDL },
      { name: 'books', ddl: LIBRARY_BOOKS_DDL },
      { name: 'book_issues', ddl: LIBRARY_BOOK_ISSUES_DDL },
      { name: 'book_reservations', ddl: LIBRARY_BOOK_RESERVATIONS_DDL },
      { name: 'ebooks', ddl: LIBRARY_EBOOKS_DDL },
      { name: 'study_rooms', ddl: LIBRARY_STUDY_ROOMS_DDL },
      { name: 'study_room_bookings', ddl: LIBRARY_STUDY_ROOM_BOOKINGS_DDL },
      { name: 'library_fines', ddl: LIBRARY_FINES_DDL },
      { name: 'reading_history', ddl: LIBRARY_READING_HISTORY_DDL },
    ];

    for (const t of tables) {
      const exists = await tableExists(t.name);
      if (exists) {
        results.push({ table: t.name, status: 'already exists' });
      } else {
        const result = await runSql(t.ddl);
        if (result.success) {
          results.push({ table: t.name, status: 'created' });
          if (t.name === 'class_sections') classSectionsReady = true;
        } else {
          results.push({ table: t.name, status: 'failed', error: result.error });
        }
      }
    }

    return res.json({ success: true, results });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── AUTO-CREATE ALL TABLES ON STARTUP ────────────────────────
export async function ensureAllSchemaTables(): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  const tables = [
    { name: 'class_sections', ddl: CLASS_SECTIONS_DDL, onCreated: () => { classSectionsReady = true; } },
    { name: 'ptm_slots', ddl: PTM_DDL, onCreated: () => {} },
    { name: 'parent_messages', ddl: PARENT_MESSAGES_DDL, onCreated: () => {} },
    { name: 'books', ddl: LIBRARY_BOOKS_DDL, onCreated: () => {} },
    { name: 'book_issues', ddl: LIBRARY_BOOK_ISSUES_DDL, onCreated: () => {} },
    { name: 'book_reservations', ddl: LIBRARY_BOOK_RESERVATIONS_DDL, onCreated: () => {} },
    { name: 'ebooks', ddl: LIBRARY_EBOOKS_DDL, onCreated: () => {} },
    { name: 'study_rooms', ddl: LIBRARY_STUDY_ROOMS_DDL, onCreated: () => {} },
    { name: 'study_room_bookings', ddl: LIBRARY_STUDY_ROOM_BOOKINGS_DDL, onCreated: () => {} },
    { name: 'library_fines', ddl: LIBRARY_FINES_DDL, onCreated: () => {} },
    { name: 'reading_history', ddl: LIBRARY_READING_HISTORY_DDL, onCreated: () => {} },
  ];

  for (const t of tables) {
    const exists = await tableExists(t.name);
    if (!exists) {
      logger.warn(`[SCHEMA] Table "${t.name}" missing. Creating...`);
      const result = await runSql(t.ddl);
      if (result.success) {
        t.onCreated();
        logger.info(`[SCHEMA] Table "${t.name}" created successfully.`);
      } else {
        logger.error(`[SCHEMA] Failed to create "${t.name}":`, result.error);
      }
    } else {
      if (t.name === 'class_sections') classSectionsReady = true;
    }
  }
}

// ─── MARK DAILY ATTENDANCE (SCHOOL) ──────────────────────────
export async function markDailyAttendance(req: Request, res: Response) {
  try {
    const { class_section_id, date, academic_year, records } = req.body;
    const institutionId = req.user?.institution_id;

    if (!institutionId) {
      return res.status(400).json({ success: false, error: 'No institution context.' });
    }
    if (!class_section_id || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'class_section_id, date, and records are required.' });
    }

    // Authorization check: User must be Admin/SuperAdmin/Principal/Director, OR the assigned Class Teacher
    if (req.user?.role === 'Teacher') {
      const { data: classSection } = await supabaseAdmin
        .from('class_sections')
        .select('class_teacher_id')
        .eq('id', class_section_id)
        .maybeSingle();

      if (!classSection || classSection.class_teacher_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Only the assigned Class Teacher can mark attendance for this section.' });
      }
    }

    const resolvedAcademicYear = academic_year || new Date().getFullYear().toString();

    const dbRecords = records.map((r: any) => ({
      institution_id: institutionId,
      student_id: r.student_id,
      date,
      academic_year: resolvedAcademicYear,
      status: r.status,
      marked_by: req.user?.id
    }));

    const { error } = await supabaseAdmin
      .from('school_attendance')
      .upsert(dbRecords, { onConflict: 'student_id,date,academic_year' });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Trigger WhatsApp notification immediately for Absent students
    (async () => {
      try {
        const absentStudents = records.filter((r: any) => r.status === 'Absent');
        for (const r of absentStudents) {
          const { data: studentInfo } = await supabaseAdmin
            .from('students')
            .select('users(full_name), guardian_phone, institutions(name)')
            .eq('id', r.student_id)
            .maybeSingle();

          const studentName = (studentInfo as any)?.users?.full_name || 'your child';
          const institutionName = (studentInfo as any)?.institutions?.name || 'School';
          const guardianPhone = studentInfo?.guardian_phone;

          const message = `Dear Parent, your child ${studentName} was marked ABSENT today (${date}) at ${institutionName}. Please contact the school if this was unplanned. - IRIS 365`;

          // 1. Send to guardian phone on student record
          if (guardianPhone) {
            await sendTextMessage(guardianPhone, message, 'attendance_alert');
          }

          // 2. Send to verified parent users linked to the student
          const { data: parentLinks } = await supabaseAdmin
            .from('parent_student_links')
            .select('parent_user_id, users(phone)')
            .eq('student_id', r.student_id)
            .eq('verified', true);

          if (parentLinks && parentLinks.length > 0) {
            for (const link of parentLinks) {
              const parentPhone = (link as any)?.users?.phone;
              if (parentPhone && parentPhone !== guardianPhone) {
                await sendTextMessage(parentPhone, message, 'attendance_alert');
              }
            }
          }
        }
      } catch (err) {
        console.error('[SCHOOL ATTENDANCE WHATSAPP] Background notification error:', err);
      }
    })();

    return res.status(200).json({ success: true, count: dbRecords.length, message: 'Daily attendance marked successfully.' });
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[markDailyAttendance] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── GET PRINCIPAL DASHBOARD METRICS ─────────────────────────
export async function getPrincipalDashboardMetrics(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    // 1. Fetch class sections
    const { data: sections } = await supabaseAdmin
      .from('class_sections')
      .select('id, grade, section')
      .eq('institution_id', institutionId);

    // 2. Fetch active students
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, class_section_id')
      .eq('institution_id', institutionId);

    const sectionGradeMap = new Map<string, number>();
    sections?.forEach((s: any) => {
      sectionGradeMap.set(s.id, s.grade);
    });

    const gradeStrength: Record<number, number> = {};
    students?.forEach((s: any) => {
      const grade = s.class_section_id ? sectionGradeMap.get(s.class_section_id) : null;
      if (grade !== undefined && grade !== null) {
        gradeStrength[grade] = (gradeStrength[grade] || 0) + 1;
      }
    });

    const totalStrengthPerGrade = Object.entries(gradeStrength).map(([grade, count]) => ({
      grade: Number(grade),
      count
    })).sort((a, b) => a.grade - b.grade);

    // Calculate unique grades count
    const uniqueGrades = new Set<number>();
    sections?.forEach((s: any) => {
      if (s.grade !== undefined && s.grade !== null) {
        uniqueGrades.add(Number(s.grade));
      }
    });
    const totalGrades = uniqueGrades.size;

    // 3. Today's Attendance logs
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: attendanceToday } = await supabaseAdmin
      .from('school_attendance')
      .select('student_id, status')
      .eq('institution_id', institutionId)
      .eq('date', todayStr);

    let todaysAttendancePct = 0;
    if (attendanceToday && attendanceToday.length > 0) {
      const presentCount = attendanceToday.filter((a: any) => a.status === 'Present' || a.status === 'Half-Day').length;
      todaysAttendancePct = Math.round((presentCount / attendanceToday.length) * 100);
    }

    // 4. Calculate morning attendance register completed sections
    const totalSectionsCount = sections?.length || 0;
    const studentSectionMap = new Map<string, string>();
    students?.forEach((s: any) => {
      if (s.id && s.class_section_id) {
        studentSectionMap.set(s.id, s.class_section_id);
      }
    });

    const completedSectionsSet = new Set<string>();
    let totalAbsentsToday = 0;

    attendanceToday?.forEach((a: any) => {
      const sectionId = studentSectionMap.get(a.student_id);
      if (sectionId) {
        completedSectionsSet.add(sectionId);
      }
      if (a.status === 'Absent') {
        totalAbsentsToday++;
      }
    });

    const completedSectionsCount = completedSectionsSet.size;
    const sectionsCompletionPct = totalSectionsCount > 0 
      ? Math.round((completedSectionsCount / totalSectionsCount) * 100) 
      : 0;

    // 5. Pending PTM Requests
    const { count: pendingPTMCount } = await supabaseAdmin
      .from('ptm_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .eq('status', 'pending');

    const totalStudents = students?.length || 0;

    // 6. Total Faculty Count
    const { count: totalFaculty } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .eq('role', 'Teacher')
      .eq('is_active', true);

    return res.json({
      success: true,
      totalStudents,
      totalFaculty: totalFaculty || 0,
      todaysAttendancePct,
      sectionsCompletionPct,
      totalAbsentsToday,
      totalGrades,
      pendingPTMCount: pendingPTMCount || 0,
      totalStrengthPerGrade
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[getPrincipalDashboardMetrics] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── ADMIN: BULK VERIFY PARENT LINKS ────────────────────────
export async function bulkVerifyParentLinks(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    // Find all unverified parent_student_links
    const { data: unverifiedLinks, error: linksError } = await supabaseAdmin
      .from('parent_student_links')
      .select(`
        id,
        parent_user_id,
        student_id,
        users:parent_user_id(phone),
        students:student_id(guardian_phone, institution_id)
      `)
      .eq('verified', false);

    if (linksError) throw linksError;

    const toVerifyIds: string[] = [];
    const parentUserIdsToUpdate: string[] = [];

    (unverifiedLinks || []).forEach((link: any) => {
      if (link.students?.institution_id !== institutionId) return;

      const parentPhone = link.users?.phone;
      const guardianPhone = link.students?.guardian_phone;

      if (parentPhone && guardianPhone) {
        const cleanParent = parentPhone.replace(/[^0-9]/g, '');
        const cleanGuardian = guardianPhone.replace(/[^0-9]/g, '');

        if (cleanParent === cleanGuardian && cleanParent.length > 0) {
          toVerifyIds.push(link.id);
          parentUserIdsToUpdate.push(link.parent_user_id);
        }
      }
    });

    if (toVerifyIds.length === 0) {
      return res.json({ success: true, message: 'No links matched the bulk-verification phone criteria.', count: 0 });
    }

    // 1. Set verified = true on links
    const { error: updateError } = await supabaseAdmin
      .from('parent_student_links')
      .update({ verified: true })
      .in('id', toVerifyIds);

    if (updateError) throw updateError;

    // 2. Set is_verified = true on parent_profiles
    const { error: profileError } = await supabaseAdmin
      .from('parent_profiles')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .in('user_id', parentUserIdsToUpdate);

    if (profileError) {
      console.warn('[bulkVerifyParentLinks] Profile update warning (non-fatal):', profileError.message);
    }

    return res.json({
      success: true,
      message: `Successfully verified ${toVerifyIds.length} parent-student link(s) based on matching Guardian Phone.`,
      count: toVerifyIds.length
    });
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[bulkVerifyParentLinks] Error:', errorMsg);
    return res.status(500).json({ success: false, error: errorMsg });
  }
}

// ─── GET GRADE-WISE ANALYTICS ────────────────────────────────
export async function getGradeWiseAnalytics(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { data: sections } = await supabaseAdmin
      .from('class_sections')
      .select('id, grade, section')
      .eq('institution_id', institutionId);

    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, class_section_id')
      .eq('institution_id', institutionId);

    const sectionToGrade = new Map<string, number>();
    const gradeStudents = new Map<number, string[]>();
    sections?.forEach((s: any) => {
      sectionToGrade.set(s.id, Number(s.grade));
    });

    students?.forEach((s: any) => {
      if (s.class_section_id) {
        const grade = sectionToGrade.get(s.class_section_id);
        if (grade !== undefined && grade !== null) {
          if (!gradeStudents.has(grade)) {
            gradeStudents.set(grade, []);
          }
          gradeStudents.get(grade)!.push(s.id);
        }
      }
    });

    // 2. Attendance averages by Grade
    const { data: attendance } = await supabaseAdmin
      .from('school_attendance')
      .select('student_id, status')
      .eq('institution_id', institutionId);

    const studentToGrade = new Map<string, number>();
    students?.forEach((s: any) => {
      if (s.class_section_id) {
        const grade = sectionToGrade.get(s.class_section_id);
        if (grade !== undefined) studentToGrade.set(s.id, grade);
      }
    });

    const gradeAttendanceCounts: Record<number, { total: number; present: number }> = {};
    attendance?.forEach((a: any) => {
      const grade = studentToGrade.get(a.student_id);
      if (grade !== undefined) {
        if (!gradeAttendanceCounts[grade]) {
          gradeAttendanceCounts[grade] = { total: 0, present: 0 };
        }
        gradeAttendanceCounts[grade].total++;
        if (a.status === 'Present' || a.status === 'Leave') {
          gradeAttendanceCounts[grade].present += 1;
        } else if (a.status === 'Half-Day') {
          gradeAttendanceCounts[grade].present += 0.5;
        }
      }
    });

    // 3. Fee Collection Status by Grade
    const { data: payments } = await supabaseAdmin
      .from('fee_payments')
      .select('student_id, amount_paid');

    const { data: structures } = await supabaseAdmin
      .from('fee_structures')
      .select('id, amount');

    const gradeFeePaid: Record<number, number> = {};
    payments?.forEach((p: any) => {
      const grade = studentToGrade.get(p.student_id);
      if (grade !== undefined) {
        gradeFeePaid[grade] = (gradeFeePaid[grade] || 0) + Number(p.amount_paid);
      }
    });

    // 4. Academic performance averages (from cia_marks)
    const { data: ciaMarks } = await supabaseAdmin
      .from('cia_marks')
      .select('student_id, marks_obtained, max_marks');

    const gradeAcademicCounts: Record<number, { totalMax: number; totalObtained: number }> = {};
    ciaMarks?.forEach((m: any) => {
      const grade = studentToGrade.get(m.student_id);
      if (grade !== undefined) {
        if (!gradeAcademicCounts[grade]) {
          gradeAcademicCounts[grade] = { totalMax: 0, totalObtained: 0 };
        }
        gradeAcademicCounts[grade].totalMax += Number(m.max_marks || 100);
        gradeAcademicCounts[grade].totalObtained += Number(m.marks_obtained || 0);
      }
    });

    const analytics = [];
    for (let grade = 1; grade <= 12; grade++) {
      const studentCount = gradeStudents.get(grade)?.length || 0;
      
      const attStats = gradeAttendanceCounts[grade];
      const attendanceAvg = attStats && attStats.total > 0 
        ? Math.round((attStats.present / attStats.total) * 100)
        : 90; // Fallback

      const acadStats = gradeAcademicCounts[grade];
      const academicAvg = acadStats && acadStats.totalMax > 0
        ? Math.round((acadStats.totalObtained / acadStats.totalMax) * 100)
        : 78; // Fallback

      const totalPaid = gradeFeePaid[grade] || 0;
      const totalDuePerStudent = structures?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 12000;
      const targetFees = studentCount * totalDuePerStudent;
      const feeCollectionRate = targetFees > 0 
        ? Math.round((totalPaid / targetFees) * 100)
        : 80;

      analytics.push({
        grade,
        studentCount,
        attendanceAvg,
        academicAvg,
        totalPaid,
        targetFees,
        feeCollectionRate: Math.min(100, feeCollectionRate)
      });
    }

    return res.status(200).json({ success: true, analytics });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET TEACHER ACTIVITY TRACKING ────────────────────────────
export async function getTeacherActivity(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Fetch class sections with teacher name
    const { data: sections } = await supabaseAdmin
      .from('class_sections')
      .select('*, users:class_teacher_id(name)')
      .eq('institution_id', institutionId);

    // 2. Fetch students to map section_id -> student_ids
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, class_section_id')
      .eq('institution_id', institutionId);

    const sectionStudentsMap = new Map<string, string[]>();
    students?.forEach((s: any) => {
      if (s.class_section_id) {
        if (!sectionStudentsMap.has(s.class_section_id)) {
          sectionStudentsMap.set(s.class_section_id, []);
        }
        sectionStudentsMap.get(s.class_section_id)!.push(s.id);
      }
    });

    // 3. Fetch today's attendance logs
    const { data: attendance } = await supabaseAdmin
      .from('school_attendance')
      .select('student_id')
      .eq('institution_id', institutionId)
      .eq('date', todayStr);

    const attendedStudents = new Set<string>(attendance?.map((a: any) => a.student_id) || []);

    // 4. Fetch today's class diary entries
    const { data: diaries } = await supabaseAdmin
      .from('diary_entries')
      .select('class_section_id')
      .eq('institution_id', institutionId)
      .eq('date', todayStr);

    const diarySubmittedSections = new Set<string>(diaries?.map((d: any) => d.class_section_id) || []);

    const activities = (sections || []).map((sec: any) => {
      const sectionStudents = sectionStudentsMap.get(sec.id) || [];
      // At least one student marked attendance today
      const attendanceSubmitted = sectionStudents.some(sid => attendedStudents.has(sid));
      const diarySubmitted = diarySubmittedSections.has(sec.id);

      return {
        id: sec.id,
        grade: sec.grade,
        section: sec.section,
        teacherName: sec.users?.name || 'Not Assigned',
        attendanceSubmitted,
        diarySubmitted
      };
    });

    return res.status(200).json({ success: true, activities });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET SCHOOL FEE OVERSIGHT & DEFAULTERS ────────────────────
export async function getSchoolFeeOversight(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    // 1. Fetch structures
    const { data: structures } = await supabaseAdmin
      .from('fee_structures')
      .select('*')
      .eq('institution_id', institutionId);

    // 2. Fetch payments
    const { data: payments } = await supabaseAdmin
      .from('fee_payments')
      .select('student_id, amount_paid')
      .eq('institution_id', institutionId);

    // 3. Fetch students with sections
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, name, roll_number, guardian_phone, guardian_name, class_sections(grade, section)')
      .eq('institution_id', institutionId);

    const totalCollected = payments?.reduce((acc, curr) => acc + Number(curr.amount_paid), 0) || 0;
    const totalDuePerStudent = structures?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 12000;
    const targetFees = (students?.length || 0) * totalDuePerStudent;

    // Student paid mapping
    const studentPaidMap = new Map<string, number>();
    payments?.forEach((p: any) => {
      studentPaidMap.set(p.student_id, (studentPaidMap.get(p.student_id) || 0) + Number(p.amount_paid));
    });

    // Construct defaulters list
    const defaulters: any[] = [];
    students?.forEach((st: any) => {
      const paid = studentPaidMap.get(st.id) || 0;
      const balance = totalDuePerStudent - paid;
      if (balance > 0) {
        defaulters.push({
          id: st.id,
          name: st.name || 'Student',
          roll_number: st.roll_number,
          grade: st.class_sections?.grade || 1,
          section: st.class_sections?.section || 'A',
          totalDue: totalDuePerStudent,
          paid,
          balance,
          guardianName: st.guardian_name || 'Parent',
          guardianPhone: st.guardian_phone || 'N/A'
        });
      }
    });

    // Sort by largest balance first
    defaulters.sort((a, b) => b.balance - a.balance);

    return res.status(200).json({
      success: true,
      totalCollected,
      targetFees,
      defaulters: defaulters.slice(0, 50) // Top 50 defaulters
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET PTM & PARENT MESSAGES SLA STATUS ─────────────────────
export async function getParentEngagement(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    // 1. PTM Bookings stats
    const { data: ptms } = await supabaseAdmin
      .from('ptm_bookings')
      .select('status')
      .eq('institution_id', institutionId);

    const ptmStats = {
      total: ptms?.length || 0,
      completed: ptms?.filter((p: any) => p.status === 'completed').length || 0,
      scheduled: ptms?.filter((p: any) => p.status === 'scheduled').length || 0,
      pending: ptms?.filter((p: any) => p.status === 'pending').length || 0,
    };

    // 2. Fetch all parent messages in the institution
    const { data: messages } = await supabaseAdmin
      .from('parent_messages')
      .select('*, sender:sender_id(name, role), receiver:receiver_id(name, role)')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: true });

    // Group messages by Parent-Teacher conversation thread
    // Thread key is alphabetically sorted (parent_id + '_' + teacher_id)
    const threadMap = new Map<string, any[]>();
    messages?.forEach((msg: any) => {
      const isParentSender = msg.sender?.role === 'Parent';
      const parentId = isParentSender ? msg.sender_id : msg.receiver_id;
      const teacherId = isParentSender ? msg.receiver_id : msg.sender_id;
      const key = `${parentId}_${teacherId}`;

      if (!threadMap.has(key)) {
        threadMap.set(key, []);
      }
      threadMap.get(key)!.push(msg);
    });

    let pendingResponsesCount = 0;
    let slaBreachedCount = 0;
    const teacherSlaStats: any[] = [];

    threadMap.forEach((threadMessages) => {
      const latestMsg = threadMessages[threadMessages.length - 1];
      const isParentLatest = latestMsg.sender_role === 'Parent' || latestMsg.sender?.role === 'Parent';

      if (isParentLatest) {
        pendingResponsesCount++;
        const createdAtTime = new Date(latestMsg.created_at).getTime();
        const deadlineTime = latestMsg.sla_deadline 
          ? new Date(latestMsg.sla_deadline).getTime()
          : createdAtTime + 24 * 60 * 60 * 1000; // default 24h

        const now = Date.now();
        const isBreached = now > deadlineTime;
        if (isBreached) {
          slaBreachedCount++;
        }

        const delayHours = Math.round((now - createdAtTime) / (60 * 60 * 1000));

        teacherSlaStats.push({
          parentName: latestMsg.sender?.name || 'Parent',
          teacherName: latestMsg.receiver?.name || 'Teacher',
          latestMessage: latestMsg.message,
          messageTime: latestMsg.created_at,
          delayHours,
          slaStatus: isBreached ? 'Breached' : 'Pending',
          slaDeadline: new Date(deadlineTime).toISOString()
        });
      }
    });

    return res.status(200).json({
      success: true,
      ptmStats,
      pendingResponsesCount,
      slaBreachedCount,
      teacherSlaStats
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── TEACHER: SUBMIT DIARY ENTRY ──────────────────────────────
export async function submitDiaryEntry(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { class_section_id, date, entry_text } = req.body;
    if (!class_section_id || !date || !entry_text) {
      return res.status(400).json({ success: false, error: 'class_section_id, date, and entry_text are required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('diary_entries')
      .upsert({
        institution_id: institutionId,
        class_section_id,
        teacher_id: req.user.id,
        date,
        entry_text
      }, { onConflict: 'class_section_id,date' })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, diary: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET DIARY ENTRIES ────────────────────────────────────────
export async function getDiaryEntries(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { class_section_id, date } = req.query;

    let query = supabaseAdmin
      .from('diary_entries')
      .select('*, users:teacher_id(name)')
      .eq('institution_id', institutionId);

    if (class_section_id) {
      query = query.eq('class_section_id', class_section_id);
    } else if (req.user?.role === 'Student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('class_section_id')
        .eq('user_id', req.user.id)
        .maybeSingle();
      if (student?.class_section_id) {
        query = query.eq('class_section_id', student.class_section_id);
      }
    }

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, diaries: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── TRIGGER BULK DEFAULTER WHATSAPP NOTICES ─────────────────
export async function triggerBulkDefaulterNotice(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { student_ids, message_template } = req.body;
    if (!Array.isArray(student_ids) || student_ids.length === 0 || !message_template) {
      return res.status(400).json({ success: false, error: 'student_ids list and message_template are required.' });
    }

    // Fetch details for each student
    const { data: students, error } = await supabaseAdmin
      .from('students')
      .select('id, name, guardian_phone, guardian_name, class_sections(grade, section)')
      .in('id', student_ids)
      .eq('institution_id', institutionId);

    if (error) return res.status(500).json({ success: false, error: error.message });

    let successCount = 0;

    for (const student of (students || [])) {
      if (!student.guardian_phone) continue;

      let msg = message_template
        .replace(/{student_name}/g, student.name || 'your child')
        .replace(/{parent_name}/g, student.guardian_name || 'Parent')
        .replace(/{grade}/g, `Grade ${(student.class_sections as any)?.grade || 1}-${(student.class_sections as any)?.section || 'A'}`);

      const sent = await sendTextMessage(student.guardian_phone, msg, 'fee_escalation');
      if (sent) successCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Bulk final notices dispatched. Successfully sent ${successCount} WhatsApp messages to parents.`,
      count: successCount
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET CLASS TEACHER'S HOME CLASS OVERVIEW WIDGET DATA ───────
export async function getMyClassOverview(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    // 1. Find section where this user is Class Teacher
    const { data: section, error: secErr } = await supabaseAdmin
      .from('class_sections')
      .select('id, grade, section')
      .eq('class_teacher_id', req.user.id)
      .eq('institution_id', institutionId)
      .maybeSingle();

    if (secErr || !section) {
      return res.status(200).json({ success: true, hasClass: false });
    }

    // 2. Fetch all students in this section
    const { data: students, error: studErr } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('class_section_id', section.id);

    if (studErr) throw studErr;
    const studentIds = students?.map((s: any) => s.id) || [];

    // 3. Today's Attendance status
    const todayStr = new Date().toISOString().split('T')[0];
    let attendanceStatus = 'Pending';
    if (studentIds.length > 0) {
      const { count: attendanceCount, error: attErr } = await supabaseAdmin
        .from('school_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', todayStr)
        .in('student_id', studentIds);

      if (!attErr && attendanceCount && attendanceCount > 0) {
        attendanceStatus = 'Submitted';
      }
    } else {
      attendanceStatus = 'Submitted'; // Trivial
    }

    // 4. Pending Leave applications from their class
    let pendingLeavesCount = 0;
    if (studentIds.length > 0) {
      const { count: leavesCount, error: leavesErr } = await supabaseAdmin
        .from('student_leave_applications')
        .select('*', { count: 'exact', head: true })
        .in('student_id', studentIds)
        .in('status', ['pending', 'faculty_approved']);

      if (!leavesErr && leavesCount) {
        pendingLeavesCount = leavesCount;
      }
    }

    // 5. Active parent messages requiring SLA response
    // Fetch parent messages involving this teacher
    const { data: messages, error: msgErr } = await supabaseAdmin
      .from('parent_messages')
      .select('*, sender:sender_id(role)')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: true });

    let activeSlaCount = 0;
    if (!msgErr && messages) {
      const threadMap = new Map<string, any[]>();
      messages.forEach((msg: any) => {
        const isParentSender = msg.sender?.role === 'Parent' || msg.sender_role === 'Parent';
        const parentId = isParentSender ? msg.sender_id : msg.receiver_id;
        const teacherId = isParentSender ? msg.receiver_id : msg.sender_id;
        if (teacherId === req.user.id) {
          const key = `${parentId}_${teacherId}`;
          if (!threadMap.has(key)) {
            threadMap.set(key, []);
          }
          threadMap.get(key)!.push(msg);
        }
      });

      threadMap.forEach((threadMessages) => {
        const latestMsg = threadMessages[threadMessages.length - 1];
        const isParentLatest = latestMsg.sender_role === 'Parent' || latestMsg.sender?.role === 'Parent';
        if (isParentLatest) {
          activeSlaCount++;
        }
      });
    }

    return res.status(200).json({
      success: true,
      hasClass: true,
      class_section_id: section.id,
      grade: section.grade,
      section: section.section,
      attendanceStatus,
      pendingLeavesCount,
      activeSlaCount
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

