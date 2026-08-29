import { PrismaClient, ExternalIntegration } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export class IntegrationService {
  static async createIntegration(data: {
    tenantId: string;
    integrationCode: string;
    name: string;
    description?: string;
    provider: string;
    providerVersion?: string;
    authType: string;
    authConfig: Record<string, unknown>;
    baseUrl?: string;
    apiVersion?: string;
    endpoints?: Record<string, unknown>;
    rateLimitConfig?: Record<string, unknown>;
  }): Promise<ExternalIntegration> {
    return prisma.externalIntegration.create({ data });
  }

  static async getIntegration(id: string, tenantId: string): Promise<ExternalIntegration | null> {
    return prisma.externalIntegration.findFirst({ where: { id, tenantId } });
  }

  static async getIntegrationByCode(integrationCode: string, tenantId: string): Promise<ExternalIntegration | null> {
    return prisma.externalIntegration.findFirst({ where: { integrationCode, tenantId } });
  }

  static async listIntegrations(tenantId: string, filters?: { provider?: string; status?: string }): Promise<ExternalIntegration[]> {
    return prisma.externalIntegration.findMany({
      where: {
        tenantId,
        ...(filters?.provider && { provider: filters.provider }),
        ...(filters?.status && { status: filters.status })
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateIntegration(id: string, tenantId: string, data: Partial<ExternalIntegration>): Promise<ExternalIntegration> {
    return prisma.externalIntegration.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.authConfig && { authConfig: data.authConfig }),
        ...(data.baseUrl && { baseUrl: data.baseUrl }),
        ...(data.apiVersion && { apiVersion: data.apiVersion }),
        ...(data.endpoints && { endpoints: data.endpoints }),
        ...(data.status && { status: data.status }),
        ...(data.rateLimitConfig && { rateLimitConfig: data.rateLimitConfig }),
        updatedAt: new Date()
      }
    });
  }

  static async deleteIntegration(id: string, tenantId: string): Promise<ExternalIntegration> {
    return prisma.externalIntegration.delete({
      where: { id }
    });
  }

  static async healthCheck(integrationId: string, tenantId: string): Promise<{
    integrationId: string;
    status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    latencyMs: number;
    lastError?: string;
    checkedAt: string;
  }> {
    const integration = await prisma.externalIntegration.findFirst({
      where: { id: integrationId, tenantId }
    });
    if (!integration) throw new Error('Integration not found');

    const start = Date.now();
    let status: 'HEALTHY' | 'DEGRADED' | 'DOWN' = 'DOWN';
    let lastError: string | undefined;

    try {
      if (integration.baseUrl) {
        // Attempt a lightweight health check
        await axios.get(integration.baseUrl, {
          timeout: 10000,
          validateStatus: () => true
        });
        status = 'HEALTHY';
      } else {
        status = 'DEGRADED';
        lastError = 'No base URL configured';
      }
    } catch (error: any) {
      status = 'DOWN';
      lastError = error.message;
    }

    const latencyMs = Date.now() - start;

    await prisma.externalIntegration.update({
      where: { id: integrationId },
      data: {
        lastHealthCheck: new Date(),
        healthStatus: status
      }
    });

    return {
      integrationId,
      status,
      latencyMs,
      lastError,
      checkedAt: new Date().toISOString()
    };
  }

  static async healthCheckAll(tenantId: string): Promise<Array<ReturnType<typeof this.healthCheck>>> {
    const integrations = await prisma.externalIntegration.findMany({
      where: { tenantId, status: 'ACTIVE' }
    });

    return Promise.all(
      integrations.map(i => this.healthCheck(i.id, tenantId))
    );
  }

  static async getAuthToken(integrationId: string, tenantId: string): Promise<string | null> {
    const integration = await prisma.externalIntegration.findFirst({
      where: { id: integrationId, tenantId }
    });
    if (!integration) return null;

    const authConfig = integration.authConfig as any;

    switch (integration.authType) {
      case 'API_KEY':
        return authConfig.apiKey || null;
      case 'OAUTH2':
        // Check if token needs refresh
        if (authConfig.accessToken && authConfig.expiresAt) {
          const expiresAt = new Date(authConfig.expiresAt);
          if (expiresAt > new Date()) {
            return authConfig.accessToken;
          }
          // TODO: Refresh token logic
        }
        return authConfig.accessToken || null;
      case 'BASIC':
        return authConfig.credentials || null;
      default:
        return null;
    }
  }
}
