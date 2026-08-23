-- Create table for OBE Gap Analysis Intervention Plans
CREATE TABLE IF NOT EXISTS obe_intervention_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  department_id UUID,
  po_code VARCHAR(50) NOT NULL,
  action_plan TEXT NOT NULL,
  target_semester VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE obe_intervention_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read obe_intervention_plans"
  ON obe_intervention_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert obe_intervention_plans"
  ON obe_intervention_plans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update obe_intervention_plans"
  ON obe_intervention_plans FOR UPDATE
  TO authenticated
  USING (true);
