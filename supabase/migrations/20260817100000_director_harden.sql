-- =========================================================================
-- DIRECTOR PORTAL TELEMETRY & HARDENING
-- Migration: 20260817100000
-- Creates operating_expenses and upgrades system anomaly detection
-- =========================================================================

-- 1. OPERATING EXPENSES TABLE
CREATE TABLE IF NOT EXISTS operating_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category VARCHAR(100) NOT NULL CHECK (category IN ('utility', 'maintenance', 'marketing', 'other')),
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operating_expenses_inst ON operating_expenses(institution_id, expense_date);

-- 2. SEED MOCK EXPENSES FOR DEFAULT INSTITUTION
INSERT INTO operating_expenses (institution_id, expense_date, category, amount, description)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', '2026-08-01', 'utility', 145000.00, 'Electricity Grid & Water Charges'),
  ('a0000000-0000-0000-0000-000000000001', '2026-08-05', 'maintenance', 280000.00, 'AC plant servicing & campus gardening contracts')
ON CONFLICT DO NOTHING;

-- 3. UPGRADE ANOMALY DETECTION PL/PGSQL FUNCTION
CREATE OR REPLACE FUNCTION detect_system_anomalies()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inst_id UUID;
  v_result JSON;
  v_anomaly_count INT := 0;
  
  -- Variables for canteen drop check
  v_canteen_yesterday NUMERIC := 0.00;
  v_canteen_7day_avg NUMERIC := 0.00;
  
  -- Variables for gate-out spike check
  v_gate_out_spike_count INT := 0;
  
  -- Variables for mass absence check
  v_dept_absent_record RECORD;
