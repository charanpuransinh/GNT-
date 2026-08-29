// GNT M06 — Inventory Routes (COMPLETE with Batch + Serial)
import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { StockController } from '../controllers/stock.controller';
import { CategoryController } from '../controllers/category.controller';
import { BatchController } from '../controllers/batch.controller';
import { SerialController } from '../controllers/serial.controller';

const router = Router();
const productController = new ProductController();
const stockController = new StockController();
const categoryController = new CategoryController();
const batchController = new BatchController();
const serialController = new SerialController();

// ─── PRODUCT ROUTES ───
router.post('/products', productController.createProduct);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.get('/products/:id/stock', productController.getProductStock);
router.post('/products/bulk-import', productController.bulkImportProducts);

// ─── STOCK ROUTES ───
router.get('/stock', stockController.getStock);
router.post('/stock/adjustment', stockController.adjustStock);
router.post('/stock/transfer', stockController.transferStock);
router.get('/stock/movements', stockController.getStockMovements);
router.get('/stock/low', stockController.getLowStock);
router.post('/stock/check', stockController.checkAvailability);

// ─── CATEGORY ROUTES ───
router.post('/categories', categoryController.createCategory);
router.get('/categories', categoryController.getCategories);
router.get('/categories/tree', categoryController.getCategoryTree);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// ─── BATCH ROUTES ───
router.post('/batches', batchController.createBatch);
router.get('/batches', batchController.getBatches);
router.put('/batches/:id', batchController.updateBatch);

// ─── SERIAL ROUTES ───
router.post('/serials', serialController.createSerial);
router.get('/serials', serialController.getSerials);
router.put('/serials/:id/status', serialController.updateSerialStatus);

export default router;
