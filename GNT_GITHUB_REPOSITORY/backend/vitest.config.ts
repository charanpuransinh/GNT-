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
    // 2026-09-05: अनुमति की जाँच चालू है — test user को असली भूमिका यहीं मिलती है।
    // (जाँच बंद करके हरा दिखाना मंज़ूर नहीं; कारण setup फ़ाइल में लिखा है।)
    setupFiles: ['./src/tests/setup/permissions.setup.ts'],
    // DB नहीं है — DB वाले tests fail होकर सच दिखाएँगे (छिपाव नहीं)
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
