import { Router } from 'express';
import { testConnection } from '../controllers/health.controller.js';

const router = Router();

/**
 * GET /api/test-connection
 * Test Supabase connection
 */
router.get('/test-connection', testConnection);

export default router;
