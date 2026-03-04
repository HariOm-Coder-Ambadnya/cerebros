import { Router } from 'express';
import { upload, handleMulterError } from '../middleware/uploadMiddleware.js';
import { sanitizeChatInput, sanitizeSearchInput } from '../middleware/sanitize.js';
import {
  uploadDocument,
  listDocuments,
  deleteDocument,
  getStats,
} from '../controllers/uploadController.js';
import { chat, semanticSearch } from '../controllers/chatController.js';

const router = Router();

// ─── Document Routes ──────────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), handleMulterError, uploadDocument);
router.get('/documents', listDocuments);
router.delete('/documents/:name', deleteDocument);
router.get('/stats', getStats);

// ─── Chat / Search Routes ─────────────────────────────────────────────────────
router.post('/chat', sanitizeChatInput, chat);
router.post('/search', sanitizeSearchInput, semanticSearch);

// ─── Health Check ─────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: process.env.AI_PROVIDER || 'openai',
    timestamp: new Date().toISOString(),
  });
});

export default router;
