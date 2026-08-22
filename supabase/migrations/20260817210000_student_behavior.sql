-- Migration: Add Student Behavior logs and homework column to diary entries
-- Date: 2026-08-17

ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS homework TEXT;

CREATE TABLE IF NOT EXISTS student_behavior_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_type TEXT NOT NULL CHECK (log_type IN ('Incident', 'Achievement')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE student_behavior_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Users can select behavior logs in their institution" ON student_behavior_logs
    FOR SELECT USING (
        institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Teachers can insert behavior logs in their institution" ON student_behavior_logs
    FOR INSERT WITH CHECK (
        institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    );
