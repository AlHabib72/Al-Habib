import { Request, Response, NextFunction } from 'express';

// FIXED: Original line 820 had: if (err.code === 11000') — stray quote syntax error
// FIXED: Original AppError used: `${statusCode}`.startsWith('4') — wrong, statusCode is number not string

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err, message: err.message };
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.error('DEV Error:', err);
    res.status(error.statusCode).json({
      success: false,
      status: error.status,
      message: error.message,
      stack: err.stack,
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`Duplicate value for ${field}. Please use another value.`, 400);
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors || {}).map((e: any) => e.message).join('. ');
    error = new AppError(`Invalid input: ${msg}`, 400);
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') error = new AppError('Invalid token. Please log in again.', 401);
  if (err.name === 'TokenExpiredError') error = new AppError('Token expired. Please log in again.', 401);

  res.status(error.statusCode).json({
    success: false,
    message: error.message || 'Something went wrong',
  });
};
