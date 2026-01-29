import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

// Check if we're in development mode
const isDev = () => {
  const env = process.env.NODE_ENV || '';
  return env.toLowerCase() !== 'production';
};

export interface DetailedError {
  message: string;
  error: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  functionName?: string;
  timestamp: string;
  environment: string;
}

// Parse stack trace to extract file, line, column info
function parseStackTrace(stack: string | undefined): { file?: string; line?: number; column?: number; functionName?: string } {
  if (!stack) return {};
  
  const lines = stack.split('\n');
  for (const line of lines) {
    if (!line.includes('at ')) continue;
    
    // Try to match "at functionName (file:line:column)"
    const matchWithFunc = line.match(/at\s+(\S+)\s+\((.+):(\d+):(\d+)\)/);
    if (matchWithFunc) {
      return {
        functionName: matchWithFunc[1],
        file: matchWithFunc[2],
        line: parseInt(matchWithFunc[3], 10),
        column: parseInt(matchWithFunc[4], 10),
      };
    }
    
    // Try to match "at file:line:column"
    const matchWithoutFunc = line.match(/at\s+(.+):(\d+):(\d+)/);
    if (matchWithoutFunc) {
      return {
        file: matchWithoutFunc[1],
        line: parseInt(matchWithoutFunc[2], 10),
        column: parseInt(matchWithoutFunc[3], 10),
      };
    }
  }
  
  return {};
}

function createDetailedErrorResponse(err: Error, operation: string): DetailedError {
  const stackInfo = parseStackTrace(err.stack);
  
  return {
    message: `${operation} failed`,
    error: err.message,
    stack: err.stack,
    file: stackInfo.file,
    line: stackInfo.line,
    column: stackInfo.column,
    functionName: stackInfo.functionName,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };
}

export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const response: ApiError = {
      message: err.message,
      code: err.code
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      message: 'Validation failed',
      details: err.message
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      message: 'Invalid token'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      message: 'Token expired'
    });
    return;
  }

  // Default error response - detailed in dev mode
  if (isDev()) {
    const detailedError = createDetailedErrorResponse(err, 'Request');
    res.setHeader('X-Error-Details', 'enabled');
    res.status(500).json(detailedError);
    return;
  }

  res.status(500).json({
    message: 'Internal server error'
  });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    message: `Route ${req.method} ${req.path} not found`
  });
}
