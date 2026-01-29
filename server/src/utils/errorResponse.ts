import { Response } from 'express';

// Check if we're in development mode
export const isDev = () => {
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

// Send detailed error response in dev mode, minimal in production
export function sendErrorResponse(res: Response, error: unknown, operation: string, statusCode = 500) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`${operation} error:`, err);
  
  if (isDev()) {
    const stackInfo = parseStackTrace(err.stack);
    res.setHeader('X-Error-Details', 'enabled');
    res.status(statusCode).json({
      message: `${operation} failed`,
      error: err.message,
      stack: err.stack,
      file: stackInfo.file,
      line: stackInfo.line,
      column: stackInfo.column,
      functionName: stackInfo.functionName,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    } as DetailedError);
    return;
  }
  
  res.status(statusCode).json({ message: `${operation} failed` });
}
