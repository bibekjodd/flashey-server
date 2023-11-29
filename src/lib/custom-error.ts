export class CustomError extends Error {
  message = '';
  statusCode = 400;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.message = message;
    this.statusCode = statusCode || 400;
  }
}
