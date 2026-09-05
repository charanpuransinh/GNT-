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
    return prisma.externalIntegration.create({
      data: {
        ...data,
        authConfig: data.authConfig as never,
        endpoints: data.endpoints as never,
        rateLimitConfig: data.rateLimitConfig as never
      }
    });
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
    const result = await prisma.externalIntegration.updateMany({
      where: { id, tenantId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.authConfig && { authConfig: data.authConfig as never }),
        ...(data.baseUrl && { baseUrl: data.baseUrl }),
        ...(data.apiVersion && { apiVersion: data.apiVersion }),
        ...(data.endpoints && { endpoints: data.endpoints as never }),
        ...(data.status && { status: data.status }),
        ...(data.rateLimitConfig && { rateLimitConfig: data.rateLimitConfig as never }),
        updatedAt: new Date()
      }
    });
    if (result.count === 0) throw new Error('Integration not found');
    const integration = await prisma.externalIntegration.findFirst({ where: { id, tenantId } });
    if (!integration) throw new Error('Integration not found');
    return integration;
  }

  static async deleteIntegration(id: string, tenantId: string): Promise<ExternalIntegration> {
    const existing = await prisma.externalIntegration.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Integration not found');
    await prisma.externalIntegration.deleteMany({ where: { id, tenantId } });
    return existing;
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

  static async healthCheckAll(tenantId: string) {
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
          return this.refreshOAuth2Token(integrationId, tenantId, authConfig);
        }
        return authConfig.accessToken || null;
      case 'BASIC':
        return authConfig.credentials || null;
      default:
        return null;
    }
  }

  /**
   * Refresh an expired OAuth2 access token using the stored refresh token.
   * Persists the refreshed token back to the integration so the next call is a cache hit.
   * Returns null when refresh is impossible (no refresh token/token URL) or the provider rejects it.
   */
  private static async refreshOAuth2Token(
    integrationId: string,
    tenantId: string,
    authConfig: any
  ): Promise<string | null> {
    if (!authConfig.refreshToken || !authConfig.tokenUrl) {
      return null;
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', authConfig.refreshToken);
      if (authConfig.clientId) params.append('client_id', authConfig.clientId);
      if (authConfig.clientSecret) params.append('client_secret', authConfig.clientSecret);
      if (authConfig.scope) params.append('scope', authConfig.scope);

      const res = await axios.post(authConfig.tokenUrl, params, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const newToken = res.data?.access_token ?? res.data?.accessToken;
      if (!newToken) return null;

      const expiresIn = Number(res.data?.expires_in ?? res.data?.expiresIn ?? 0);
      const newRefreshToken = res.data?.refresh_token ?? res.data?.refreshToken;

      const updatedConfig = {
        ...authConfig,
        accessToken: newToken,
        ...(newRefreshToken ? { refreshToken: newRefreshToken } : {}),
        ...(expiresIn > 0
          ? { expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString() }
          : {})
      };

      await prisma.externalIntegration.update({
        where: { id: integrationId },
        data: { authConfig: updatedConfig as never }
      });

      return newToken;
    } catch {
      // Provider rejected the refresh — token is unusable, return null (caller should re-auth).
      return null;
    }
  }
}
