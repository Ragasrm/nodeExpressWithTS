import * as userQueries from "../db/user.queries.js";

export async function listUsers() {
  return userQueries.queryUsers();
}
