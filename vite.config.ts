/// <reference types="vitest" />
import { defineConfig } from 'vite';
import coverageThresholds from './coverage-thresholds.json';
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
    sourcemap: true,
    // Pinned explicitly, matching Vite 4's own default ('modules'), so a
    // future Vite 5/6 upgrade cannot move this floor silently - it would
    // need to touch this line, which someone then has to review. The owner
    // decided (final review, Phase 3a Task 6) to accept an ESM-only floor
    // at these four versions; see docs/superpowers/specs/
    // 2026-08-30-icl-calc-modernization-design.md for the consequences
    // (autoprefixer is gone, below-floor renders blank, no CI gate for it).
    target: ['chrome87', 'edge88', 'firefox78', 'safari14']
  },
  define: {
    // The Footer snapshot pins v0.0.t. Sourcing the real version in test
    // mode would make that snapshot churn on every release.
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      mode === 'test' ? '0.0.t' : pkg.version
    ),
    // The commit this bundle was built from. The version alone cannot
    // identify a build: `deploy` publishes on every push to main, but
    // semantic-release only bumps package.json when a commit since the last
    // tag was release-triggering, so a ci:/chore: change ships an artifact
    // that still reports the previous version. That is not hypothetical -
    // #90 rewrote the footer's own links and shipped under v1.8.3, whose
    // tag predates it, making the version link point at source the running
    // build does not contain (#94).
    //
    // GITHUB_SHA only, never a local `git rev-parse`. A CI checkout is clean
    // by construction, so the SHA describes the tree that was built; a local
    // tree can be dirty, and stamping a commit onto a build that does not
    // match it would reintroduce the exact false claim this exists to fix.
    // Local builds say 'dev', which is true.
    //
    // Pinned in test mode for the same reason as the version above.
    'import.meta.env.VITE_APP_COMMIT': JSON.stringify(
      mode === 'test' ? '0000000' : (process.env.GITHUB_SHA ?? 'dev').slice(0, 7)
    )
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Vitest 5 no longer resolves `base` into import.meta.env.BASE_URL for
    // the test environment: it reports '/' where vitest 1 reported
    // '/icl-calc/'. Production is unaffected - a real `npm run build` still
    // emits href="/icl-calc/" and every asset path under /icl-calc/ - so
    // this is purely a test-environment divergence.
    //
    // Pinned rather than absorbed into the snapshots, because NavBar renders
    // BASE_URL into the brand link: recording '/' would have the L1 suite
    // assert a path the shipped app never uses, and stop it catching a real
    // base-path regression - exactly the break `base` exists to prevent,
    // since this app is served from a sub-path (see `base` above).
    env: { BASE_URL: '/icl-calc/' },
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
      // json-summary feeds the PR comment in .github/workflows/main.yml;
      // text is what the job summary scrapes; lcov is kept because it is
      // the portable format any future tool will read.
      reporter: ['text', 'lcov', 'json-summary'],
      // The single source for these lives in coverage-thresholds.json,
      // because .github/scripts/coverage-comment.js needs the same numbers
      // and plain CI JavaScript cannot import this TypeScript config. An
      // earlier version duplicated them in both places - the same
      // two-copies-of-one-truth mistake that let the histogram and its
      // gauge drift apart in #51, caught there only by eye.
      //
      // They are a ratchet, not an aspiration: CI fails when coverage drops
      // below them, which is strictly stronger than the comment Codecov
      // used to post (issue #46). Seeded at the numbers measured on
      // 2026-09-05, after #51 brought the Normality tab under test for the
      // first time.
      //
      // Not 100: src/index.tsx is excluded below, and the ResizeObserver
      // path in Histogram.tsx is unreachable under jsdom.
      thresholds: coverageThresholds,
      // Scopes coverage to the app. Without this, Vitest measures every
      // file it can reach - including e2e/playwright.config.ts and
      // e2e/lib/app.ts, which are the golden-master harness and are never
      // imported by a unit test, dragging the total from 99.7% to 88.31%.
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/index.tsx'
        // src/normality/linear-gauge/index.ts is intentionally NOT excluded:
        // Phase 3b's Gauge.tsx conversion to @testing-library/react
        // constructs a real LinearGauge for the first time in the
        // project's history (see docs/superpowers/specs/
        // 2026-08-30-icl-calc-modernization-design.md, Phase 3b record),
        // so this file now has genuine, earned coverage that the old
        // exclusion would have hidden.
      ]
    }
  }
}));
