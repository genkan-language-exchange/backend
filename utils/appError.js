class AppError extends Error {
  constructor(message = 'unhandled error', statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor); // prevents this class from appearing in the stack trace
  }
}

module.exports = AppError;