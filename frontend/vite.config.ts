import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // ✅ Remove base if deploying to root on Vercel
  base: '/',
  plugins: [react()],

  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
