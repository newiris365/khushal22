-- Migration: Enhance School Capabilities and Parent-Student Verification
-- Date: 2026-08-17

-- 1. Add class_section_id to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS class_section_id UUID REFERENCES class_sections(id) ON DELETE SET NULL;

-- 2. Create index on class_section_id
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class_section_id);

-- 3. Backfill initial class_section_id values based on student's semester (which maps to grade in schools)
UPDATE students s
SET class_section_id = cs.id
FROM class_sections cs
WHERE s.semester = cs.grade
  AND cs.section = 'A'
  AND s.class_section_id IS NULL;

-- 4. Redefine parent-student linking function to default to unverified unless phone numbers match
CREATE OR REPLACE FUNCTION link_parent_to_child(
    p_roll_number VARCHAR,
    p_child_dob DATE
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    student_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student RECORD;
    v_user_id UUID;
    v_parent_phone VARCHAR;
    v_verified BOOLEAN := false;
BEGIN
    v_user_id := auth.uid();

    -- Find student by roll number
    SELECT s.id, s.user_id, s.dob, s.institution_id, s.guardian_phone, u.name AS full_name
    INTO v_student
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.roll_number = p_roll_number
      AND s.is_active = true;

    IF v_student IS NULL THEN
        success := false;
        message := 'No active student found with this roll number.';
        student_id := NULL;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Verify DOB matches (additional security layer)
    IF v_student.dob != p_child_dob THEN
        success := false;
        message := 'Date of birth does not match our records.';
        student_id := NULL;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Get parent phone number from users table
    SELECT phone INTO v_parent_phone FROM users WHERE id = v_user_id;

    -- Auto-verify if parent phone matches student guardian_phone
    IF v_parent_phone IS NOT NULL AND v_student.guardian_phone IS NOT NULL AND 
       regexp_replace(v_parent_phone, '[^0-9]', '', 'g') = regexp_replace(v_student.guardian_phone, '[^0-9]', '', 'g') THEN
        v_verified := true;
    END IF;

    -- Check if already linked and verified
    IF EXISTS (
        SELECT 1 FROM parent_student_links
        WHERE parent_user_id = v_user_id
          AND student_id = v_student.id
          AND verified = true
    ) THEN
        success := true;
        message := 'This student is already linked to your account.';
        student_id := v_student.id;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Create or update link
    INSERT INTO parent_student_links (parent_user_id, student_id, verified, relationship)
    VALUES (v_user_id, v_student.id, v_verified, 'Guardian')
    ON CONFLICT (parent_user_id, student_id)
    DO UPDATE SET verified = v_verified;

    -- Update parent profile if it's verified
    IF v_verified THEN
        UPDATE parent_profiles SET is_verified = true, verified_at = NOW()
        WHERE user_id = v_user_id;
    END IF;

    success := true;
    IF v_verified THEN
        message := 'Successfully linked and auto-verified student ' || v_student.full_name;
    ELSE
        message := 'Linked student ' || v_student.full_name || '. Access pending administrator verification.';
    END IF;
    student_id := v_student.id;
    RETURN NEXT;
END;
$$;
