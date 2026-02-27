class ApiError extends Error {
  constructor(message = "Something went wrong!", statusCode = 500, errors = []) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad Request", status = 400, errors = []) {
    return new ApiError(message, status, errors);
  }

  static unauthorized(message = "Unauthorized", errors = []) {
    return new ApiError(message, 401, errors);
  }

  static forbidden(message = "Forbidden", errors = []) {
    return new ApiError(message, 403, errors);
  }

  static notFound(message = "Not Found", errors = []) {
    return new ApiError(message, 404, errors);
  }

  static conflict(message = "Conflict", errors = []) {
    return new ApiError(message, 409, errors);
  }

  static insufficientFunds(message = "Insufficient funds", errors = []) {
    return new ApiError(message, 400, errors);
  }

  static internal(message = "Internal Server Error", errors = []) {
    return new ApiError(message, 500, errors);
  }
}

export { ApiError };