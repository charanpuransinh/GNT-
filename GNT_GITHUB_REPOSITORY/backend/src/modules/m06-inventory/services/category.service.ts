// GNT M06 — Category Service
import { CategoryRepository } from '../repositories/category.repository';
import { ProductRepository } from '../repositories/product.repository';
import { CategoryDTO } from '../types/inventory.types';
import { category_master } from '@prisma/client';

const categoryRepo = new CategoryRepository();
const productRepo = new ProductRepository();

export class CategoryService {
  async createCategory(data: CategoryDTO): Promise<category_master> {
    return categoryRepo.create(data);
  }

  async getCategories(company_id: string): Promise<category_master[]> {
    return categoryRepo.findAll(company_id);
  }

  async getCategoryTree(company_id: string): Promise<category_master[]> {
    return categoryRepo.findTree(company_id);
  }

  async updateCategory(id: string, data: Partial<CategoryDTO>, company_id: string): Promise<category_master> {
    return categoryRepo.update(id, data, company_id);
  }

  async deleteCategory(id: string, company_id: string): Promise<category_master> {
    // Check if category has products
    const productCount = await productRepo.countByCategory(id, company_id);
    if (productCount > 0) {
      throw new Error(`Cannot delete category: ${productCount} product(s) are assigned to it`);
    }

    // Check if category has children
    const hasChildren = await categoryRepo.hasChildren(id, company_id);
    if (hasChildren) {
      throw new Error('Cannot delete category: it has sub-categories');
    }

    return categoryRepo.delete(id, company_id);
  }
}
