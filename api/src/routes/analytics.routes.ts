import { Router } from 'express';
import {
  getAllEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../controllers/analytics.controller.js';

const router = Router();

/**
 * GET /api/analytics
 * Get all data from test_table
 */
router.get('/', getAllEntries);

/**
 * GET /api/analytics/:id
 * Get data by ID
 */
router.get('/:id', getEntryById);

/**
 * POST /api/analytics
 * Create new entry
 */
router.post('/', createEntry);

/**
 * PUT /api/analytics/:id
 * Update entry
 */
router.put('/:id', updateEntry);

/**
 * DELETE /api/analytics/:id
 * Delete entry
 */
router.delete('/:id', deleteEntry);

export default router;
