-- Migration: Add Daily Class Diary Table for School Teachers
-- Date: 2026-08-17

CREATE TABLE IF NOT EXISTS diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_section_id UUID NOT NULL REFERENCES class_sections(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    entry_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_section_date_diary UNIQUE (class_section_id, date)
);

-- Enable Row Level Security
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Users can select diary entries in their institution" ON diary_entries
    FOR SELECT USING (
        institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Teachers can manage diary entries in their institution" ON diary_entries
    FOR ALL USING (
        institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    );
