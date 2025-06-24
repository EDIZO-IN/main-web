import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/main-web/',
  plugins: [react()],
  
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
