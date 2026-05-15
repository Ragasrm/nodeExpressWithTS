import "dotenv/config";

import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(Number(process.env.PORT), () => {
    console.log(`Server listening on port ${process.env.PORT} (${process.env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, closing…`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

void bootstrap().catch((err: unknown) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
