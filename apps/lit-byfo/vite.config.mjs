import process from 'node:process';
import { firebaseConfig } from './firebase.config';
import { defineConfig } from 'vite';
import path from 'path';

const createDateStrings = () => {
  const dateObj = new Date();

  const year = dateObj.getFullYear();
  const full = dateObj.toString();
  return process.env.NODE_ENV === 'development' ? { year, full, date: dateObj } : { year };
};

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    port: 5150,
    strictPort: true,
  },
  define: {
    __BUILD_DATE__: createDateStrings(),
    __FIREBASE_CONFIG__: firebaseConfig,
  },
  resolve: {
    alias: {
      '@byfo/utils': path.resolve(import.meta.dirname, '../../packages/byfo-app-utils/src/index.ts'),
      '@byfo/components/functional': path.resolve(
        import.meta.dirname,
        '../../packages/byfo-app-components/src/components/functional/index.ts',
      ),
      '@byfo/components/all': path.resolve(
        import.meta.dirname,
        '../../packages/byfo-app-components/src/components/index.ts',
      ),
      '@byfo/components': path.resolve(import.meta.dirname, '../../packages/byfo-app-components/src'),
    },
  },
}));
