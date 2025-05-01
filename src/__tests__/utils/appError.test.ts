import { AppError } from "../../utils/appError"

describe("AppError", () => {
  it("should create an error with status code and message", () => {
    const error = new AppError("Test error", 400)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe("Test error")
    expect(error.statusCode).toBe(400)
    expect(error.errors).toEqual({})
  })

  it("should create an error with custom errors object", () => {
    const errors = { field: "Invalid field" }
    const error = new AppError("Validation error", 400, errors)

    expect(error.message).toBe("Validation error")
    expect(error.statusCode).toBe(400)
    expect(error.errors).toEqual(errors)
  })

  it("should have the correct name", () => {
    const error = new AppError("Test error", 400)
    expect(error.name).toBe("AppError")
  })
})
