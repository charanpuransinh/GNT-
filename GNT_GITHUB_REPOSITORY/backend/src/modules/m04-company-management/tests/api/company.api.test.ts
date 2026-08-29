import request from "supertest";
import { app } from "../../../../app";

describe("M04 API Contract", () => {
  const authToken = "Bearer test-jwt-token";
  const companyId = "550e8400-e29b-41d4-a716-446655440000";

  it("GET /profile matches schema", async () => {
    const res = await request(app).get("/api/v1/company/profile").set("Authorization", authToken).set("X-Company-Id", companyId);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: expect.any(String), name: expect.any(String) });
  });

  it("POST /financial-years accepts valid FY", async () => {
    const res = await request(app).post("/api/v1/company/financial-years").set("Authorization", authToken).set("X-Company-Id", companyId).send({
      startDate: "2026-04-01", endDate: "2027-03-31", prefix: "FY26"
    });
    expect([200, 201]).toContain(res.status);
  });
});
