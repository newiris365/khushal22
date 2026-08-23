import { Router } from 'express';
import {
  getNaacCriteria,
  updateNaacMetric,
  uploadNaacDocument,
  getNaacDocuments,
  deleteNaacDocument,
  saveNaacNarrative,
  getNaacDashboard,
  syncFromModules,
  aiDraftNarrative,
  ssrGenerate,
  getScoreEstimate,
  getDvvQueries,
  createDvvQuery,
  respondDvvQuery
} from '../controllers/obe';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to protect all routes
router.use(authMiddleware);

// ──── CRITERIA & METRICS ───────────────────────────────────────
router.get('/criteria', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD']), getNaacCriteria);
router.put('/metrics/:id', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), updateNaacMetric);

// ──── EVIDENCE DOCUMENTS ───────────────────────────────────────
router.get('/documents', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD', 'Teacher']), getNaacDocuments);
router.post('/documents/upload', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD', 'Teacher']), uploadNaacDocument);
router.delete('/documents/:id', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), deleteNaacDocument);

// ──── DASHBOARD & SCORE ESTIMATE ──────────────────────────────
router.get('/dashboard', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD']), getNaacDashboard);
router.get('/score/estimate', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), getScoreEstimate);

// ──── AUTO-SYNC POPULATORS ─────────────────────────────────────
router.post('/sync-from-modules', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), syncFromModules);

// ──── AI NARRATIVES ────────────────────────────────────────────
router.post('/ai/draft-narrative/:criterionId', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), aiDraftNarrative);
router.post('/narrative/save', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), saveNaacNarrative);

// ──── DVV CLARIFICATIONS ───────────────────────────────────────
router.get('/dvv/queries', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD']), getDvvQueries);
router.post('/dvv/queries', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator']), createDvvQuery);
router.put('/dvv/queries/:id/respond', requireRole(['Admin', 'SuperAdmin', 'IQAC Coordinator', 'HOD']), respondDvvQuery);

// ──── SSR DOCUMENT COMPILERS ───────────────────────────────────
router.get('/ssr/generate', ssrGenerate); // Allow public download or auth via query param if needed (can be triggered by a button in browser)

export default router;
