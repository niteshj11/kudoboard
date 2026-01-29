import { HttpResponseInit, InvocationContext } from '@azure/functions';

// Check if we're in development/dev environment
const isDev = () => {
  const env = process.env.AZURE_FUNCTIONS_ENVIRONMENT || process.env.NODE_ENV || '';
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
  
  // Match patterns like "at functionName (file:line:column)" or "at file:line:column"
  const lines = stack.split('\n');
  for (const line of lines) {
    // Skip the first line (error message)
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

export function createErrorResponse(
  error: unknown,
  context: InvocationContext,
  operation: string
): HttpResponseInit {
  const err = error instanceof Error ? error : new Error(String(error));
  const stackInfo = parseStackTrace(err.stack);
  
  context.error(`${operation} error:`, err);
  
  if (isDev()) {
    // In dev, return detailed error information
    const detailedError: DetailedError = {
      message: `${operation} failed`,
      error: err.message,
      stack: err.stack,
      file: stackInfo.file,
      line: stackInfo.line,
      column: stackInfo.column,
      functionName: stackInfo.functionName,
      timestamp: new Date().toISOString(),
      environment: process.env.AZURE_FUNCTIONS_ENVIRONMENT || process.env.NODE_ENV || 'unknown',
    };
    
    return {
      status: 500,
      jsonBody: detailedError,
      headers: {
        'X-Error-Details': 'enabled',
        'Access-Control-Expose-Headers': 'X-Error-Details',
      },
    };
  }
  
  // In production, return minimal error info
  return {
    status: 500,
    jsonBody: { message: `${operation} failed` },
  };
}
