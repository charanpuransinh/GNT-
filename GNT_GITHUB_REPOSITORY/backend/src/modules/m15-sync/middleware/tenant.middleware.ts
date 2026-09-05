import { Request } from 'express';

/**
 * M15 controllers का request type — असली पहचान अब main app की #009 chain से आती है
 * (auth → tenant → permission)। `requireTenant(req)` / `requireUser(req)` common
 * helper से JWT-आधारित `req.tenant.companyId` / `req.user.id` पढ़ा जाता है — कभी
 * header से नहीं (पहले `x-tenant-id` spoof हो सकता था)।
 */
export interface AuthenticatedRequest extends Request {}
