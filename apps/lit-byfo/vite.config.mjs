import process from 'node:process';
import { firebaseConfig } from './firebase.config';
import { defineConfig } from 'vite';

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
}));
