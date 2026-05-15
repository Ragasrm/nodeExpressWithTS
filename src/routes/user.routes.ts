import { Router } from "express";
import * as userService from "../services/user.service.js";

export const userRouter = Router();

userRouter.get("/", async (_req, res, next) => {
  try {
    const users = await userService.listUsers();
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * Body: { "name": string, "email": string }
 */
userRouter.post("/", async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
});
