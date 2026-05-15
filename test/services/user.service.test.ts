import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const queryUsers = jest.fn<() => Promise<unknown>>();
const insertUser = jest.fn<() => Promise<unknown>>();

await jest.unstable_mockModule("@src/db/user.queries.js", () => ({
  queryUsers,
  insertUser,
}));

const userService = await import("@src/services/user.service.js");

describe("user.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listUsers", () => {
    it("delegates to queryUsers", async () => {
      const users = [{ _id: "1", name: "A", email: "a@test.com" }];
      queryUsers.mockResolvedValue(users);

      await expect(userService.listUsers()).resolves.toEqual(users);
      expect(queryUsers).toHaveBeenCalled();
    });
  });

  describe("createUser", () => {
    it("validates, normalizes email, and inserts", async () => {
      const created = { _id: "1", name: "Jane", email: "jane@test.com" };
      insertUser.mockResolvedValue(created);

      const result = await userService.createUser({
        name: "  Jane  ",
        email: "Jane@TEST.com",
      });

      expect(insertUser).toHaveBeenCalledWith({
        name: "Jane",
        email: "jane@test.com",
      });
      expect(result).toEqual(created);
    });

    it("throws ZodError for invalid body", async () => {
      await expect(userService.createUser({ name: "", email: "bad" })).rejects.toMatchObject({
        name: "ZodError",
      });
    });

    it("maps duplicate key to AppError 409", async () => {
      insertUser.mockRejectedValue({ code: 11_000 });

      await expect(
        userService.createUser({ name: "Jane", email: "jane@test.com" }),
      ).rejects.toMatchObject({ statusCode: 409, message: "Email already registered" });
    });

    it("rethrows unknown errors", async () => {
      const err = new Error("db down");
      insertUser.mockRejectedValue(err);

      await expect(
        userService.createUser({ name: "Jane", email: "jane@test.com" }),
      ).rejects.toBe(err);
    });
  });
});
