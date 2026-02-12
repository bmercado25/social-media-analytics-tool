import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database.js';

/**
 * POST /api/chat/sessions
 * Save or update a chat session
 */
export const saveChatSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, title, history } = req.body;

    if (!title || !history || !Array.isArray(history)) {
      res.status(400).json({
        success: false,
        error: { message: 'title and history (array) are required' },
      });
      return;
    }

    const sessionData = {
      id: id || undefined,
      title,
      history,
      updated_at: new Date(),
    };

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .upsert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error saving chat session:', error);
      res.status(500).json({ success: false, error });
      return;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/sessions
 * List all chat sessions
 */
export const getChatSessions = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({ success: false, error });
      return;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/chat/sessions/:id
 * Delete a chat session
 */
export const deleteChatSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({ success: false, error });
      return;
    }

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
