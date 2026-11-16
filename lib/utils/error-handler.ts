import { NextResponse } from 'next/server';
import { logError } from './logger';

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  fields?: Record<string, string>;
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class BlockchainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockchainError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Handle errors and return appropriate NextResponse
 * Logs errors and returns user-friendly error messages
 */
export function handleApiError(
  error: unknown,
  context?: Record<string, any>
): NextResponse<ErrorResponse> {
  // Validation errors (400)
  if (error instanceof ValidationError) {
    logError('Validation error', error, context);
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: error.message,
        statusCode: 400,
        fields: error.fields,
      },
      { status: 400 }
    );
  }

  // Not found errors (404)
  if (error instanceof NotFoundError) {
    logError('Not found error', error, context);
    return NextResponse.json(
      {
        error: 'Not Found',
        message: error.message,
        statusCode: 404,
      },
      { status: 404 }
    );
  }

  // Blockchain errors (502)
  if (error instanceof BlockchainError) {
    logError('Blockchain error', error, context);
    return NextResponse.json(
      {
        error: 'Blockchain Error',
        message: 'Failed to communicate with blockchain. Please try again.',
        statusCode: 502,
      },
      { status: 502 }
    );
  }

  // Database errors (500)
  if (error instanceof DatabaseError) {
    logError('Database error', error, context);
    return NextResponse.json(
      {
        error: 'Database Error',
        message: 'A database error occurred. Please try again later.',
        statusCode: 500,
      },
      { status: 500 }
    );
  }

  // Generic errors (500)
  if (error instanceof Error) {
    logError('Internal server error', error, context);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
        statusCode: 500,
      },
      { status: 500 }
    );
  }

  // Unknown errors (500)
  logError('Unknown error', undefined, { error, ...context });
  return NextResponse.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
    { status: 500 }
  );
}

/**
 * Wrap an async API handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ErrorResponse>> {
  return handler().catch((error) => handleApiError(error));
}
