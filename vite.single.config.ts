import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({ plugins: [react(), viteSingleFile()], publicDir: false,
  build: { outDir: 'dist-single', assetsInlineLimit: 100000000, target: 'es2019', modulePreload: false,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } } } });
