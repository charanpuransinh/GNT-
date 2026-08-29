// GNT M06 — Product Controller
import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import {
  productSchema,
  productUpdateSchema,
  productFilterSchema,
} from '../validators/inventory.schema';

const productService = new ProductService();

export class ProductController {
  async createProduct(req: Request, res: Response) {
    try {
      const validated = productSchema.parse(req.body);
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const product = await productService.createProduct({ ...validated, company_id });
      return res.status(201).json({ success: true, data: product });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const filter = productFilterSchema.parse(req.query);
      const result = await productService.getProducts(filter, company_id);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const product = await productService.getProductById(id, company_id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      return res.json({ success: true, data: product });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = productUpdateSchema.parse(req.body);
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const product = await productService.updateProduct(id, validated, company_id);
      return res.json({ success: true, data: product });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const product = await productService.deleteProduct(id, company_id);
      return res.json({ success: true, data: product });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async getProductStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const company_id = (req as any).tenant?.company_id;
      const branch_id = req.query.branch_id as string | undefined;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const stock = await productService.getProductStock(id, company_id, branch_id);
      return res.json({ success: true, data: stock });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async bulkImportProducts(req: Request, res: Response) {
    try {
      const company_id = (req as any).tenant?.company_id;
      if (!company_id) return res.status(400).json({ error: 'Company context required' });

      const products = req.body.products?.map((p: any) => ({ ...p, company_id }));
      if (!Array.isArray(products)) return res.status(400).json({ error: 'products array required' });

      const result = await productService.bulkImportProducts(products);
      return res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
