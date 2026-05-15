import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Request, Response } from "express";
import { ZodError, z } from "zod";
import { AppError } from "@src/lib/AppError.js";
import { errorHandler } from "@src/middleware/errorHandler.js";

function mockRes(): Response {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response;
}

describe("errorHandler", () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalEnv;
    }
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 for ZodError", () => {
    const schema = z.object({ name: z.string().min(1) });
    let zodErr: ZodError;
    try {
      schema.parse({});
    } catch (err) {
      zodErr = err as ZodError;
    }

    const res = mockRes();
    errorHandler(zodErr!, {} as Request, res, jest.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ error: { message: "Validation failed" } });
  });

  it("returns 409 for Mongo duplicate key", () => {
    const res = mockRes();
    errorHandler({ code: 11_000 }, {} as Request, res, jest.fn());

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: { message: "Email already registered" } });
  });

  it("returns AppError status and message", () => {
    const res = mockRes();
    errorHandler(new AppError(403, "Forbidden"), {} as Request, res, jest.fn());

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ error: { message: "Forbidden" } });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("logs AppError when status is 500 or higher", () => {
    const err = new AppError(500, "Server error");
    const res = mockRes();

    errorHandler(err, {} as Request, res, jest.fn());

    expect(consoleErrorSpy).toHaveBeenCalledWith(err);
    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({ error: { message: "Server error" } });
  });

  it("logs and returns 500 for unknown errors in development", () => {
    process.env.NODE_ENV = "development";
    const err = new Error("boom");
    const res = mockRes();

    errorHandler(err, {} as Request, res, jest.fn());

    expect(consoleErrorSpy).toHaveBeenCalledWith(err);
    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({
      error: { message: "boom" },
      stack: expect.any(Array),
    });
  });

  it("hides internal message in production", () => {
    process.env.NODE_ENV = "production";
    const res = mockRes();

    errorHandler(new Error("secret"), {} as Request, res, jest.fn());

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: { message: "Internal server error" } });
    expect(res.body).not.toHaveProperty("stack");
  });

  it("omits stack when Error has no stack property", () => {
    const err = new Error("no stack");
    delete err.stack;
    const res = mockRes();

    errorHandler(err, {} as Request, res, jest.fn());

    expect(res.body).toEqual({ error: { message: "no stack" } });
  });

  it("handles non-Error throws in development and production", () => {
    process.env.NODE_ENV = "development";
    let res = mockRes();
    errorHandler("oops", {} as Request, res, jest.fn());
    expect(res.body).toEqual({ error: { message: "Internal server error" } });

    process.env.NODE_ENV = "production";
    res = mockRes();
    errorHandler(null, {} as Request, res, jest.fn());
    expect(res.body).toEqual({ error: { message: "Internal server error" } });
  });
});
