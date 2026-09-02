/** ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02। AUDIT-01 F4: frontend का कोई build config था ही नहीं। */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // '@' का वही मतलब जो tsconfig.frontend.json में है — दोनों एक जैसे रहने चाहिए
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // dev में frontend सीधे backend को बुला सके (CORS की झंझट नहीं)
    proxy: { '/api': { target: process.env.VITE_API_TARGET ?? 'http://localhost:3000', changeOrigin: true } },
  },
  build: { outDir: 'dist', sourcemap: true },
});
