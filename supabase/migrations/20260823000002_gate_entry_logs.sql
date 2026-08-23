-- ============================================================
-- GATE ENTRY LOGS MIGRATION
-- Table and RLS policies for tracking person entries and exits
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gate_entry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    person_id TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    person_name TEXT NOT NULL,
    person_type TEXT NOT NULL DEFAULT 'student', -- 'student', 'staff', 'visitor', 'guest'
    gate_number TEXT NOT NULL DEFAULT 'Gate 1',
    scanned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    direction TEXT NOT NULL CHECK (direction IN ('entry', 'exit')),
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gate_entry_logs ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "Gate entry logs select policy" ON public.gate_entry_logs;
CREATE POLICY "Gate entry logs select policy"
    ON public.gate_entry_logs FOR SELECT
    USING (
        institution_id IS NULL OR institution_id = get_auth_institution_id()
    );

-- Insert policy
DROP POLICY IF EXISTS "Gate entry logs insert policy" ON public.gate_entry_logs;
CREATE POLICY "Gate entry logs insert policy"
    ON public.gate_entry_logs FOR INSERT
    WITH CHECK (
        institution_id IS NULL OR institution_id = get_auth_institution_id()
    );

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_gate_entry_logs_institution_scanned 
    ON public.gate_entry_logs(institution_id, scanned_at DESC);
