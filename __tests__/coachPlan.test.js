const request = require("supertest");
const app = require("../app");
const jwt = require("jsonwebtoken");

const makeToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || "testsecret");

const coachToken = makeToken({ user_id: 20, role: "coach" });
const clientToken = makeToken({ user_id: 10, role: "client" });

const mockPlan = {
  plan_id: 1,
  coach_id: 20,
  title: "Strength Foundation",
  price: 149.99,
  plan_duration: 30,
  currency: "USD",
  is_active: true,
  update: jest.fn().mockResolvedValue(true),
};

jest.mock("../models", () => ({
  CoachingPlan: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  User: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Client: { create: jest.fn() },
  Coach: {},
  Nutritionist: {},
  Admin: {},
  CoachCertification: { bulkCreate: jest.fn() },
  Payment: { create: jest.fn() },
  Subscription: { create: jest.fn(), findOne: jest.fn() },
  ClientCoachRelationship: { findOrCreate: jest.fn() },
  sequelize: { transaction: jest.fn() },
}));

jest.mock("../config/database", () => ({
  authenticate: jest.fn().mockResolvedValue(),
  define: jest.fn(),
}));

const { CoachingPlan } = require("../models");

describe("GET /api/coach/plans", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 with no token", async () => {
    const res = await request(app).get("/api/coach/plans");
    expect(res.status).toBe(401);
  });

  it("returns 403 if client tries to access coach plans", async () => {
    const res = await request(app)
      .get("/api/coach/plans")
      .set("Authorization", `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });

  it("returns 200 with list of plans for coach", async () => {
    CoachingPlan.findAll.mockResolvedValueOnce([mockPlan]);

    const res = await request(app)
      .get("/api/coach/plans")
      .set("Authorization", `Bearer ${coachToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe("Strength Foundation");
  });
});

describe("POST /api/coach/plans", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/coach/plans")
      .set("Authorization", `Bearer ${coachToken}`)
      .send({ title: "Incomplete Plan" }); // missing price and duration

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it("returns 201 on successful plan creation", async () => {
    CoachingPlan.create.mockResolvedValueOnce(mockPlan);

    const res = await request(app)
      .post("/api/coach/plans")
      .set("Authorization", `Bearer ${coachToken}`)
      .send({
        title: "Strength Foundation",
        plan_duration: 30,
        price: 149.99,
        currency: "USD",
        description: "A 30-day program",
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Strength Foundation");
  });
});

describe("PATCH /api/coach/plans/:planId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 404 if plan not found or not owned by coach", async () => {
    CoachingPlan.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .patch("/api/coach/plans/999")
      .set("Authorization", `Bearer ${coachToken}`)
      .send({ title: "Updated Title" });

    expect(res.status).toBe(404);
  });

  it("returns 200 on successful update", async () => {
    const updatedPlan = { ...mockPlan, title: "Updated Title" };
    CoachingPlan.findOne.mockResolvedValueOnce({
      ...mockPlan,
      update: jest.fn().mockResolvedValue(updatedPlan),
    });

    const res = await request(app)
      .patch("/api/coach/plans/1")
      .set("Authorization", `Bearer ${coachToken}`)
      .send({ title: "Updated Title" });

    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/coach/plans/:planId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 404 if plan not found", async () => {
    CoachingPlan.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .delete("/api/coach/plans/999")
      .set("Authorization", `Bearer ${coachToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 200 on successful deactivation", async () => {
    CoachingPlan.findOne.mockResolvedValueOnce({
      ...mockPlan,
      update: jest.fn().mockResolvedValue({ ...mockPlan, is_active: false }),
    });

    const res = await request(app)
      .delete("/api/coach/plans/1")
      .set("Authorization", `Bearer ${coachToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
  });
});
