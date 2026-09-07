// M14 — Template Controller
// tenant/user पहचान सिर्फ़ verified token से (requireTenant/requireUser) — query/body
// में भेजा हुआ tenantId कभी भरोसे में नहीं लिया जाता (पहले list/getDefault query से,
// create पूरा req.body से tenantId लेते थे — cross-tenant छेद)।
import { Request, Response } from 'express';
import { AppError } from '@/common/errors/error-classes';
import { requireTenant, requireUser } from '@/common/middleware/require-tenant';
import { TemplateService } from '../services/template.service';

const service = new TemplateService();

function fail(res: Response, err: unknown) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: err.code, message: err.message });
  }
  const message = err instanceof Error ? err.message : 'Template operation failed';
  return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message });
}

export class TemplateController {
  static async create(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const userId = requireUser(req).id;
      const { name, targetModule, targetEntity, fileType, columnMapping, mappings, isDefault, sampleFileUrl } = req.body ?? {};
      if (!name || !targetModule || !targetEntity) {
        throw new AppError('VALIDATION_ERROR', 'name, targetModule and targetEntity are required', 400);
      }
      const template = await service.createTemplate({
        tenantId,
        userId,
        name,
        targetModule,
        targetEntity,
        fileType: fileType ?? 'csv',
        columnMapping: columnMapping ?? mappings ?? [],
        isDefault: isDefault === true || isDefault === 'true',
        sampleFileUrl,
      });
      res.status(201).json({ success: true, data: template });
    } catch (err) {
      fail(res, err);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const id = String(req.params.id);
      const { name, targetModule, targetEntity, mappings, columnMapping, isDefault } = req.body ?? {};
      const template = await service.updateTemplate(id, tenantId, {
        ...(name !== undefined && { name }),
        ...(targetModule !== undefined && { targetModule }),
        ...(targetEntity !== undefined && { targetEntity }),
        ...((mappings ?? columnMapping) !== undefined && { mappings: mappings ?? columnMapping }),
        ...(isDefault !== undefined && { isDefault: isDefault === true || isDefault === 'true' }),
      });
      res.json({ success: true, data: template });
    } catch (err) {
      fail(res, err);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      await service.deleteTemplate(String(req.params.id), tenantId);
      res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
      fail(res, err);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const template = await service.getTemplateById(String(req.params.id), tenantId);
      res.json({ success: true, data: template });
    } catch (err) {
      fail(res, err);
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const { module, entityType, targetModule, targetEntity } = req.query;
      const templates = await service.getTemplates(
        tenantId,
        (targetModule ?? module) ? String(targetModule ?? module) : undefined,
        (targetEntity ?? entityType) ? String(targetEntity ?? entityType) : undefined,
      );
      res.json({ success: true, data: templates });
    } catch (err) {
      fail(res, err);
    }
  }

  static async getDefault(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const { module, entityType, targetModule, targetEntity } = req.query;
      const mod = String(targetModule ?? module ?? '');
      const ent = String(targetEntity ?? entityType ?? '');
      if (!mod || !ent) {
        throw new AppError('VALIDATION_ERROR', 'module and entityType query params are required', 400);
      }
      const template = await service.getDefaultTemplate(tenantId, mod, ent);
      res.json({ success: true, data: template });
    } catch (err) {
      fail(res, err);
    }
  }
}
