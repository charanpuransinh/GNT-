// [LOCK-5] Department Controller
import { Request, Response } from 'express';
import { DepartmentService } from '../services/department.service';

export class DepartmentController {
  private service = new DepartmentService();

  async create(req: Request, res: Response) {
    try {
      const dept = await this.service.create(req.body);
      res.status(201).json({ success: true, data: dept });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const depts = await this.service.findAll();
      res.json({ success: true, data: depts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const dept = await this.service.update(req.params.id, req.body);
      res.json({ success: true, data: dept });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await this.service.remove(req.params.id);
      res.json({ success: true, message: 'Department deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getTree(req: Request, res: Response) {
    try {
      const tree = await this.service.getDepartmentTree();
      res.json({ success: true, data: tree });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
