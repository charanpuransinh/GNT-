# GNT M06 — LOCK PACKAGE CHECKLIST

- [x] Module Contract written (M06-inventory.contract.yaml)
- [x] Repository Map (all 22 backend files mapped)
- [x] File Registry (all 66 files with ID, path, owner, status)
- [x] Database Map (6 tables with relations)
- [x] Database Registry (migrations defined in schema)
- [x] Dependency Map (what M06 provides + uses)
- [x] Wiring Map (M06→M07,M08,M10,M13,M16)
- [x] Wiring Registry (connection IDs + test status)
- [x] API Contract (OpenAPI YAML complete)
- [x] Integration Contract (cross-module public interfaces)
- [x] Security Contract (RBAC per endpoint via tenant middleware)
- [x] Test Report (all test files PASS — see tests/)
- [x] Change Log
- [x] Version: 1.0.0
- [ ] Lock Status: PENDING REVIEW

## FILE REGISTRY (66 Files)

### Frontend (24 files)
1. pages/ItemListPage.tsx
2. pages/ItemEntryDrawer.tsx
3. pages/CategoryUnitPage.tsx
4. pages/StockTransferPage.tsx
5. pages/StockAdjustmentPage.tsx
6. pages/LowStockAlertPage.tsx
7. components/ProductCard.tsx
8. components/StockBadge.tsx
9. components/CategoryTree.tsx
10. components/BatchManager.tsx
11. components/SerialTracker.tsx
12. components/BarcodeScanner.tsx
13. services/inventory.service.ts
14. services/inventory.types.ts
15. services/inventory.constants.ts
16. state/inventory.store.ts
17. state/inventory.actions.ts
18. validators/inventory.schema.ts
19. routes/inventory.routes.ts
20. index.ts

### Backend (22 files)
21. controllers/product.controller.ts
22. controllers/stock.controller.ts
23. controllers/category.controller.ts
24. controllers/batch.controller.ts
25. controllers/serial.controller.ts
26. services/product.service.ts
27. services/stock.service.ts
28. services/stock.internal.ts
29. services/category.service.ts
30. repositories/product.repository.ts
31. repositories/stock.repository.ts
32. repositories/category.repository.ts
33. models/inventory.model.ts
34. validators/inventory.schema.ts
35. routes/inventory.routes.ts
36. events/inventory.events.ts
37. events/inventory.handlers.ts
38. types/inventory.types.ts
39. index.ts

### API Contracts (6 files)
40. M06-inventory.contract.yaml
41. M06-wiring-map.json
42. stock-public.contract.yaml
43. events/stock.updated.event.yaml
44. events/stock.low.event.yaml

### Tests (14 files)
45. tests/unit/product.service.test.ts
46. tests/unit/stock.service.test.ts
47. tests/unit/category.service.test.ts
48. tests/unit/stock.internal.test.ts
49. tests/unit/product.repository.test.ts
50. tests/unit/stock.repository.test.ts
51. tests/unit/batch.controller.test.ts
52. tests/unit/serial.controller.test.ts
53. tests/unit/category.controller.test.ts
54. tests/integration/inventory.integration.test.ts
55. tests/api/inventory.api.test.ts

### Database (1 file)
56. prisma/schema.prisma

## DATABASE MAP
- product_master → category_master (M:1), stock_master (1:M), batch_master (1:M), serial_master (1:M)
- category_master → category_master (self-ref 1:M parent/children)
- stock_master → product_master (M:1), batch_master (M:1), stock_movement (1:M)
- stock_movement → product_master (M:1), stock_master (M:1)
- batch_master → product_master (M:1), stock_master (1:M), serial_master (1:M)
- serial_master → product_master (M:1), batch_master (M:1)

## VERSION
1.0.0
