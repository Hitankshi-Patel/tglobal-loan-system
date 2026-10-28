/**
 * JWT Auth Middleware
 * Verifies Bearer token for admin-protected routes
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AdminPayload {
  username: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Admin authentication required. Provide a valid Bearer token.',
        fields: [],
      },
    });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET || 'tglobal-admin-secret-change-in-prod';

  try {
    const payload = jwt.verify(token, secret) as AdminPayload;
    if (payload.role !== 'admin') {
      throw new Error('Not an admin token');
    }
    // Attach payload to request for use downstream
    (req as any).admin = payload;
    next();
  } catch {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired admin token.',
        fields: [],
      },
    });
  }
}
