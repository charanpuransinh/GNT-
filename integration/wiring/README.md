# GNT M23-M34 Wiring

This directory contains the integration contract for M23-M34.

Rules:
1. Do not guess existing controller/service exports.
2. Do not overwrite existing wiring.
3. Register permissions through the canonical M02 permission system.
4. Tenant context must come from trusted server authentication.
5. Every protected route requires authentication + tenant + permission + scope.
6. M25 realtime uses Socket.IO.
7. M34 must use M08/M09 financial contracts instead of creating another billing engine.
8. M32 must use the existing scheduler if one already exists.
9. Actual router mounting must use verified repository exports.
10. Wiring is READY only after integration, security, tenant, permission and regression tests pass.
