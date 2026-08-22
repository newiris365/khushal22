import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

// ─── CLASS TEACHER: POST HOMEWORK ─────────────────────────────
export async function postHomework(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { class_section_id, date, homework_text } = req.body;
    if (!class_section_id || !date || !homework_text) {
      return res.status(400).json({ success: false, error: 'class_section_id, date, and homework_text are required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('diary_entries')
      .upsert({
        institution_id: institutionId,
        class_section_id,
        teacher_id: req.user.id,
        date,
        homework: homework_text,
        entry_text: ''
      }, { onConflict: 'class_section_id,date' })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, diary: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── CLASS TEACHER: UPDATE DAILY DIARY ──────────────────────────
export async function updateDiary(req: Request, res: Response) {
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

// ─── TEACHER: LOG STUDENT BEHAVIOR LOG ────────────────────────
export async function logBehaviorIncident(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { student_id, log_type, title, description } = req.body;
    if (!student_id || !log_type || !title || !description) {
      return res.status(400).json({ success: false, error: 'student_id, log_type, title, and description are required.' });
    }

    if (log_type !== 'Incident' && log_type !== 'Achievement') {
      return res.status(400).json({ success: false, error: "log_type must be either 'Incident' or 'Achievement'." });
    }

    const { data, error } = await supabaseAdmin
      .from('student_behavior_logs')
      .insert({
        institution_id: institutionId,
        student_id,
        teacher_id: req.user.id,
        log_type,
        title,
        description
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, behaviorLog: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET BEHAVIOR LOGS ──────────────────────────────────────────
export async function getBehaviorLogs(req: Request, res: Response) {
  try {
    const institutionId = req.user?.institution_id;
    if (!institutionId) return res.status(400).json({ success: false, error: 'No institution context.' });

    const { student_id, log_type } = req.query;

    let query = supabaseAdmin
      .from('student_behavior_logs')
      .select('*, users:teacher_id(name), students:student_id(name)')
      .eq('institution_id', institutionId);

    if (student_id) {
      query = query.eq('student_id', student_id);
    }
    if (log_type) {
      query = query.eq('log_type', log_type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, behaviorLogs: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
