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
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // Vitest's pretty-format drops Jest 26's 'Object {' / 'Array [' prefixes
    // by default; restore them so migrating runner does not churn every
    // plain-object/array snapshot in the suite.
    snapshotFormat: { printBasicPrototype: true },
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/index.tsx',
        'src/normality/Histogram.tsx',
        'src/normality/index.tsx',
        'src/normality/linear-gauge/index.ts'
      ]
    }
  }
}));
