const request = require("supertest");
const app = require("../app");

// Mock the models so tests don't hit a real DB
jest.mock("../models", () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Client: {
    create: jest.fn(),
  },
  Coach: {},
  Nutritionist: {},
  Admin: {},
  CoachCertification: {
    bulkCreate: jest.fn(),
  },
}));

jest.mock("../config/database", () => ({
  authenticate: jest.fn().mockResolvedValue(),
  define: jest.fn(),
}));

const { User, Client } = require("../models");

describe("POST /auth/register/client", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 409 if email already in use", async () => {
    User.findOne.mockResolvedValueOnce({ user_id: 1, email: "test@test.com" });

    const res = await request(app).post("/auth/register/client").send({
      first_name: "John",
      last_name: "Doe",
      email: "test@test.com",
      password: "password123",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/email/i);
  });

  it("returns 201 on successful registration", async () => {
    User.findOne.mockResolvedValue(null); // no duplicate
    User.create.mockResolvedValue({
      user_id: 99,
      email: "new@test.com",
      role: "client",
    });
    Client.create.mockResolvedValue({});
    User.findByPk.mockResolvedValue({
      user_id: 99,
      email: "new@test.com",
      role: "client",
      toJSON: () => ({ user_id: 99, email: "new@test.com" }),
    });

    const res = await request(app).post("/auth/register/client").send({
      first_name: "John",
      last_name: "Doe",
      email: "new@test.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
  });
});

describe("POST /auth/login", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 404 if email not found", async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).post("/auth/login").send({
      email: "nobody@test.com",
      password: "password123",
    });

    expect(res.status).toBe(404);
  });

  it("returns 403 if account is disabled", async () => {
    User.findOne.mockResolvedValue({
      user_id: 1,
      email: "test@test.com",
      is_active: false,
      password_hash: "hash",
    });

    const res = await request(app).post("/auth/login").send({
      email: "test@test.com",
      password: "password123",
    });

    expect(res.status).toBe(403);
  });
});
