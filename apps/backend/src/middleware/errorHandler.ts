import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface CustomError extends Error {
  statusCode?: number;
}

export function errorHandler(err: CustomError, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`API Error [${req.method} ${req.url}]: ${message}`, err.stack);

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
    },
  });
}
