import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import { ZodError, z } from "zod";

const listUsers = jest.fn<() => Promise<unknown>>();
const createUser = jest.fn<() => Promise<unknown>>();

await jest.unstable_mockModule("@src/services/user.service.js", () => ({
  listUsers,
  createUser,
}));

const { errorHandler } = await import("@src/middleware/errorHandler.js");
const { userRouter } = await import("./user.routes.js");

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/users", userRouter);
  app.use(errorHandler);
  return app;
}

describe("user.routes", () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "development";
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  describe("GET /users", () => {
    it("returns users list", async () => {
      const users = [{ _id: "1", name: "A", email: "a@test.com" }];
      listUsers.mockResolvedValue(users);

      const res = await request(createTestApp()).get("/users");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: users });
    });

    it("forwards errors to error handler", async () => {
      listUsers.mockRejectedValue(new Error("list failed"));

      const res = await request(createTestApp()).get("/users");

      expect(res.status).toBe(500);
      expect(res.body.error.message).toBe("list failed");
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: "list failed" }));
    });
  });

  describe("POST /users", () => {
    it("creates a user", async () => {
      const user = { _id: "1", name: "Jane", email: "jane@test.com" };
      createUser.mockResolvedValue(user);

      const res = await request(createTestApp())
        .post("/users")
        .send({ name: "Jane", email: "jane@test.com" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ data: user });
    });

    it("forwards errors to error handler", async () => {
      createUser.mockRejectedValue(
        new ZodError(z.object({ name: z.string() }).safeParse({}).error!.issues),
      );

      const res = await request(createTestApp()).post("/users").send({});

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe("Validation failed");
    });
  });
});
