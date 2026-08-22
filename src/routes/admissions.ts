import { Router } from 'express';
import {
  getInstitutionAdmissions,
  getOpenPrograms,
  registerApplicant,
  verifyOTP,
  getPublicMeritList,
  trackApplication,
  trackAcceptOffer,
  trackDeclineOffer,
  trackBookCounseling,
  getMyApplication,
  updatePersonalDetails,
  selectPrograms,
  uploadAcademicRecord,
  uploadDocument,
  submitApplication,
  initiatePayment,
  verifyPayment,
  getApplications,
  verifyDocument,
  rejectDocument,
  aiAssistVerify,
  autoShortlist,
  calculateMeritScores,
  generateMeritList,
  publishMeritList,
  predictAdmissionClaude,
  generateOffersBulk,
  acceptOffer,
  declineOffer,
  createCounselingSession,
  assignCounselingSlot,
  counselingCheckin,
  getLeads,
  createLead,
  updateLead,
  sendBulkMessage,
  convertToStudent,
  getAnalyticsDashboard,
  getAnalyticsFunnel,
  getReports
} from '../controllers/admissions';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// ============================================================
// PUBLIC ROUTINGS (NO AUTH)
// ============================================================
router.get('/track', trackApplication);
router.post('/track/offer/accept', trackAcceptOffer);
router.post('/track/offer/decline', trackDeclineOffer);
router.post('/track/counseling/book', trackBookCounseling);

router.get('/:slug', getInstitutionAdmissions);
router.get('/:slug/programs', getOpenPrograms);
router.post('/register', registerApplicant);
router.post('/verify-otp', verifyOTP);
router.get('/merit-list/:round', getPublicMeritList);

// ============================================================
// OFFICERS & ADMINS ROUTINGS
// ============================================================
router.get('/applications', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), getApplications);
router.post('/documents/:id/verify', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), verifyDocument);
router.post('/documents/:id/reject', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), rejectDocument);
router.post('/documents/:id/ai-verify', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), aiAssistVerify);
router.post('/shortlist/auto', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), autoShortlist);
router.post('/merit/calculate', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), calculateMeritScores);
router.post('/merit-lists/generate', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), generateMeritList);
router.put('/merit-lists/:id/publish', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), publishMeritList);
router.get('/merit/predict', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), predictAdmissionClaude);
router.post('/offers/generate-bulk', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), generateOffersBulk);

// COUNSELING MAPPING
router.post('/counseling/sessions', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), createCounselingSession);
router.post('/counseling/slots', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), assignCounselingSlot);
router.put('/counseling/slots/:id/checkin', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), counselingCheckin);

// ANALYTICS & AUDITS
router.get('/analytics/dashboard', authMiddleware, requireRole(['Admin', 'SuperAdmin']), getAnalyticsDashboard);
router.get('/analytics/funnel', authMiddleware, requireRole(['Admin', 'SuperAdmin']), getAnalyticsFunnel);
router.get('/reports/:type', authMiddleware, requireRole(['Admin', 'SuperAdmin']), getReports);

// CONVERT TRIGGER
router.post('/convert/:applicantId', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), convertToStudent);

// ============================================================
// CRM ROUTINGS
// ============================================================
router.get('/crm/leads', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), getLeads);
router.post('/crm/leads', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), createLead);
router.put('/crm/leads/:id', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), updateLead);
router.post('/crm/bulk-message', authMiddleware, requireRole(['Admin', 'SuperAdmin', 'Admissions Officer']), sendBulkMessage);

export default router;