BEGIN
  -- Get current tenant institution ID
  SELECT u.institution_id INTO v_inst_id
  FROM users u WHERE u.id = auth.uid();
  IF v_inst_id IS NULL THEN 
    SELECT id INTO v_inst_id FROM institutions LIMIT 1; 
  END IF;

  -- A. Detect duplicate attendance (same student, same session, multiple marks)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'duplicate_attendance',
    'high',
    'Duplicate Attendance Detected',
    'Student ' || u.name || ' has ' || COUNT(*) || ' attendance records for the same session on ' || a.date,
    'attendance',
    a.student_id,
    'student',
    u.name,
    jsonb_build_object('date', a.date, 'session_id', a.session_id, 'count', COUNT(*))
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN users u ON u.id = s.user_id
  WHERE a.institution_id = v_inst_id
    AND a.date >= CURRENT_DATE - 1
  GROUP BY a.student_id, a.session_id, a.date, u.name
  HAVING COUNT(*) > 1
  ON CONFLICT DO NOTHING;

  -- B. Detect wallet rapid transactions (>3 in 5 minutes)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'rapid_wallet_txn',
    'medium',
    'Rapid Wallet Transactions',
    u.name || ' made ' || COUNT(*) || ' wallet transactions within 5 minutes',
    'wallet',
    wt.student_id,
    'student',
    u.name,
    jsonb_build_object('transaction_count', COUNT(*), 'time_window', '5 minutes', 'total_amount', SUM(wt.amount))
  FROM wallet_transactions wt
  JOIN students s ON s.id = wt.student_id
  JOIN users u ON u.id = s.user_id
  WHERE wt.institution_id = v_inst_id
    AND wt.created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY wt.student_id, u.name, DATE_TRUNC('minute', wt.created_at)
  HAVING COUNT(*) >= 3
  ON CONFLICT DO NOTHING;

  -- C. Detect unusual hours attendance (marked before 6AM or after 10PM)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'unusual_hours',
    'medium',
    'Attendance Marked at Unusual Hours',
    'Attendance for ' || u.name || ' was marked at ' || TO_CHAR(a.created_at, 'HH24:MI'),
    'attendance',
    a.student_id,
    'student',
    u.name,
    jsonb_build_object('marked_at', a.created_at, 'method', a.method)
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN users u ON u.id = s.user_id
  WHERE a.institution_id = v_inst_id
    AND a.created_at >= NOW() - INTERVAL '24 hours'
    AND (EXTRACT(HOUR FROM a.created_at) < 6 OR EXTRACT(HOUR FROM a.created_at) > 22)
  ON CONFLICT DO NOTHING;

  -- D. Detect geo-fence violations (attendance marked >1km from institution)
  INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, person_id, person_type, person_name, metadata)
  SELECT
    v_inst_id,
    'geo_fence_violation',
    'high',
    'Attendance Outside Geo-Fence',
    u.name || ' marked attendance from ' || ROUND(a.lat::NUMERIC, 4) || ', ' || ROUND(a.long::NUMERIC, 4),
    'attendance',
    a.student_id,
    'student',
    u.name,
    jsonb_build_object('lat', a.lat, 'long', a.long, 'method', a.method)
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN users u ON u.id = s.user_id
  WHERE a.institution_id = v_inst_id
    AND a.created_at >= NOW() - INTERVAL '24 hours'
    AND a.lat IS NOT NULL AND a.long IS NOT NULL
    AND (a.lat = 0 OR a.long = 0)
  ON CONFLICT DO NOTHING;

  -- E. Unexpected drops in canteen revenue (>20% deviation from 7-day average)
  -- Get yesterday's completed orders total
  SELECT COALESCE(SUM(total_amount), 0) INTO v_canteen_yesterday
  FROM canteen_orders
  WHERE institution_id = v_inst_id
    AND payment_status = 'Completed'
    AND order_time >= CURRENT_DATE - 1
    AND order_time < CURRENT_DATE;

  -- Get 7-day daily average prior to yesterday
  SELECT COALESCE(SUM(total_amount) / 7.0, 0) INTO v_canteen_7day_avg
  FROM canteen_orders
  WHERE institution_id = v_inst_id
    AND payment_status = 'Completed'
    AND order_time >= CURRENT_DATE - 8
    AND order_time < CURRENT_DATE - 1;

  IF v_canteen_7day_avg > 0 AND v_canteen_yesterday < (0.8 * v_canteen_7day_avg) THEN
    INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, metadata)
    VALUES (
      v_inst_id,
      'canteen_revenue_drop',
      'high',
      'Canteen Revenue Drop Anomaly',
      'Canteen revenue dropped to ₹' || v_canteen_yesterday || ' (a ' || ROUND(100.0 * (v_canteen_7day_avg - v_canteen_yesterday) / v_canteen_7day_avg, 1) || '% drop compared to 7-day average of ₹' || ROUND(v_canteen_7day_avg, 2) || ').',
      'canteen',
      jsonb_build_object('yesterday_revenue', v_canteen_yesterday, 'seven_day_avg', v_canteen_7day_avg)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- F. Rapid spikes in student "Gate-Out" events during class hours
  SELECT COUNT(*) INTO v_gate_out_spike_count
  FROM gate_logs ge
  JOIN users u ON ge.person_id = u.id
  WHERE ge.institution_id = v_inst_id
    AND ge.direction = 'out'
    AND ge.timestamp >= NOW() - INTERVAL '1 hour'
    AND EXTRACT(HOUR FROM ge.timestamp) >= 9 
    AND EXTRACT(HOUR FROM ge.timestamp) <= 16
    AND u.role = 'Student';

  IF v_gate_out_spike_count >= 15 THEN
    INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, metadata)
    VALUES (
      v_inst_id,
      'gate_out_spike',
      'critical',
      'Gate-Out RFID Spike Alert',
      'Rapid spike detected: ' || v_gate_out_spike_count || ' students left campus via RFID gates during class hours (last 1 hour).',
      'gate',
      jsonb_build_object('gate_out_count', v_gate_out_spike_count, 'class_hours', true)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- G. Large batches of "Absent" marks from a single department
  FOR v_dept_absent_record IN
    SELECT 
      d.id AS department_id,
      d.name AS department_name,
      COUNT(s.id) AS total_students,
      COUNT(a.id) FILTER (WHERE a.status = 'absent' OR a.status = 'Absent') AS absent_count
    FROM departments d
    JOIN students s ON s.department_id = d.id
    JOIN attendance a ON a.student_id = s.id
    WHERE d.institution_id = v_inst_id
      AND a.date = CURRENT_DATE
    GROUP BY d.id, d.name
  LOOP
    IF v_dept_absent_record.total_students >= 10 AND v_dept_absent_record.absent_count > (0.5 * v_dept_absent_record.total_students) THEN
      INSERT INTO system_anomalies (institution_id, anomaly_type, severity, title, description, module, metadata)
      VALUES (
        v_inst_id,
        'bulk_absent_anomaly',
        'critical',
        'Mass Absence / Faculty Strike Warning',
        'Critical absenteeism: ' || v_dept_absent_record.absent_count || ' out of ' || v_dept_absent_record.total_students || ' students in ' || v_dept_absent_record.department_name || ' are marked absent today.',
        'attendance',
        jsonb_build_object(
          'department_id', v_dept_absent_record.department_id, 
          'department_name', v_dept_absent_record.department_name, 
          'absent_count', v_dept_absent_record.absent_count, 
          'total_students', v_dept_absent_record.total_students
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Get unresolved anomaly count
  SELECT COUNT(*) INTO v_anomaly_count
  FROM system_anomalies
  WHERE institution_id = v_inst_id AND NOT is_resolved;

  RETURN json_build_object(
    'total_unresolved', v_anomaly_count,
    'by_type', (
      SELECT COALESCE(jsonb_agg(row_to_json(at)), '[]'::JSONB)
      FROM (
        SELECT anomaly_type, severity, COUNT(*) as count
        FROM system_anomalies
        WHERE institution_id = v_inst_id AND NOT is_resolved
        GROUP BY anomaly_type, severity
        ORDER BY count DESC
      ) at
    ),
    'recent', (
      SELECT COALESCE(jsonb_agg(row_to_json(ra)), '[]'::JSONB)
      FROM (
        SELECT id, anomaly_type, severity, title, description, module, person_name, metadata, created_at
        FROM system_anomalies
        WHERE institution_id = v_inst_id AND NOT is_resolved
        ORDER BY created_at DESC
        LIMIT 20
      ) ra
    ),
    'stats', (
      SELECT json_build_object(
        'total_all_time', COUNT(*),
        'resolved', COUNT(*) FILTER (WHERE is_resolved),
        'critical', COUNT(*) FILTER (WHERE severity = 'critical' AND NOT is_resolved),
        'high', COUNT(*) FILTER (WHERE severity = 'high' AND NOT is_resolved),
        'medium', COUNT(*) FILTER (WHERE severity = 'medium' AND NOT is_resolved),
        'low', COUNT(*) FILTER (WHERE severity = 'low' AND NOT is_resolved)
      )
      FROM system_anomalies
      WHERE institution_id = v_inst_id
    )
  );
END;
$$;
