-- Migration: Fix student_fees table schema, missing columns, indexes, payment_status backfill, and RLS policies

-- 1. Ensure missing columns exist on student_fees table
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE;
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE;
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid'));

-- 2. Add indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_student_fees_institution_id ON student_fees(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_fee_structure_id ON student_fees(fee_structure_id);

-- 3. Backfill institution_id from students table if missing
UPDATE student_fees sf
SET institution_id = s.institution_id
FROM students s
WHERE sf.student_id = s.id AND sf.institution_id IS NULL;

-- 4. Backfill payment_status for existing rows
UPDATE student_fees
SET payment_status = CASE
    WHEN COALESCE(paid_amount, 0) >= COALESCE(total_amount, amount, 0) AND COALESCE(total_amount, amount, 0) > 0 THEN 'paid'
    WHEN COALESCE(paid_amount, 0) > 0 THEN 'partial'
    ELSE 'pending'
END
WHERE payment_status IS NULL OR payment_status = 'pending';

-- 5. Harden RLS policies on student_fees
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_fees_policy ON student_fees;
DROP POLICY IF EXISTS "student_fees_policy" ON student_fees;
DROP POLICY IF EXISTS "Allow full access to student_fees" ON student_fees;
DROP POLICY IF EXISTS "student_fees_select_policy" ON student_fees;
DROP POLICY IF EXISTS "student_fees_write_policy" ON student_fees;
DROP POLICY IF EXISTS "student_fees_insert_policy" ON student_fees;
DROP POLICY IF EXISTS "student_fees_update_policy" ON student_fees;
DROP POLICY IF EXISTS "student_fees_delete_policy" ON student_fees;

-- SELECT policy: institution_id must match caller's own institution_id via users table, SuperAdmin, or student/parent self-access
CREATE POLICY "student_fees_select_policy" ON student_fees
    FOR SELECT USING (
        institution_id = (SELECT u.institution_id FROM public.users u WHERE u.id = auth.uid())
        OR (SELECT u.role FROM public.users u WHERE u.id = auth.uid()) = 'SuperAdmin'
        OR student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
        OR student_id IN (SELECT psl.student_id FROM public.parent_student_links psl WHERE psl.parent_user_id = auth.uid() AND psl.verified = true)
    );

-- INSERT policy: restricted to Admin, SuperAdmin, Director roles
CREATE POLICY "student_fees_insert_policy" ON student_fees
    FOR INSERT WITH CHECK (
        ((SELECT u.role FROM public.users u WHERE u.id = auth.uid()) = 'SuperAdmin')
        OR (
            institution_id = (SELECT u.institution_id FROM public.users u WHERE u.id = auth.uid())
            AND (SELECT u.role FROM public.users u WHERE u.id = auth.uid()) IN ('Admin', 'SuperAdmin', 'Director')
        )
    );

-- UPDATE policy: restricted to Admin, SuperAdmin, Director roles
CREATE POLICY "student_fees_update_policy" ON student_fees
    FOR UPDATE USING (
        ((SELECT u.role FROM public.users u WHERE u.id = auth.uid()) = 'SuperAdmin')
        OR (
            institution_id = (SELECT u.institution_id FROM public.users u WHERE u.id = auth.uid())
            AND (SELECT u.role FROM public.users u WHERE u.id = auth.uid()) IN ('Admin', 'SuperAdmin', 'Director')
        )
    ) WITH CHECK (
        ((SELECT u.role FROM public.users u WHERE u.id = auth.uid()) = 'SuperAdmin')
        OR (
            institution_id = (SELECT u.institution_id FROM public.users u WHERE u.id = auth.uid())
            AND (SELECT u.role FROM public.users u WHERE u.id = auth.uid()) IN ('Admin', 'SuperAdmin', 'Director')
        )
    );

-- DELETE policy: restricted to Admin, SuperAdmin, Director roles
CREATE POLICY "student_fees_delete_policy" ON student_fees
    FOR DELETE USING (
        ((SELECT u.role FROM public.users u WHERE u.id = auth.uid()) = 'SuperAdmin')
        OR (
            institution_id = (SELECT u.institution_id FROM public.users u WHERE u.id = auth.uid())
            AND (SELECT u.role FROM public.users u WHERE u.id = auth.uid()) IN ('Admin', 'SuperAdmin', 'Director')
        )
    );
