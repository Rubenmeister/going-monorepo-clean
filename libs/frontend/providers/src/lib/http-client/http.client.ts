import { ok, err, Result } from 'neverthrow';
import { axiosInstance } from './axios-instance';
import { ApiError, NetworkError } from './api-error';

/**
 * HTTP client using Axios with error handling
 * All methods return Result<T, ApiError> for better error handling
 */
export class HttpClient {
  /**
   * GET request
   */
  async get<T>(path: string): Promise<Result<T, ApiError>> {
    try {
      const response = await axiosInstance.get<T>(path);
      return ok(response.data);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  /**
   * POST request
   */
  async post<T>(path: string, data: unknown): Promise<Result<T, ApiError>> {
    try {
      const response = await axiosInstance.post<T>(path, data);
      return ok(response.data);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(path: string, data: unknown): Promise<Result<T, ApiError>> {
    try {
      const response = await axiosInstance.patch<T>(path, data);
      return ok(response.data);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  /**
   * PUT request
   */
  async put<T>(path: string, data: unknown): Promise<Result<T, ApiError>> {
    try {
      const response = await axiosInstance.put<T>(path, data);
      return ok(response.data);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string): Promise<Result<T, ApiError>> {
    try {
      const response = await axiosInstance.delete<T>(path);
      return ok(response.data);
    } catch (error) {
      return err(this.handleError(error));
    }
  }

  /**
   * Handle errors and convert to ApiError
   */
  private handleError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      // Network error
      if (
        error.message.includes('Network') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND')
      ) {
        return new NetworkError(error.message);
      }

      return new ApiError(error.message, 'UNKNOWN_ERROR' as any, 0, {
        details: { message: error.message },
      });
    }

    return new NetworkError('Unknown network error');
  }
}

export const httpClient = new HttpClient();
