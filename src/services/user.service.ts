import { z } from "zod";
import { AppError } from "../lib/AppError.js";
import * as userQueries from "../db/user.queries.js";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email").max(320),
});

export async function listUsers() {
  return userQueries.queryUsers();
}

export async function createUser(body: unknown) {
  const parsed = createUserSchema.parse(body);

  const normalized = {
    name: parsed.name,
    email: parsed.email.toLowerCase(),
  };

  try {
    return await userQueries.insertUser(normalized);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: unknown }).code === 11_000
    ) {
      throw new AppError(409, "Email already registered");
    }
    throw err;
  }
}
