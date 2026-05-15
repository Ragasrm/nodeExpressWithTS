import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Types } from "mongoose";

const find = jest.fn();
const create = jest.fn();
const findById = jest.fn();

await jest.unstable_mockModule("@src/models/User.model.js", () => ({
  User: { find, create, findById },
}));

const userQueries = await import("@src/db/user.queries.js");

function chainableLean<T>(value: T) {
  const chain = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn<() => Promise<T>>().mockResolvedValue(value),
  };
  return chain;
}

describe("user.queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("queryUsers", () => {
    it("uses default limit of 100", async () => {
      const users = [{ _id: new Types.ObjectId(), name: "A", email: "a@test.com" }];
      const chain = chainableLean(users);
      find.mockReturnValue(chain);

      const result = await userQueries.queryUsers();

      expect(result).toEqual(users);
      expect(chain.limit).toHaveBeenCalledWith(100);
    });

    it("caps limit to minimum 1", async () => {
      const chain = chainableLean([]);
      find.mockReturnValue(chain);

      await userQueries.queryUsers(0);

      expect(chain.limit).toHaveBeenCalledWith(1);
    });

    it("caps limit to maximum 500", async () => {
      const chain = chainableLean([]);
      find.mockReturnValue(chain);

      await userQueries.queryUsers(999);

      expect(chain.limit).toHaveBeenCalledWith(500);
    });
  });

  describe("insertUser", () => {
    it("returns lean document after create", async () => {
      const id = new Types.ObjectId();
      const lean = { _id: id, name: "Jane", email: "jane@test.com" };
      create.mockResolvedValue({ _id: id });
      findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(lean),
        }),
      });

      const result = await userQueries.insertUser({ name: "Jane", email: "jane@test.com" });

      expect(result).toEqual(lean);
    });

    it("throws when lean read fails after insert", async () => {
      const id = new Types.ObjectId();
      create.mockResolvedValue({ _id: id });
      findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        userQueries.insertUser({ name: "Jane", email: "jane@test.com" }),
      ).rejects.toThrow("Failed to read user after insert");
    });
  });
});
