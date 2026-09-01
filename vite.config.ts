/// <reference types="vitest" />
import { defineConfig } from 'vite';
import pkg from './package.json';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  // Must match package.json "homepage" - the app is served from a sub-path.
  base: '/icl-calc/',
  plugins: [react()],
  build: {
    // Vite defaults to dist/. The deploy job publishes ./build and
    // e2e/setup.sh symlinks ../../build; keeping the name avoids churn.
    outDir: 'build'
  },
  define: {
    // The Footer snapshot pins v0.0.t. Sourcing the real version in test
    // mode would make that snapshot churn on every release.
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      mode === 'test' ? '0.0.t' : pkg.version
    )
  }
}));
