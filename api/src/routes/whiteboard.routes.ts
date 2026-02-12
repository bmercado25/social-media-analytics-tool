import { Router } from 'express';
import {
  getWhiteboardIdeas,
  createWhiteboardIdea,
  updateWhiteboardIdea,
  deleteWhiteboardIdea,
} from '../controllers/whiteboard.controller.js';

const router = Router();

router.get('/', getWhiteboardIdeas);
router.post('/', createWhiteboardIdea);
router.patch('/:id', updateWhiteboardIdea);
router.delete('/:id', deleteWhiteboardIdea);

export default router;
