/**
 * Error handling utilities for consistent error management
 */

import { z } from 'zod';

// Error types
export interface APIError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}

// Error classes
export class VexelError extends Error {
  public code?: string;
  public status?: number;
  public details?: Record<string, any>;

  constructor(message: string, code?: string, status?: number, details?: Record<string, any>) {
    super(message);
    this.name = 'VexelError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends VexelError {
  public field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NetworkError extends VexelError {
  constructor(message: string, status?: number) {
    super(message, 'NETWORK_ERROR', status);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends VexelError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends VexelError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

// Error message mapping
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  CONNECTION_ERROR: 'Unable to connect to the server. Please try again later.',
  
  // Authentication errors
  AUTH_ERROR: 'Authentication failed. Please log in and try again.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  
  // Authorization errors
  AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this operation.',
  
  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_FORMAT: 'Invalid format. Please check your input.',
  
  // Resource errors
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'This resource already exists.',
  CONFLICT: 'There was a conflict with the current state.',
  
  // Rate limiting
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  QUOTA_EXCEEDED: 'You have exceeded your quota. Please upgrade your plan.',
  
  // Server errors
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
  MAINTENANCE: 'The system is under maintenance. Please try again later.',
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

// HTTP status code to error message mapping
const STATUS_CODE_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'You are not authorized. Please log in and try again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'There was a conflict with the current state.',
  422: 'The request could not be processed. Please check your input.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'An internal server error occurred. Please try again later.',
  502: 'Bad gateway. The server is temporarily unavailable.',
  503: 'The service is temporarily unavailable. Please try again later.',
  504: 'Gateway timeout. The request took too long to process.',
};

/**
 * Extract user-friendly error message from various error types
 */
export const getErrorMessage = (error: any): string => {
  // Handle null/undefined
  if (!error) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle VexelError instances
  if (error instanceof VexelError) {
    return error.message;
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const firstError = error.errors[0];
    return firstError?.message || ERROR_MESSAGES.VALIDATION_ERROR;
  }

  // Handle API response errors
  if (error?.response?.data) {
    const { data } = error.response;
    
    // Check for specific error message
    if (data.message) {
      return data.message;
    }
    
    // Check for error code
    if (data.code && ERROR_MESSAGES[data.code]) {
      return ERROR_MESSAGES[data.code];
    }
    
    // Check for validation errors
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors[0]?.message || ERROR_MESSAGES.VALIDATION_ERROR;
    }
  }

  // Handle HTTP status codes
  if (error?.response?.status) {
    const status = error.response.status;
    if (STATUS_CODE_MESSAGES[status]) {
      return STATUS_CODE_MESSAGES[status];
    }
  }

  // Handle network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Handle timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    return error.message;
  }

  // Handle error objects with message property
  if (error?.message) {
    return error.message;
  }

  // Fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Extract validation errors from API response or Zod error
 */
export const getValidationErrors = (error: any): FormErrors => {
  const errors: FormErrors = {};

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
    return errors;
  }

  // Handle API validation errors
  if (error?.response?.data?.errors) {
    const apiErrors = error.response.data.errors;
    
    if (Array.isArray(apiErrors)) {
      apiErrors.forEach((err: any) => {
        if (err.field && err.message) {
          errors[err.field] = err.message;
        }
      });
    } else if (typeof apiErrors === 'object') {
      Object.keys(apiErrors).forEach((field) => {
        const fieldErrors = apiErrors[field];
        if (Array.isArray(fieldErrors)) {
          errors[field] = fieldErrors[0];
        } else if (typeof fieldErrors === 'string') {
          errors[field] = fieldErrors;
        }
      });
    }
  }

  return errors;
};

/**
 * Check if error is a specific type
 */
export const isNetworkError = (error: any): boolean => {
  return error?.code === 'NETWORK_ERROR' || 
         error?.message?.includes('Network Error') ||
         !error?.response;
};

export const isAuthenticationError = (error: any): boolean => {
  return error instanceof AuthenticationError ||
         error?.response?.status === 401 ||
         error?.code === 'AUTH_ERROR';
};

export const isAuthorizationError = (error: any): boolean => {
  return error instanceof AuthorizationError ||
         error?.response?.status === 403 ||
         error?.code === 'AUTHORIZATION_ERROR';
};

export const isValidationError = (error: any): boolean => {
  return error instanceof ValidationError ||
         error instanceof z.ZodError ||
         error?.response?.status === 422 ||
         error?.code === 'VALIDATION_ERROR';
};

export const isRateLimitError = (error: any): boolean => {
  return error?.response?.status === 429 ||
         error?.code === 'RATE_LIMITED';
};

export const isServerError = (error: any): boolean => {
  const status = error?.response?.status;
  return status >= 500 && status < 600;
};

/**
 * Create standardized error objects
 */
export const createError = (
  message: string,
  code?: string,
  status?: number,
  details?: Record<string, any>
): VexelError => {
  return new VexelError(message, code, status, details);
};

export const createValidationError = (message: string, field?: string): ValidationError => {
  return new ValidationError(message, field);
};

export const createNetworkError = (message?: string, status?: number): NetworkError => {
  return new NetworkError(message || ERROR_MESSAGES.NETWORK_ERROR, status);
};

export const createAuthError = (message?: string): AuthenticationError => {
  return new AuthenticationError(message);
};

export const createAuthorizationError = (message?: string): AuthorizationError => {
  return new AuthorizationError(message);
};

/**
 * Error logging utility
 */
export const logError = (error: any, context?: string): void => {
  const errorInfo = {
    message: getErrorMessage(error),
    context,
    timestamp: new Date().toISOString(),
    stack: error?.stack,
    details: error?.details || error?.response?.data,
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorInfo);
  }

  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, LogRocket, etc.
    // Sentry.captureException(error, { extra: errorInfo });
  }
};

/**
 * Retry utility for failed operations
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain error types
      if (isAuthenticationError(error) || isAuthorizationError(error) || isValidationError(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};
