# LOCK 10: STATE MANAGEMENT LOCK
Store: Zustand (single store per module)

## Rules
- Async actions handle loading + error internally
- No Redux - Zustand for simplicity and performance
- Selectors: Direct store access via hooks
- State shape: { entities[], selectedEntity, isLoading, error }
