import { defineConfig } from '@playwright/test';

// The frozen December 2021 build: app commit 2436da4, authored 2021-12-02
// 00:33 UTC, deployed by gh-pages commit dc98e3a at 00:45 UTC. Served under
// /icl-calc/ because that build was produced with
// homepage=http://ruipinge.github.io/icl-calc and therefore references its
// assets by absolute path.
const ORACLE_PORT = 4021;
// A fresh build of the branch under test, produced by `npm run build`.
const SUBJECT_PORT = 4022;

// Mirrors setup.sh's SUBJECT_ONLY: when set, only the subject build is
// served. Required for the L2 replay in CI, which has no oracle worktree to
// serve (see setup.sh's comment on --subject-only) - without this, the
// oracle webServer entry below would still start unconditionally, request
// its readiness URL against an empty .serve/ with no icl-calc symlink, get
// a 404 forever, and time out the whole run even though 'replay' never
// navigates to it.
const SUBJECT_ONLY = !!process.env.SUBJECT_ONLY;

const ORACLE_WEB_SERVER = {
  // Serves e2e/.serve, which contains an `icl-calc` symlink to the frozen
  // oracle. http-server maps a directory to /, so the sub-path the oracle's
  // absolute asset URLs require has to exist as a real directory entry.
  command: `npx http-server .serve -p ${ORACLE_PORT} --silent`,
  url: `http://127.0.0.1:${ORACLE_PORT}/icl-calc/index.html`,
  reuseExistingServer: true
};

const SUBJECT_WEB_SERVER = {
  // Serves e2e/.serve-subject, a *separate* root from .serve above. The
  // subject build (build/, produced by `npm run build` under Node 16
  // from this worktree's unmodified source) was emitted with the same
  // homepage=http://ruipinge.github.io/icl-calc as the oracle, so its
  // index.html also references assets by the absolute path /icl-calc/...
  // Reusing .serve's own `icl-calc` symlink for this build would make
  // every asset request on this port resolve to the oracle's files
  // instead of the subject's - a same-path collision, not a fresh
  // sub-path the brief's icl-calc-subject naming assumed away. A
  // dedicated root with its own /icl-calc symlink keeps the two ports
  // isolated while satisfying the build's baked-in absolute paths.
  command: `npx http-server .serve-subject -p ${SUBJECT_PORT} --silent`,
  url: `http://127.0.0.1:${SUBJECT_PORT}/icl-calc/index.html`,
  reuseExistingServer: true
};

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
  webServer: SUBJECT_ONLY
    ? [SUBJECT_WEB_SERVER]
    : [ORACLE_WEB_SERVER, SUBJECT_WEB_SERVER]
});
