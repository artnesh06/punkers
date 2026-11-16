/**
 * Logging utility for the application
 * Provides structured logging with different levels
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
}

/**
 * Filter sensitive data from objects
 * Removes private keys, passwords, and other sensitive information
 */
function filterSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const filtered = { ...data };
  const sensitiveKeys = [
    'password',
    'privateKey',
    'private_key',
    'secret',
    'token',
    'authorization',
    'api_key',
    'apiKey',
  ];

  for (const key of Object.keys(filtered)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      filtered[key] = '[REDACTED]';
    } else if (typeof filtered[key] === 'object') {
      filtered[key] = filterSensitiveData(filtered[key]);
    }
  }

  return filtered;
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  options?: {
    context?: Record<string, any>;
    error?: Error;
    request?: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: any;
    };
  }
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (options?.context) {
    entry.context = filterSensitiveData(options.context);
  }

  if (options?.error) {
    entry.error = {
      message: options.error.message,
      stack: options.error.stack,
      code: (options.error as any).code,
    };
  }

  if (options?.request) {
    entry.request = {
      method: options.request.method,
      url: options.request.url,
      headers: filterSensitiveData(options.request.headers),
      body: filterSensitiveData(options.request.body),
    };
  }

  return entry;
}

/**
 * Log an info message
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  const entry = createLogEntry('INFO', message, { context });
  console.log(JSON.stringify(entry));
}

/**
 * Log a warning message
 */
export function logWarn(message: string, context?: Record<string, any>): void {
  const entry = createLogEntry('WARN', message, { context });
  console.warn(JSON.stringify(entry));
}

/**
 * Log an error message
 */
export function logError(
  message: string,
  error?: Error,
  context?: Record<string, any>
): void {
  const entry = createLogEntry('ERROR', message, { error, context });
  console.error(JSON.stringify(entry));
}

/**
 * Log a fatal error message
 */
export function logFatal(
  message: string,
  error?: Error,
  context?: Record<string, any>
): void {
  const entry = createLogEntry('FATAL', message, { error, context });
  console.error(JSON.stringify(entry));
}

/**
 * Log an API request
 */
export function logApiRequest(
  method: string,
  url: string,
  headers?: Record<string, string>,
  body?: any
): void {
  const entry = createLogEntry('INFO', 'API Request', {
    request: { method, url, headers, body },
  });
  console.log(JSON.stringify(entry));
}
