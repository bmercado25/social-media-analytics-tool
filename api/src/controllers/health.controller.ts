import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database.js';

/**
 * Test Supabase connection
 */
export const testConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Test connection by querying test_table
    const { data, error, count } = await supabaseAdmin
      .from('test_table')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Successfully connected to Supabase',
      table: 'test_table',
      rowCount: count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Supabase connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Supabase',
      error: error.message,
      details: error.details || null,
    });
  }
};

/**
 * Health check endpoint
 */
export const healthCheck = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
};
