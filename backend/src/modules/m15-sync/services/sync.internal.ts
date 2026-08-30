// sync.internal.ts — replace implicit any error usage
import axios from 'axios';

const INTERNAL_API_BASE = process.env.INTERNAL_API_BASE || 'http://localhost:3000';

export class SyncInternal {
  static async callModuleAPI(modulePath: string, endpoint: string, params: Record<string, unknown>) {
    try {
      const res = await axios.get(`${INTERNAL_API_BASE}${modulePath}${endpoint}`, { params });
      return res.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal API call failed';
      console.error(`[M15] Cross-module call failed: ${modulePath}${endpoint}`, message);
      throw new Error(`Module API unreachable: ${message}`);
    }
  }
}
