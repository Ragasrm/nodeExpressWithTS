import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(process.env.MONGODB_URI as string, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    family: 4,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
