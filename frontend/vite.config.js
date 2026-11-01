import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_BACKEND_ORIGIN || 'http://localhost:8080';
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Same-origin in development: the refresh-token cookie (SameSite=Strict) and uploaded images just work.
      proxy: { '/api': backend, '/uploads': backend },
    },
    test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.js', css: false },
  };
});
