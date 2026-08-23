-- Migration: Create dvv_queries table for NAAC DVV Clarifications Module
CREATE TABLE IF NOT EXISTS public.dvv_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    metric_code TEXT NOT NULL,
    query_text TEXT NOT NULL,
    response_text TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

ALTER TABLE public.dvv_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access to dvv_queries" ON public.dvv_queries FOR ALL USING (true);
