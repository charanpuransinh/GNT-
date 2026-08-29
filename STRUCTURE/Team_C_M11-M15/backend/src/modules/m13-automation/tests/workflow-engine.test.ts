// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — WORKFLOW ENGINE UNIT TESTS
// Module: M13 | Layer: Tests (Unit)
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkflowEngineService } from "../../src/services/workflow-engine.service";
import { M13JobStatus } from "../../src/types/m13.types";

// Mock PrismaClient
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    m13Workflow: {
      findUnique: vi.fn(),
    },
    m13Job: {
      create: vi.fn().mockResolvedValue({ id: "job-123" }),
      update: vi.fn().mockResolvedValue({}),
    },
  })),
}));

// Mock BullMQ queue
vi.mock("../../src/queue/queue.setup", () => ({
  getM13Queue: vi.fn().mockReturnValue({
    add: vi.fn().mockResolvedValue({}),
  }),
}));

describe("WorkflowEngineService", () => {
  const service = new WorkflowEngineService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should trigger workflow and return jobId", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Workflow.findUnique as any).mockResolvedValue({
      id: "wf-1",
      isActive: true,
      triggers: [],
      actions: [],
    });

    const jobId = await service.triggerWorkflow("wf-1", { test: true });
    expect(typeof jobId).toBe("string");
  });

  it("should throw if workflow not found", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Workflow.findUnique as any).mockResolvedValue(null);

    await expect(service.triggerWorkflow("invalid-id", {})).rejects.toThrow("[M13] Workflow not found");
  });

  it("should throw if workflow is inactive", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Workflow.findUnique as any).mockResolvedValue({
      id: "wf-1",
      isActive: false,
      triggers: [],
      actions: [],
    });

    await expect(service.triggerWorkflow("wf-1", {})).rejects.toThrow("[M13] Workflow is inactive");
  });

  it("should create job with PENDING status", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Workflow.findUnique as any).mockResolvedValue({
      id: "wf-1",
      isActive: true,
      triggers: [],
      actions: [],
    });

    await service.triggerWorkflow("wf-1", { test: true });
    expect(prisma.m13Job.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: M13JobStatus.PENDING }),
      })
    );
  });
});
