import { Router } from 'express';
import { sendChatMessage } from '../controllers/chat.controller.js';
import { 
  saveChatSession, 
  getChatSessions, 
  deleteChatSession 
} from '../controllers/chat-sessions.controller.js';

const router = Router();

/**
 * POST /api/chat
 * Send a message to the AI chatbot with optional video context
 */
router.post('/', sendChatMessage);

/**
 * Chat Session Management
 */
router.get('/sessions', getChatSessions);
router.post('/sessions', saveChatSession);
router.delete('/sessions/:id', deleteChatSession);

export default router;
