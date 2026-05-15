import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "./app.js";
import { User } from "@src/models/User.model.js";

describe("createApp", () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("GET /health returns ok", async () => {
    const app = createApp();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });

  it("GET /api/users returns empty list", async () => {
    const app = createApp();
    const res = await request(app).get("/api/users");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("POST /api/users creates a user", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Jane", email: "jane@example.com" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: "Jane",
      email: "jane@example.com",
    });
  });

  it("POST /api/users rejects duplicate email with 409", async () => {
    const app = createApp();
    await request(app).post("/api/users").send({ name: "Jane", email: "dup@example.com" });

    const res = await request(app)
      .post("/api/users")
      .send({ name: "Other", email: "dup@example.com" });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe("Email already registered");
  });

  it("POST /api/users returns 400 for invalid body", async () => {
    const app = createApp();
    const res = await request(app).post("/api/users").send({ name: "", email: "not-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Validation failed");
  });
});
