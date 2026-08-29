import request from "supertest";
import { app } from "../../../../app";

describe("M04 Company Integration", () => {
  const authToken = "Bearer test-jwt-token";
  const companyId = "550e8400-e29b-41d4-a716-446655440000";

  describe("GET /api/v1/company/profile", () => {
    it("returns 200 with profile", async () => {
      const res = await request(app).get("/api/v1/company/profile").set("Authorization", authToken).set("X-Company-Id", companyId);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/v1/company/profile");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/company/branches", () => {
    it("creates branch", async () => {
      const res = await request(app).post("/api/v1/company/branches").set("Authorization", authToken).set("X-Company-Id", companyId).send({ name: "Main Godown" });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
    });
  });
});
