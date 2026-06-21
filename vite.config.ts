import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { siteSeoPlugin } from './vite-plugin-site-seo';

export default defineConfig({
  plugins: [react(), tailwindcss(), siteSeoPlugin()],
  base: '/',
});
