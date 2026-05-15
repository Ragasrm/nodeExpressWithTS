import express from "express";
import { errorHandler } from "@src/middleware/errorHandler.js";
import { apiRouter } from "@src/routes/index.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}
