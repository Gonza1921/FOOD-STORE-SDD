export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ApiErrorResponse {
  message: string
  code: string
  details?: Record<string, unknown>
}
