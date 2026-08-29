// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — TRIGGER EVALUATOR UNIT TESTS
// Module: M13 | Layer: Tests (Unit)
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TriggerEvaluatorService } from "../../src/services/trigger-evaluator.service";
import { M13EventPayload } from "../../src/types/m13.types";

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    m13Trigger: {
      findMany: vi.fn(),
    },
    m13Schedule: {
      findUnique: vi.fn(),
    },
    m13Workflow: {
      findUnique: vi.fn(),
    },
  })),
}));

describe("TriggerEvaluatorService", () => {
  const service = new TriggerEvaluatorService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should evaluate event trigger and return matched workflowIds", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Trigger.findMany as any).mockResolvedValue([
      {
        workflowId: "wf-1",
        type: "EVENT",
        config: { eventName: "user.created" },
        isActive: true,
      },
    ]);

    const event: M13EventPayload = {
      eventName: "user.created",
      sourceModule: "M12",
      data: { userId: "123" },
      timestamp: new Date(),
    };

    const result = await service.evaluateEventTrigger(event);
    expect(result).toEqual(["wf-1"]);
  });

  it("should return empty array for non-matching event", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Trigger.findMany as any).mockResolvedValue([]);

    const event: M13EventPayload = {
      eventName: "nonexistent.event",
      sourceModule: "M12",
      data: {},
      timestamp: new Date(),
    };

    const result = await service.evaluateEventTrigger(event);
    expect(result).toEqual([]);
  });

  it("should return null for inactive schedule", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Schedule.findUnique as any).mockResolvedValue({
      id: "sched-1",
      isActive: false,
      workflowId: "wf-1",
    });

    const result = await service.evaluateScheduleTrigger("sched-1");
    expect(result).toBeNull();
  });

  it("should return workflowId for active schedule", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Schedule.findUnique as any).mockResolvedValue({
      id: "sched-1",
      isActive: true,
      workflowId: "wf-1",
    });

    const result = await service.evaluateScheduleTrigger("sched-1");
    expect(result).toBe("wf-1");
  });

  it("should return false for workflow without manual trigger", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Workflow.findUnique as any).mockResolvedValue({
      id: "wf-1",
      isActive: true,
      triggers: [{ type: "EVENT", isActive: true }],
    });

    const result = await service.evaluateManualTrigger("wf-1");
    expect(result).toBe(false);
  });

  it("should return true for workflow with active manual trigger", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    (prisma.m13Workflow.findUnique as any).mockResolvedValue({
      id: "wf-1",
      isActive: true,
      triggers: [{ type: "MANUAL", isActive: true }],
    });

    const result = await service.evaluateManualTrigger("wf-1");
    expect(result).toBe(true);
  });
});
