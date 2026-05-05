jest.mock("../middleware/authMiddleware", () => (req, res, next) => {
  req.user = { user_id: 7 }
  next()
})

jest.mock("../middleware/documentUpload", () => ({
  single: () => (req, res, next) => {
    req.file = { filename: "cert.pdf" }
    next()
  },
  array: () => (req, res, next) => {
    req.files = []
    next()
  },
}))

jest.mock("../models", () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Client: {
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  Coach: {
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Nutritionist: {},
  Admin: {},
  CoachQualification: {
    create: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn(),
  },
  CoachCertification: {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    bulkCreate: jest.fn(),
  },
}))

jest.mock("../config/database", () => ({
  authenticate: jest.fn().mockResolvedValue(),
  define: jest.fn(),
}))

jest.mock(
  "swagger-ui-express",
  () => ({
    serve: [],
    setup: () => (req, res, next) => next(),
  }),
  { virtual: true }
)

jest.mock("swagger-jsdoc", () => jest.fn(() => ({})), { virtual: true })

const request = require("supertest")
const app = require("../app")
const {
  User,
  Coach,
  CoachQualification,
  CoachCertification,
} = require("../models")

const buildUser = () => ({
  user_id: 7,
  first_name: "Casey",
  last_name: "Coach",
  email: "coach@test.com",
  phone: "555-1212",
  profile_pic: null,
  role: "coach",
  toJSON() {
    return {
      user_id: this.user_id,
      first_name: this.first_name,
      last_name: this.last_name,
      email: this.email,
      phone: this.phone,
      profile_pic: this.profile_pic,
      role: this.role,
    }
  },
  update: jest.fn().mockImplementation(async function updateUser(values) {
    Object.assign(this, values)
    return this
  }),
})

const buildCoach = () => ({
  user_id: 7,
  bio: "Original bio",
  experience_years: 3,
  specialization: "cardio",
  price: "85.00",
  is_approved: true,
  update: jest.fn().mockImplementation(async function updateCoach(values) {
    Object.assign(this, values)
    return this
  }),
})

describe("Coach profile endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns the authenticated coach profile with qualifications and certifications", async () => {
    User.findByPk.mockResolvedValue(buildUser())
    Coach.findByPk.mockResolvedValue(buildCoach())
    CoachQualification.findAll.mockResolvedValue([
      { qualification_id: 1, degree_name: "B.S. Exercise Science" },
    ])
    CoachCertification.findAll.mockResolvedValue([
      { certification_id: 2, document_url: "/uploads/cert.pdf" },
    ])

    const res = await request(app).get("/api/profile/coach")

    expect(res.status).toBe(200)
    expect(CoachQualification.findAll).toHaveBeenCalledWith({
      where: { user_id: 7 },
    })
    expect(CoachCertification.findAll).toHaveBeenCalledWith({
      where: { coach_user_id: 7 },
    })
    expect(res.body.coach.qualifications).toHaveLength(1)
    expect(res.body.coach.certifications).toHaveLength(1)
  })

  it("updates coach pricing and specialization through the profile endpoint", async () => {
    const user = buildUser()
    const coach = buildCoach()
    User.findByPk.mockResolvedValue(user)
    Coach.findByPk.mockResolvedValue(coach)

    const res = await request(app).put("/api/profile/coach").send({
      bio: "Updated bio",
      experience_years: "6",
      pricing: "125.00",
      specializations: ["strength-training", "yoga"],
    })

    expect(res.status).toBe(200)
    expect(coach.update).toHaveBeenCalledWith(
      expect.objectContaining({
        bio: "Updated bio",
        experience_years: 6,
        specialization: "strength-training, yoga",
        price: "125.00",
      })
    )
    expect(res.body.coach.price).toBe("125.00")
    expect(res.body.coach.specialization).toBe("strength-training, yoga")
  })
})

describe("Qualification endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("creates qualifications for the authenticated coach", async () => {
    CoachQualification.create.mockResolvedValue({
      qualification_id: 3,
      user_id: 7,
      degree_name: "B.S. Exercise Science",
    })

    const res = await request(app).post("/api/qualifications").send({
      degree_name: "B.S. Exercise Science",
      institution: "NJIT",
      field_of_study: "Exercise Science",
      year_completed: 2024,
    })

    expect(res.status).toBe(201)
    expect(CoachQualification.create).toHaveBeenCalledWith({
      user_id: 7,
      degree_name: "B.S. Exercise Science",
      institution: "NJIT",
      field_of_study: "Exercise Science",
      year_completed: 2024,
    })
  })

  it("lists qualifications for the authenticated coach", async () => {
    CoachQualification.findAll.mockResolvedValue([
      { qualification_id: 3, user_id: 7, degree_name: "B.S. Exercise Science" },
    ])

    const res = await request(app).get("/api/qualifications")

    expect(res.status).toBe(200)
    expect(CoachQualification.findAll).toHaveBeenCalledWith({
      where: { user_id: 7 },
    })
    expect(res.body).toHaveLength(1)
  })
})

describe("Certification endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("creates certifications for the authenticated coach", async () => {
    CoachCertification.create.mockResolvedValue({
      certification_id: 4,
      coach_user_id: 7,
      document_url: "/uploads/cert.pdf",
      status: "pending",
    })

    const res = await request(app).post("/api/certifications")

    expect(res.status).toBe(201)
    expect(CoachCertification.create).toHaveBeenCalledWith({
      coach_user_id: 7,
      document_url: "/uploads/cert.pdf",
      status: "pending",
    })
  })

  it("lists certifications for the authenticated coach", async () => {
    CoachCertification.findAll.mockResolvedValue([
      { certification_id: 4, coach_user_id: 7, document_url: "/uploads/cert.pdf" },
    ])

    const res = await request(app).get("/api/certifications")

    expect(res.status).toBe(200)
    expect(CoachCertification.findAll).toHaveBeenCalledWith({
      where: { coach_user_id: 7 },
    })
    expect(res.body).toHaveLength(1)
  })
})