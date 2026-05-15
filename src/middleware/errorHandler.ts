import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/AppError.js";

const isProd = process.env.NODE_ENV === "production";

function mongoDuplicateKey(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === 11_000
  );
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { message: "Validation failed", issues: err.flatten() },
    });
    return;
  }

  if (mongoDuplicateKey(err)) {
    res.status(409).json({ error: { message: "Email already registered" } });
    return;
  }

  const status = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError
      ? err.message
      : isProd
        ? "Internal server error"
        : err instanceof Error
          ? err.message
          : "Internal server error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: { message },
    ...(!isProd && err instanceof Error && err.stack ? { stack: err.stack.split("\n") } : {}),
  });
};
