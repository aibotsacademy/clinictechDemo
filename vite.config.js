import { defineConfig } from 'vite';

// base './' para que el sitio funcione en cualquier ruta (p. ej. GitHub Pages)
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0
  }
});
