const request = require("supertest");
const app = require("../app");
const jwt = require("jsonwebtoken");

// Generate a real-looking token for test requests
const makeToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || "testsecret");

const clientToken = makeToken({ user_id: 10, role: "client" });
const coachToken = makeToken({ user_id: 20, role: "coach" });

jest.mock("../models", () => {
  const mockPlan = {
    plan_id: 1,
    coach_id: 20,
    title: "Strength Foundation",
    price: 149.99,
    plan_duration: 30,
    currency: "USD",
    is_active: true,
  };

  const mockSub = {
    subscription_id: 1,
    client_id: 10,
    coach_id: 20,
    status: "active",
    cancelled_at: null,
    end_date: "2026-05-30",
    update: jest.fn().mockResolvedValue(true),
  };

  return {
    sequelize: {
      transaction: jest.fn().mockImplementation(
        async (cb) => cb({}) // pass fake transaction object
      ),
    },
    CoachingPlan: {
      findOne: jest.fn().mockResolvedValue(mockPlan),
    },
    Payment: {
      create: jest
        .fn()
        .mockResolvedValue({ payment_id: 1, payment_amount: 149.99 }),
    },
    Subscription: {
      create: jest.fn().mockResolvedValue(mockSub),
      findOne: jest.fn().mockResolvedValue(mockSub),
    },
    ClientCoachRelationship: {
      findOrCreate: jest
        .fn()
        .mockResolvedValue([{ status: "active", update: jest.fn() }, false]),
    },
    User: {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
    },
    Client: { create: jest.fn() },
    Coach: {},
    Nutritionist: {},
    Admin: {},
    CoachCertification: { bulkCreate: jest.fn() },
  };
});

jest.mock("../config/database", () => ({
  authenticate: jest.fn().mockResolvedValue(),
  define: jest.fn(),
}));

const { CoachingPlan, Subscription } = require("../models");

describe("POST /api/subscriptions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 403 if user is a coach (not a client)", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .set("Authorization", `Bearer ${coachToken}`)
      .set("X-Active-Role", "coach")
      .send({ coaching_plan_id: 1 });

    expect(res.status).toBe(403);
  });

  it("returns 400 if coaching_plan_id is missing", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("X-Active-Role", "client")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/coaching_plan_id/i);
  });

  it("returns 404 if plan does not exist or is inactive", async () => {
    CoachingPlan.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/subscriptions")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("X-Active-Role", "client")
      .send({ coaching_plan_id: 999 });

    expect(res.status).toBe(404);
  });

  it("returns 201 on successful subscription", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("X-Active-Role", "client")
      .send({ coaching_plan_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("payment");
    expect(res.body).toHaveProperty("subscription");
  });
});

describe("PATCH /api/subscriptions/:id/cancel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 if no token provided", async () => {
    const res = await request(app).patch("/api/subscriptions/1/cancel");

    expect(res.status).toBe(401);
  });

  it("returns 404 if subscription not found", async () => {
    Subscription.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .patch("/api/subscriptions/999/cancel")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("X-Active-Role", "client");

    expect(res.status).toBe(404);
  });

  it("returns 400 if subscription already cancelled", async () => {
    Subscription.findOne.mockResolvedValueOnce({
      subscription_id: 1,
      status: "cancelled",
      update: jest.fn(),
    });

    const res = await request(app)
      .patch("/api/subscriptions/1/cancel")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("X-Active-Role", "client");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already cancelled/i);
  });

  it("returns 200 and cancels active subscription", async () => {
    Subscription.findOne.mockResolvedValueOnce({
      subscription_id: 1,
      status: "active",
      update: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app)
      .patch("/api/subscriptions/1/cancel")
      .set("Authorization", `Bearer ${clientToken}`)
      .set("X-Active-Role", "client");

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cancelled/i);
  });
});
