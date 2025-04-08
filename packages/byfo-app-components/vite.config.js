import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  build: {
    lib: {
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      treeshake: 'smallest',
      output: {
        preserveModules: true,
      },
    },
  },
  resolve: {
    alias: {
      '@byfo/utils': path.resolve(import.meta.dirname, '../byfo-app-utils/src/index.ts'),
      '@byfo/themes': path.resolve(import.meta.dirname, '../byfo-app-themes/src/index.ts'),
    },
  },
}));
