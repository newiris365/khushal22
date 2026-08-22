-- Migration: Add discipline_incidents table for Vice Principal / School Discipline
-- Date: 2026-08-22

CREATE TABLE IF NOT EXISTS discipline_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL DEFAULT 'Behavioral',
    severity TEXT NOT NULL DEFAULT 'Minor' CHECK (severity IN ('Minor', 'Major', 'Severe')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE discipline_incidents ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Users can select discipline incidents in their institution" ON discipline_incidents
    FOR SELECT USING (
        institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Authorized staff can insert discipline incidents" ON discipline_incidents
    FOR INSERT WITH CHECK (
        institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Authorized staff can update discipline incidents" ON discipline_incidents
    FOR UPDATE USING (
        institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    );
