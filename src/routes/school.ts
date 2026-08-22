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
  getGradeWiseAnalytics,
  getTeacherActivity,
  getSchoolFeeOversight,
  getParentEngagement,
  submitDiaryEntry,
  getDiaryEntries,
  triggerBulkDefaulterNotice,
  getMyClassOverview
} from '../controllers/school';

import { markSchoolDailyRegister } from '../controllers/campusCore';
import { 
  postHomework, 
  updateDiary, 
  logBehaviorIncident, 
  getBehaviorLogs,
  getDisciplineIncidents,
  createDisciplineIncident,
  updateDisciplineIncident
} from '../controllers/schoolDiary';

const router = Router();

router.use(authMiddleware);

router.get('/classes', requireRole(['Admin', 'SuperAdmin', 'Principal', 'Teacher']), listClassSections);
router.post('/classes', requireRole(['Admin', 'SuperAdmin', 'Principal']), createClassSection);
router.put('/classes/:id', requireRole(['Admin', 'SuperAdmin', 'Principal']), updateClassSection);
router.delete('/classes/:id', requireRole(['Admin', 'SuperAdmin', 'Principal']), deleteClassSection);

router.get('/teachers', requireRole(['Admin', 'SuperAdmin', 'Principal', 'Teacher']), listTeachers);

router.post('/attendance/mark', requireRole(['Admin', 'SuperAdmin', 'Teacher']), markDailyAttendance);
router.get('/principal/metrics', requireRole(['Admin', 'SuperAdmin', 'Principal']), getPrincipalDashboardMetrics);
router.post('/admin/verify-links', requireRole(['Admin', 'SuperAdmin']), bulkVerifyParentLinks);

// New Principal Portal school capability routes
router.get('/analytics/grades', requireRole(['Admin', 'SuperAdmin', 'Principal']), getGradeWiseAnalytics);
router.get('/analytics/teacher-activity', requireRole(['Admin', 'SuperAdmin', 'Principal']), getTeacherActivity);
router.get('/analytics/fees', requireRole(['Admin', 'SuperAdmin', 'Principal']), getSchoolFeeOversight);
router.get('/analytics/parent-engagement', requireRole(['Admin', 'SuperAdmin', 'Principal']), getParentEngagement);
router.post('/notifications/bulk-whatsapp', requireRole(['Admin', 'SuperAdmin', 'Principal']), triggerBulkDefaulterNotice);

// New Teacher Portal school capability routes
router.post('/attendance/daily-register', requireRole(['Admin', 'SuperAdmin', 'Teacher']), markSchoolDailyRegister);
router.get('/teacher/my-class-overview', requireRole(['Admin', 'SuperAdmin', 'Teacher']), getMyClassOverview);
router.post('/homework', requireRole(['Admin', 'SuperAdmin', 'Teacher']), postHomework);
router.post('/diary', requireRole(['Admin', 'SuperAdmin', 'Teacher']), updateDiary);
router.get('/diary', requireRole(['Admin', 'SuperAdmin', 'Principal', 'Teacher', 'Student', 'Parent']), getDiaryEntries);
router.post('/behavior', requireRole(['Admin', 'SuperAdmin', 'Principal', 'Vice Principal', 'Teacher']), logBehaviorIncident);
router.get('/behavior', requireRole(['Admin', 'SuperAdmin', 'Principal', 'Vice Principal', 'Teacher', 'Student', 'Parent']), getBehaviorLogs);

router.get('/discipline', requireRole(['Admin', 'SuperAdmin', 'Vice Principal', 'Principal', 'Teacher']), getDisciplineIncidents);
router.post('/discipline', requireRole(['Admin', 'SuperAdmin', 'Vice Principal', 'Principal', 'Teacher']), createDisciplineIncident);
router.patch('/discipline/:id', requireRole(['Admin', 'SuperAdmin', 'Vice Principal', 'Principal']), updateDisciplineIncident);

router.post('/setup/schema', requireRole(['Admin', 'SuperAdmin']), setupSchema);

export default router;

