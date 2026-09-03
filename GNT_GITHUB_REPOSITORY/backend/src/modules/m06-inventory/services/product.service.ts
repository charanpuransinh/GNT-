// GNT M06 — Product Service
import { ProductRepository } from '../repositories/product.repository';
import { StockService } from './stock.service';
import { ProductDTO, ProductFilter, PaginatedResult } from '../types/inventory.types';
import { product_master } from '@prisma/client';

const productRepo = new ProductRepository();

export class ProductService {
  async createProduct(data: ProductDTO): Promise<product_master> {
    // Duplicate check
    if (data.code) {
      const exists = await productRepo.existsWithCode(data.code, data.company_id);
      if (exists) throw new Error(`Product with code "${data.code}" already exists`);
    }
    if (data.barcode) {
      const exists = await productRepo.existsWithBarcode(data.barcode, data.company_id);
      if (exists) throw new Error(`Product with barcode "${data.barcode}" already exists`);
    }

    return productRepo.create(data);
  }

  async getProducts(filter: ProductFilter, company_id: string): Promise<PaginatedResult<product_master>> {
    return productRepo.findAll(filter, company_id);
  }

  async getProductById(id: string, company_id: string): Promise<product_master | null> {
    return productRepo.findById(id, company_id);
  }

  async updateProduct(id: string, data: Partial<ProductDTO>, company_id: string): Promise<product_master> {
    if (data.code) {
      const exists = await productRepo.existsWithCode(data.code, company_id, id);
      if (exists) throw new Error(`Product with code "${data.code}" already exists`);
    }
    if (data.barcode) {
      const exists = await productRepo.existsWithBarcode(data.barcode, company_id, id);
      if (exists) throw new Error(`Product with barcode "${data.barcode}" already exists`);
    }

    return productRepo.update(id, data, company_id);
  }

  async deleteProduct(id: string, company_id: string): Promise<product_master> {
    return productRepo.softDelete(id, company_id);
  }

  async searchProducts(search: string, company_id: string): Promise<product_master[]> {
    return productRepo.findAll({ search, limit: 50 }, company_id).then(r => r.data);
  }

  async getProductStock(product_id: string, company_id: string, branch_id?: string) {
    const stockService = new StockService();
    return stockService.getStockByProduct(product_id, company_id, branch_id);
  }

  async bulkImportProducts(products: ProductDTO[]): Promise<{ created: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;

    for (const product of products) {
      try {
        await this.createProduct(product);
        created++;
      } catch (err: any) {
        errors.push(`Failed to create "${product.name}": ${err.message}`);
      }
    }

    return { created, errors };
  }
}
