import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database.js';

/**
 * GET /api/whiteboard
 * Get all whiteboard ideas
 */
export const getWhiteboardIdeas = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('whiteboard_ideas')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching whiteboard ideas:', error);
      res.status(500).json({ success: false, error });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/whiteboard
 * Create a new whiteboard idea
 */
export const createWhiteboardIdea = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { content, x_pos, y_pos, color, width, height } = req.body;

    const { data, error } = await supabaseAdmin
      .from('whiteboard_ideas')
      .insert({
        content: content || 'New Idea',
        x_pos: x_pos ?? 100,
        y_pos: y_pos ?? 100,
        color: color || '#1f6feb',
        width: width || 200,
        height: height || 150,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating whiteboard idea:', error);
      res.status(500).json({ success: false, error });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/whiteboard/:id
 * Update a whiteboard idea
 */
export const updateWhiteboardIdea = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('whiteboard_ideas')
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating whiteboard idea:', error);
      res.status(500).json({ success: false, error });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/whiteboard/:id
 * Delete a whiteboard idea
 */
export const deleteWhiteboardIdea = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('whiteboard_ideas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting whiteboard idea:', error);
      res.status(500).json({ success: false, error });
      return;
    }

    res.json({ success: true, message: 'Idea deleted' });
  } catch (error) {
    next(error);
  }
};
