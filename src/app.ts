import express from "express";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api", apiRouter);

  return app;
}
