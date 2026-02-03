import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database.js';

const TABLE_NAME = 'test_table';

/**
 * Get all entries from test_table
 */
export const getAllEntries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('*');

    if (error) {
      throw error;
    }

    res.json({ 
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error: any) {
    console.error('Error fetching from test_table:', error);
    next(error);
  }
};

/**
 * Get entry by ID
 */
export const getEntryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    res.json({ 
      success: true,
      data 
    });
  } catch (error: any) {
    console.error('Error fetching by ID:', error);
    next(error);
  }
};

/**
 * Create new entry
 */
export const createEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .insert(req.body)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ 
      success: true,
      data 
    });
  } catch (error: any) {
    console.error('Error creating entry:', error);
    next(error);
  }
};

/**
 * Update entry
 */
export const updateEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ 
      success: true,
      data 
    });
  } catch (error: any) {
    console.error('Error updating entry:', error);
    next(error);
  }
};

/**
 * Delete entry
 */
export const deleteEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting entry:', error);
    next(error);
  }
};
