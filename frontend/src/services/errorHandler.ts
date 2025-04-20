// frontend/src/services/errorHandler.ts
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly errorCode?: string;
    
    constructor(message: string, statusCode: number, errorCode?: string) {
      super(message);
      this.statusCode = statusCode;
      this.errorCode = errorCode;
      Object.setPrototypeOf(this, ApiError.prototype);
    }
    
    public static fromAxiosError(error: any): ApiError {
      if (error.response) {
        return new ApiError(
          error.response.data.detail || 'An unexpected error occurred',
          error.response.status,
          error.response.data.code
        );
      }
      return new ApiError('Network error', 0);
    }
  }