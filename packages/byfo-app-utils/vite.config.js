import { defineConfig } from 'vite';
import dedupeFirebaseLicense from './dedupe-license';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [dedupeFirebaseLicense()],
  build: {
    lib: {
      entry: {
        main: './src/index.ts',
        firebase: './src/firebase.ts',
        config: './src/config.ts',
        storage: './src/storage.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      treeshake: 'smallest',
      output: {
        //preserveModules: true,
        //preserveModulesRoot: './src',
      },
    },
  },
}));
