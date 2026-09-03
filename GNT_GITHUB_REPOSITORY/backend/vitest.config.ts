import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// GNT backend — vitest config (टास्क #024 F2)
// @/ alias वही जो tsconfig.backend.json में है; सारे tests एक ही runner पर।
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // DB नहीं है — DB वाले tests fail होकर सच दिखाएँगे (छिपाव नहीं)
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
