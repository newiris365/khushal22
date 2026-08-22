-- Migration: Director Risk Predictor RPCs (get_dropout_risk_students and get_fee_risk_students)
-- Migration File: 20260822020000_director_risk_predictors.sql

-- 1. get_dropout_risk_students RPC
CREATE OR REPLACE FUNCTION get_dropout_risk_students(
    p_limit INT DEFAULT 10,
    p_institution_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    roll_number VARCHAR,
    name VARCHAR,
    department_name VARCHAR,
    attendance_rate NUMERIC,
    overdue_amount NUMERIC,
    risk_score INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inst_id UUID;
BEGIN
    v_inst_id := p_institution_id;
    IF v_inst_id IS NULL THEN
        SELECT u.institution_id INTO v_inst_id FROM users u WHERE u.id = auth.uid();
    END IF;
    IF v_inst_id IS NULL THEN
        SELECT inst.id INTO v_inst_id FROM institutions inst LIMIT 1;
    END IF;

    RETURN QUERY
    WITH student_att AS (
        SELECT
            a.student_id,
            COUNT(*)::NUMERIC AS total_days,
            COUNT(*) FILTER (WHERE LOWER(a.status) IN ('present', 'late'))::NUMERIC AS present_days
        FROM attendance a
        WHERE a.date >= (CURRENT_DATE - INTERVAL '30 days')
          AND (v_inst_id IS NULL OR a.institution_id = v_inst_id OR a.student_id IN (SELECT st.id FROM students st WHERE st.institution_id = v_inst_id))
        GROUP BY a.student_id
    ),
    student_fee_summary AS (
        SELECT
            sf.student_id,
            SUM(GREATEST(0, COALESCE(sf.total_amount, sf.amount, 0) - COALESCE(sf.paid_amount, 0))) AS total_overdue,
            SUM(COALESCE(sf.total_amount, sf.amount, 0)) AS total_fee
        FROM student_fees sf
        WHERE sf.payment_status IN ('pending', 'partial')
          AND (v_inst_id IS NULL OR sf.institution_id = v_inst_id)
        GROUP BY sf.student_id
    )
    SELECT
        s.id,
        COALESCE(s.roll_number, '')::VARCHAR AS roll_number,
        COALESCE(u.name, 'Student')::VARCHAR AS name,
        COALESCE(d.name, 'General')::VARCHAR AS department_name,
        ROUND(
            COALESCE((sa.present_days / NULLIF(sa.total_days, 0)) * 100.0, 100.0), 1
        )::NUMERIC AS attendance_rate,
        COALESCE(sfs.total_overdue, 0.00)::NUMERIC AS overdue_amount,
        ROUND(
            LEAST(100.0,
                -- 70% weight to attendance shortfall below 75%
                (GREATEST(0.0, 75.0 - COALESCE((sa.present_days / NULLIF(sa.total_days, 0)) * 100.0, 100.0)) / 75.0 * 70.0)
                +
                -- 30% weight to overdue fee ratio
                (LEAST(1.0, COALESCE(sfs.total_overdue, 0.0) / NULLIF(sfs.total_fee, 0.0)) * 30.0)
            )
        )::INT AS risk_score
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN departments d ON d.id = s.department_id
    LEFT JOIN student_att sa ON sa.student_id = s.id
    LEFT JOIN student_fee_summary sfs ON sfs.student_id = s.id
    WHERE (v_inst_id IS NULL OR s.institution_id = v_inst_id)
      AND (
          (sa.total_days IS NOT NULL AND (sa.present_days / NULLIF(sa.total_days, 0)) < 0.75)
          OR COALESCE(sfs.total_overdue, 0) > 0
      )
    ORDER BY risk_score DESC, overdue_amount DESC
    LIMIT p_limit;
END;
$$;

-- 2. get_fee_risk_students RPC
CREATE OR REPLACE FUNCTION get_fee_risk_students(
    p_limit INT DEFAULT 10,
    p_institution_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    roll_number VARCHAR,
    name VARCHAR,
    department_name VARCHAR,
    overdue_amount NUMERIC,
    days_overdue INT,
    default_likelihood VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inst_id UUID;
BEGIN
    v_inst_id := p_institution_id;
    IF v_inst_id IS NULL THEN
        SELECT u.institution_id INTO v_inst_id FROM users u WHERE u.id = auth.uid();
    END IF;
    IF v_inst_id IS NULL THEN
        SELECT inst.id INTO v_inst_id FROM institutions inst LIMIT 1;
    END IF;

    RETURN QUERY
    WITH fee_summary AS (
        SELECT
            sf.student_id,
            SUM(GREATEST(0, COALESCE(sf.total_amount, sf.amount, 0) - COALESCE(sf.paid_amount, 0))) AS total_overdue,
            MAX(
                CASE 
                    WHEN sf.due_date IS NOT NULL AND sf.due_date < CURRENT_DATE 
                    THEN (CURRENT_DATE - sf.due_date)
                    ELSE 0
                END
            ) AS max_days_overdue
        FROM student_fees sf
        WHERE sf.payment_status IN ('pending', 'partial')
          AND (v_inst_id IS NULL OR sf.institution_id = v_inst_id)
        GROUP BY sf.student_id
        HAVING SUM(GREATEST(0, COALESCE(sf.total_amount, sf.amount, 0) - COALESCE(sf.paid_amount, 0))) > 0
    )
    SELECT
        s.id,
        COALESCE(s.roll_number, '')::VARCHAR AS roll_number,
        COALESCE(u.name, 'Student')::VARCHAR AS name,
        COALESCE(d.name, 'General')::VARCHAR AS department_name,
        fs.total_overdue::NUMERIC AS overdue_amount,
        COALESCE(fs.max_days_overdue, 0)::INT AS days_overdue,
        CASE
            WHEN COALESCE(fs.max_days_overdue, 0) > 60 THEN 'High'::VARCHAR
            WHEN COALESCE(fs.max_days_overdue, 0) > 30 THEN 'Medium'::VARCHAR
            ELSE 'Low'::VARCHAR
        END AS default_likelihood
    FROM fee_summary fs
    JOIN students s ON s.id = fs.student_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN departments d ON d.id = s.department_id
    WHERE (v_inst_id IS NULL OR s.institution_id = v_inst_id)
    ORDER BY overdue_amount DESC, days_overdue DESC
    LIMIT p_limit;
END;
$$;
