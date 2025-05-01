export class AppError extends Error {
  statusCode: number
  errors: Record<string, any>

  constructor(message: string, statusCode: number, errors: Record<string, any> = {}) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}
