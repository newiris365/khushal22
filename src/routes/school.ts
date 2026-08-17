import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  listClassSections,
  createClassSection,
  updateClassSection,
  deleteClassSection,
  listTeachers,
  setupSchema,
  markDailyAttendance,
  getPrincipalDashboardMetrics,
  bulkVerifyParentLinks,
} from '../controllers/school';

const router = Router();

router.use(authMiddleware);

router.get('/classes', requireRole(['Admin', 'SuperAdmin', 'Director', 'Principal', 'Teacher']), listClassSections);
router.post('/classes', requireRole(['Admin', 'SuperAdmin', 'Director', 'Principal']), createClassSection);
router.put('/classes/:id', requireRole(['Admin', 'SuperAdmin', 'Director', 'Principal']), updateClassSection);
router.delete('/classes/:id', requireRole(['Admin', 'SuperAdmin', 'Director', 'Principal']), deleteClassSection);

router.get('/teachers', requireRole(['Admin', 'SuperAdmin', 'Director', 'Principal', 'Teacher']), listTeachers);

router.post('/attendance/mark', requireRole(['Admin', 'SuperAdmin', 'Teacher']), markDailyAttendance);
router.get('/principal/metrics', requireRole(['Admin', 'SuperAdmin', 'Director', 'Principal']), getPrincipalDashboardMetrics);
router.post('/admin/verify-links', requireRole(['Admin', 'SuperAdmin']), bulkVerifyParentLinks);

router.post('/setup/schema', requireRole(['Admin', 'SuperAdmin']), setupSchema);

export default router;

