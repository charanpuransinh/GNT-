// GNT M06 — Category Controller
import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { categorySchema, categoryUpdateSchema } from '../validators/inventory.schema';

const categoryService = new CategoryService();

export class CategoryController {
  async createCategory(req: Request, res: Response) {
    try {
      const validated = categorySchema.parse(req.body);
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const category = await categoryService.createCategory({ ...validated, company_id });
      return res.status(201).json({ success: true, data: category });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const categories = await categoryService.getCategories(company_id);
      return res.json({ success: true, data: categories });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async getCategoryTree(req: Request, res: Response) {
    try {
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const tree = await categoryService.getCategoryTree(company_id);
      return res.json({ success: true, data: tree });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const validated = categoryUpdateSchema.parse(req.body);
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const category = await categoryService.updateCategory(id, validated, company_id);
      return res.json({ success: true, data: category });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const category = await categoryService.deleteCategory(id, company_id);
      return res.json({ success: true, data: category });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
