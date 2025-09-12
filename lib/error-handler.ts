import type { NextApiResponse } from "next"

export interface ApiError {
  message: string
  code?: string
  statusCode: number
  details?: any
}

export class ValidationError extends Error {
  public statusCode = 400
  public code = "VALIDATION_ERROR"

  constructor(
    message: string,
    public details?: any,
  ) {
    super(message)
    this.name = "ValidationError"
  }
}

export class ConflictError extends Error {
  public statusCode = 409
  public code = "CONFLICT_ERROR"

  constructor(
    message: string,
    public conflicts: string[] = [],
  ) {
    super(message)
    this.name = "ConflictError"
  }
}

export class NotFoundError extends Error {
  public statusCode = 404
  public code = "NOT_FOUND_ERROR"

  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}

export class DatabaseError extends Error {
  public statusCode = 500
  public code = "DATABASE_ERROR"

  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message)
    this.name = "DatabaseError"
  }
}

export function handleApiError(error: unknown, res: NextApiResponse) {
  console.error("API Error:", error)

  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({
      ok: false,
      message: error.message,
      code: error.code,
      details: error.details,
    })
  }

  if (error instanceof ConflictError) {
    return res.status(error.statusCode).json({
      ok: false,
      message: error.message,
      code: error.code,
      conflicts: error.conflicts,
    })
  }

  if (error instanceof NotFoundError) {
    return res.status(error.statusCode).json({
      ok: false,
      message: error.message,
      code: error.code,
    })
  }

  if (error instanceof DatabaseError) {
    return res.status(error.statusCode).json({
      ok: false,
      message: "Database operation failed",
      code: error.code,
    })
  }

  // Generic error handling
  return res.status(500).json({
    ok: false,
    message: "Internal server error",
    code: "INTERNAL_ERROR",
  })
}

export function createApiError(message: string, statusCode = 500, code?: string, details?: any): ApiError {
  return {
    message,
    statusCode,
    code,
    details,
  }
}
