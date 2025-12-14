// Error codes as defined in SPEC-B
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONTEXT_NOT_FOUND = 'CONTEXT_NOT_FOUND',
  CONTEXT_EXPIRED = 'CONTEXT_EXPIRED',
  UPSTREAM_UNAVAILABLE = 'UPSTREAM_UNAVAILABLE',
}

// HTTP status codes for each error type
export const ErrorStatusMap: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.CONTEXT_NOT_FOUND]: 404,
  [ErrorCode.CONTEXT_EXPIRED]: 410,
  [ErrorCode.UPSTREAM_UNAVAILABLE]: 503,
};

// Standard error structure per SPEC-A and SPEC-B
export interface ApiError {
  code: ErrorCode;
  message: string;
  details: Record<string, any>;
}

// Error response envelope
export interface ErrorResponse {
  error: ApiError;
}

// Custom error class for throwing structured errors
export class CartError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'CartError';
  }

  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  toResponse(): ErrorResponse {
    return {
      error: this.toApiError(),
    };
  }
}
