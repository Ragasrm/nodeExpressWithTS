import { describe, expect, it } from "@jest/globals";
import { AppError } from "./AppError.js";

describe("AppError", () => {
  it("sets name, message, statusCode, and isOperational", () => {
    const err = new AppError(404, "Not found", false);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.name).toBe("AppError");
    expect(err.message).toBe("Not found");
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(false);
    expect(err.stack).toBeDefined();
  });

  it("works when Error.captureStackTrace is unavailable", () => {
    const original = Error.captureStackTrace;
    // @ts-expect-error — simulate environments without captureStackTrace
    Error.captureStackTrace = undefined;

    const err = new AppError(500, "Server error");

    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);

    Error.captureStackTrace = original;
  });
});
