import { Router } from 'express';
import {
  getEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  uploadEmployeeDocument,
  getOrgChart,
  runPayroll,
  getPayrollRuns,
  approvePayrollRun,
  disbursePayrollRun,
  publishPayslips,
  getPayslips,
  getMyPayslips,
  getPayslipPdf,
  getEcrReport,
  getForm16Pdf,
  getLeaveTypes,
  getLeaveBalance,
  applyLeave,
  approveLeave,
  rejectLeave,
  getLeaveCalendar,
  getAttendanceHistory,
  regularizeAttendance,
  approveRegularize,
  getAppraisalCycles,
  getAppraisalCount,
  createAppraisalCycle,
  selfSubmitAppraisal,
  hodReviewAppraisal,
  vpReviewAppraisal,
  finalizeAppraisal,
  aiAppraisalAnalysis,
  submitTdsDeclaration,
  getTdsDeclaration,
  getHeadcountReport,
  getSalarySummaryReport,
  getLeaveLiabilityReport,
  getAttritionReport,
  aiHrChatbot,
  getMyLeaveBalance,
  getMyLeaveApplications,
  getMyEmployeeDocuments,
  uploadMyDocument,
  getMyTdsDeclaration,
  getDepartmentPendingLeaves,
  getDepartmentPendingAppraisals
} from '../controllers/hr';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// ──── EMPLOYEES ────────────────────────────────────────────────
router.get('/employees', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Principal', 'HOD', 'Vice Principal']), getEmployees);
router.post('/employees', requireRole(['Admin', 'SuperAdmin', 'HR Admin']), createEmployee);
router.get('/employees/:id', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'HOD', 'Staff', 'Principal', 'Vice Principal']), getEmployee);
router.put('/employees/:id', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff']), updateEmployee);
router.post('/employees/:id/documents', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff']), uploadEmployeeDocument);
router.get('/documents/me', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'Teacher', 'HOD', 'Principal', 'Vice Principal']), getMyEmployeeDocuments);
router.post('/documents/me', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'Teacher', 'HOD', 'Principal', 'Vice Principal']), uploadMyDocument);
router.get('/org-chart', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'HOD', 'Staff', 'Principal']), getOrgChart);

// ──── PAYROLL ──────────────────────────────────────────────────
router.post('/payroll/run', requireRole(['Admin', 'SuperAdmin', 'HR Admin']), runPayroll);
router.get('/payroll/runs', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Principal']), getPayrollRuns);
router.put('/payroll/runs/:id/approve', requireRole(['Admin', 'SuperAdmin', 'Principal']), approvePayrollRun);
router.put('/payroll/runs/:id/disburse', requireRole(['Admin', 'SuperAdmin', 'HR Admin']), disbursePayrollRun);
router.get('/payslips/me', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'Teacher', 'HOD', 'Principal', 'Driver', 'Vice Principal']), getMyPayslips);
router.get('/payslips/:employeeId', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'Principal', 'Driver']), getPayslips);
router.get('/payslips/download/:id', getPayslipPdf); // Download handler via direct link
router.post('/payroll/runs/:id/publish-payslips', requireRole(['Admin', 'SuperAdmin', 'HR Admin']), publishPayslips);
router.get('/payroll/reports/ecr', requireRole(['Admin', 'SuperAdmin', 'HR Admin']), getEcrReport);
router.get('/payroll/reports/form16/:employeeId', getForm16Pdf);

// ──── LEAVES ───────────────────────────────────────────────────
router.get('/leave/types', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'Teacher', 'HOD', 'Principal', 'Vice Principal']), getLeaveTypes);
router.get('/leave/balance/me', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'Teacher', 'HOD', 'Principal', 'Vice Principal']), getMyLeaveBalance);
router.get('/leave/balance/:employeeId', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'HOD', 'Principal']), getLeaveBalance);
router.get('/leave/my-history', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'Teacher', 'HOD', 'Principal', 'Vice Principal']), getMyLeaveApplications);
router.get('/leave/department-pending', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'HOD', 'Principal', 'Vice Principal']), getDepartmentPendingLeaves);
router.post('/leave/apply', requireRole(['Staff', 'Teacher', 'HOD', 'HR Admin', 'Admin', 'SuperAdmin']), applyLeave);
router.put('/leave/:id/approve', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Principal', 'HR Admin']), approveLeave);
router.put('/leave/:id/reject', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Principal', 'HR Admin']), rejectLeave);
router.get('/leave/calendar', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'HOD', 'Principal']), getLeaveCalendar);

// ──── ATTENDANCE ───────────────────────────────────────────────
router.get('/attendance/:employeeId/:month/:year', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'HOD', 'Principal']), getAttendanceHistory);
router.post('/attendance/regularize', requireRole(['Staff', 'HOD', 'Teacher', 'HR Admin']), regularizeAttendance);
router.put('/attendance/regularize/:id/approve', requireRole(['Admin', 'SuperAdmin', 'HOD', 'Principal']), approveRegularize);

// ──── APPRAISAL ────────────────────────────────────────────────
router.get('/appraisal/cycles', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'HOD', 'Principal', 'Vice Principal']), getAppraisalCycles);
router.get('/appraisal/count', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'HOD', 'Principal', 'Vice Principal']), getAppraisalCount);
router.get('/appraisal/department-pending', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'HOD', 'Principal', 'Vice Principal']), getDepartmentPendingAppraisals);
router.post('/appraisal/cycles', requireRole(['Admin', 'SuperAdmin', 'HR Admin']), createAppraisalCycle);
router.post('/appraisal/self-submit', requireRole(['Staff', 'Teacher', 'HOD', 'HR Admin', 'Admin', 'SuperAdmin']), selfSubmitAppraisal);
router.put('/appraisal/:id/hod-review', requireRole(['Admin', 'SuperAdmin', 'HOD', 'HR Admin', 'Vice Principal']), hodReviewAppraisal);
router.put('/appraisal/:id/vp-review', requireRole(['Admin', 'SuperAdmin', 'Vice Principal']), vpReviewAppraisal);
router.put('/appraisal/:id/finalize', requireRole(['Admin', 'SuperAdmin', 'Principal']), finalizeAppraisal);
router.get('/appraisal/ai-analysis/:employeeId', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Principal']), aiAppraisalAnalysis);

// ──── TDS DECLARATIONS ─────────────────────────────────────────
router.get('/tds/me', requireRole(['Staff', 'Teacher', 'HOD', 'HR Admin', 'Admin', 'SuperAdmin']), getMyTdsDeclaration);
router.post('/tds/declaration', requireRole(['Staff', 'Teacher', 'HOD', 'HR Admin', 'Admin', 'SuperAdmin']), submitTdsDeclaration);
router.get('/tds/declaration/:employeeId/:year', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Staff', 'HOD', 'Principal']), getTdsDeclaration);

// ──── STATUTORY REPORTS ────────────────────────────────────────
router.get('/reports/headcount', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Principal']), getHeadcountReport);
router.get('/reports/salary-summary', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Principal']), getSalarySummaryReport);
router.get('/reports/leave-liability', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Principal']), getLeaveLiabilityReport);
router.get('/reports/attrition', requireRole(['Admin', 'SuperAdmin', 'HR Admin', 'Principal']), getAttritionReport);

// ──── AI POLICY CHATBOT ────────────────────────────────────────
router.post('/ai/chatbot', requireRole(['Staff', 'HOD', 'Admin', 'SuperAdmin', 'HR Admin', 'Principal']), aiHrChatbot);

export default router;
