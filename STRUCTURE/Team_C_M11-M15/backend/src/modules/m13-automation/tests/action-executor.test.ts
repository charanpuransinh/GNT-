// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — ACTION EXECUTOR UNIT TESTS
// Module: M13 | Layer: Tests (Unit)
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionExecutorService } from "../../src/services/action-executor.service";
import { M13ActionType, M13WorkflowContext } from "../../src/types/m13.types";

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    m13Action: {
      findUnique: vi.fn(),
    },
    m13JobLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  })),
}));

describe("ActionExecutorService", () => {
  const service = new ActionExecutorService();
  const mockContext: M13WorkflowContext = {
    workflowId: "wf-1",
    jobId: "job-1",
    payload: {},
    metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for unknown action type", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Action.findUnique as any).mockResolvedValue({
      id: "act-1",
      type: "UNKNOWN_TYPE",
      config: {},
    });

    const result = await service.executeAction("act-1", mockContext);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unsupported action type");
  });

  it("should execute SEND_EMAIL action successfully", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Action.findUnique as any).mockResolvedValue({
      id: "act-1",
      type: M13ActionType.SEND_EMAIL,
      config: { to: "test@example.com", subject: "Test" },
    });

    const result = await service.executeAction("act-1", mockContext);
    expect(result.success).toBe(true);
    expect(result.data?.action).toBe("SEND_EMAIL");
  });

  it("should execute UPDATE_RECORD action successfully", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Action.findUnique as any).mockResolvedValue({
      id: "act-2",
      type: M13ActionType.UPDATE_RECORD,
      config: { table: "users", data: { status: "active" } },
    });

    const result = await service.executeAction("act-2", mockContext);
    expect(result.success).toBe(true);
    expect(result.data?.action).toBe("UPDATE_RECORD");
  });

  it("should execute CALL_API action successfully", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Action.findUnique as any).mockResolvedValue({
      id: "act-3",
      type: M13ActionType.CALL_API,
      config: { endpoint: "/api/test", method: "POST" },
    });

    const result = await service.executeAction("act-3", mockContext);
    expect(result.success).toBe(true);
    expect(result.data?.action).toBe("CALL_API");
  });

  it("should return error when action not found", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Action.findUnique as any).mockResolvedValue(null);

    const result = await service.executeAction("nonexistent", mockContext);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Action not found");
  });
});
