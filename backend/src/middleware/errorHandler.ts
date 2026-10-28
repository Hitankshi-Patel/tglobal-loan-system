import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public fields: string[];
  public extraData?: Record<string, any>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fields: string[] = [],
    extraData?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.extraData = extraData;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const fields = err.errors.map((e) => e.path.join('.')).filter(Boolean);
    const message = err.errors.map((e) => e.message).join('; ');

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message,
        fields,
      },
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    const responsePayload: Record<string, any> = {
      error: {
        code: err.code,
        message: err.message,
        fields: err.fields,
      },
    };

    if (err.extraData) {
      Object.assign(responsePayload, err.extraData);
    }

    res.status(err.statusCode).json(responsePayload);
    return;
  }

  // Unhandled internal server errors
  console.error('Unhandled Server Error:', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.',
      fields: [],
    },
  });
}
