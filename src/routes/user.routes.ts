import { Router } from "express";
import * as userService from "../services/user.service.js";

export const userRouter = Router();

userRouter.get(
  "/", async (req, res) => {
    const users = await userService.listUsers();
    res.json({ data: users });
  },
);
