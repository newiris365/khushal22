-- Migration: Update orphaned school performance appraisals from pending_hod to pending_vp
UPDATE performance_appraisals
SET status = 'pending_vp'
WHERE status = 'pending_hod'
  AND (
    institution_id IN (SELECT id FROM institutions WHERE type = 'school')
    OR cycle_id IN (
      SELECT pc.id FROM performance_cycles pc
      JOIN institutions i ON pc.institution_id = i.id
      WHERE i.type = 'school'
    )
  );
