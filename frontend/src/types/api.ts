/**
 * API-related type definitions
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  error: string;
  status?: number;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
}

export interface ApiRootResponse {
  message: string;
  version: string;
  endpoints: {
    auth: {
      login: string;
      logout: string;
      status: string;
    };
    health: string;
  };
}
