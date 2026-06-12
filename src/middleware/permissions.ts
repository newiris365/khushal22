import { Request, Response, NextFunction } from 'express';
import { supabaseServiceRole } from '../config/supabase';

// Feature toggle check: blocks access if a module is disabled for the institution
export function requireFeature(featureKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    // SuperAdmin bypasses feature checks
    if (req.user.role === 'SuperAdmin') {
      return next();
    }

    try {
      const { data, error } = await supabaseServiceRole
        .from('institution_features')
        .select('enabled')
        .eq('institution_id', req.user.institution_id)
        .eq('feature_key', featureKey)
        .single();

      if (error || !data) {
        // Default to enabled if no record found
        return next();
      }

      if (!data.enabled) {
        return res.status(403).json({
          success: false,
          error: `The '${featureKey}' module is not enabled for your institution.`
        });
      }

      next();
    } catch (err) {
      console.error('Feature check error:', err);
      next(); // Fail open
    }
  };
}

// Module permission check: verifies read/write/delete for the user's role
export function requireModulePermission(module: string, action: 'read' | 'write' | 'delete') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    // SuperAdmin bypasses all permission checks
    if (req.user.role === 'SuperAdmin') {
      return next();
    }

    try {
      const { data, error } = await supabaseServiceRole
        .from('module_permissions')
        .select('can_read, can_write, can_delete')
        .eq('institution_id', req.user.institution_id)
        .eq('role', req.user.role)
        .eq('module', module)
        .single();

      if (error || !data) {
        // No permission record found: default deny for write/delete, allow read
        if (action === 'read') return next();
        return res.status(403).json({
          success: false,
          error: `Your role '${req.user.role}' does not have '${action}' permission for '${module}'.`
        });
      }

      const hasPermission =
        (action === 'read' && data.can_read) ||
        (action === 'write' && data.can_write) ||
        (action === 'delete' && data.can_delete);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Your role '${req.user.role}' does not have '${action}' permission for '${module}'.`
        });
      }

      next();
    } catch (err) {
      console.error('Permission check error:', err);
      next(); // Fail open
    }
  };
}
