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
    outDir: 'build',
    // Vite 4 defaults this to false. The oracle deployed .map files to
    // the public gh-pages path and Sentry (src/index.tsx) fetches them
    // for production error stack traces (issue #42 tracks reading that
    // backlog) - leaving this off silently drops a live capability.
    sourcemap: true
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
    // CRA's Jest preset set resetMocks: true; this config does not, and
    // Vitest defaults to false too. Currently inert - both spyOn usages
    // are single-test files with an explicit mockRestore() - but don't
    // assume Jest-style auto-reset between tests if that changes.
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
