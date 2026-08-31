import { defineConfig } from '@playwright/test';

// The frozen December 2021 build: app commit 2436da4, authored 2021-12-02
// 00:33 UTC, deployed by gh-pages commit dc98e3a at 00:45 UTC. Served under
// /icl-calc/ because that build was produced with
// homepage=http://ruipinge.github.io/icl-calc and therefore references its
// assets by absolute path.
const ORACLE_PORT = 4021;
// A fresh build of the branch under test, produced by `npm run build`.
const SUBJECT_PORT = 4022;

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { headless: true },
  projects: [
    {
      name: 'capture',
      testMatch: /capture\.spec\.ts/,
      use: { baseURL: `http://127.0.0.1:${ORACLE_PORT}/icl-calc/` }
    },
    {
      name: 'replay',
      testMatch: /replay\.spec\.ts/,
      use: { baseURL: `http://127.0.0.1:${SUBJECT_PORT}/icl-calc/` }
    },
    {
      name: 'smoke',
      testMatch: /smoke\.spec\.ts/,
      use: { baseURL: `http://127.0.0.1:${ORACLE_PORT}/icl-calc/` }
    }
  ],
  webServer: [
    {
      // Serves e2e/.serve, which contains an `icl-calc` symlink to the frozen
      // oracle. http-server maps a directory to /, so the sub-path the oracle's
      // absolute asset URLs require has to exist as a real directory entry.
      command: `npx http-server .serve -p ${ORACLE_PORT} --silent`,
      url: `http://127.0.0.1:${ORACLE_PORT}/icl-calc/index.html`,
      reuseExistingServer: true
    }
  ]
});
