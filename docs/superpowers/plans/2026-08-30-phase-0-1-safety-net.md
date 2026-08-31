# ICL Calculator — Phases 0 & 1: the safety net

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the existing test suite green on a modern Node, then capture the deployed December 2021 build's outputs into an immutable golden master that every later migration phase must reproduce exactly.

**Architecture:** The deployed build at `gh-pages@789ac2d` is an oracle produced by a toolchain we are about to replace. Playwright drives that frozen build with a pinned clock and records every rendered number into `src/golden/expected.json`. Those same expectations are then replayed two ways: as a fast unit test over the pure functions, and end-to-end against a real build. Nothing in Phases 0–1 changes application code or application dependencies.

**Tech Stack:** Node (version determined in Task 1) · react-scripts 4.0.2 / Jest 26 (existing, untouched) · Playwright (isolated in `e2e/`, not an app dependency) · TypeScript 4.1

**Spec:** `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`

**Issues:** epic #53 · Phase 0 = #43 (Tasks 1–2) · Phase 1 = #44 (Tasks 3–8)

## Global Constraints

- **No application code changes in Phases 0–1.** The only files added under `src/` are `src/golden/**`, which is test-only and imported by nothing the app ships.
- **No new entries in the app's `package.json` or `package-lock.json`.** Playwright lives in a separate `e2e/` workspace with its own lockfile. If a task appears to require touching the app's dependency tree, stop and escalate.
- **`src/data.csv` is not to be modified, reformatted, regenerated or moved.**
- **`src/golden/expected.json` is generated, never hand-edited.** It is written by Task 5's capture run. Within Phase 1 the harness itself is still being validated, so re-running the *capture* in Tasks 5–7 is legitimate — if `readAll` reads the DOM wrongly, capture and replay must both be corrected and the capture re-run, since the two must read identically. What is forbidden at every point is editing values in the file by hand to make a test pass. The fixture becomes **immutable at Task 8's commit**; from then on any change requires an `oracle/` branch and sign-off per spec §7.3.
- **Clock is pinned to `2026-08-30T12:00:00Z`** in every capture and every replay.
- Branch: `modernize-p0-foundations` for Tasks 1–2, `modernize-p1-golden-master` for Tasks 3–8. Both target `modernize`, never `master`.
- Conventional commits — semantic-release parses them at Phase 5.
- Work in a git worktree created via `superpowers:using-git-worktrees`.

## Already done during design (do not redo)

- Oracle frozen: `../icl-calc-oracle`, detached at `789ac2de9b5886878763a8c06f1a4f71db173270`.
- `modernize` branch cut and pushed; spec committed as `ad1c9ed`.
- 7 local and 4 remote stale branches deleted; PR #22 closed.
- Issues #41 (posterior-K bug) and #42 (Sentry backlog) filed.

---

## File Structure

| File | Responsibility |
|---|---|
| `.nvmrc` | *(modify)* Node version floor established in Task 1 |
| `e2e/package.json` | Isolated Playwright workspace — keeps the app's dependency tree frozen |
| `e2e/playwright.config.ts` | Two projects: `capture` (oracle) and `replay` (build under test) |
| `e2e/lib/app.ts` | The single source of truth for how the form is filled and how outputs are read. Used by **both** capture and replay, so the two can never drift apart |
| `e2e/capture.spec.ts` | Runs once. Oracle → `src/golden/expected.json` |
| `e2e/replay.spec.ts` | L2 gate. Build under test must equal `expected.json` |
| `src/golden/inputs.json` | The 10 hand-authored fixture rows |
| `src/golden/types.ts` | Types for `inputs.json` / `expected.json`, plus `rowToIclInputs()` — the one place the JSON is converted into the app's `ICLInputs` |
| `src/golden/inputs.test.ts` | Proves all 10 rows satisfy the app's own `ICLSchema` — catches authoring typos before capture |
| `src/golden/replay.test.ts` | L1 gate. Pure functions must equal `expected.json` |

`src/golden/` rather than `tests/golden/` (a correction to spec §4.2): `tsconfig.json` has `include: ["src"]` and CRA's Jest only discovers tests under `src/`. Playwright specs stay outside `src/` precisely so Jest does **not** pick them up.

---

## Task 1: Restore the toolchain and establish the Node floor

**Files:**
- Modify: `.nvmrc`
- Modify: `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md` (§10, record the result)

**Interfaces:**
- Consumes: nothing.
- Produces: a working `node_modules` and a known-good Node version, used by every later task.

This task is empirical. CRA 4 uses webpack 4, whose md4 hashing fails on Node 17+ under OpenSSL 3 (`ERR_OSSL_EVP_UNSUPPORTED`). Jest does not use that code path, so `npm test` may pass where `npm run build` does not.

- [ ] **Step 1: Try the newest Node first**

```bash
nvm install 22 && nvm use 22
node --version
npm ci
```

Expected: install completes. `package-lock.json` is `lockfileVersion: 2`, which npm 10 reads natively, and `npm ci` installs the exact 2022 tree — no version drift.

If install fails, step down the ladder — 20, then 18, then 16 — and use the first that installs cleanly. Record which one worked and why the others failed.

- [ ] **Step 2: Confirm `package-lock.json` was not rewritten**

```bash
git diff --stat package-lock.json package.json
```

Expected: **empty output.** `npm ci` must never modify the lockfile. If it did, `git checkout` both files and investigate before continuing — a rewritten lockfile means the tree is no longer the 2022 tree.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: passes. If it fails, record the failures verbatim — do **not** fix application code. Lint failures on untouched code are a finding for the spec, not work for this task.

- [ ] **Step 4: Run the existing test suite**

```bash
npm test -- --watchAll=false
```

Expected: all suites pass, including the snapshot suites. This is the "what the safety net already catches" baseline from the findings doc. Record the suite and assertion counts — Task 6 refers back to them.

- [ ] **Step 5: Verify the build, with the OpenSSL escape hatch if needed**

```bash
npm run build
```

If this fails with `ERR_OSSL_EVP_UNSUPPORTED`:

```bash
NODE_OPTIONS=--openssl-legacy-provider npm run build
```

Expected: `build/` is produced. Task 7 needs a real build to replay against. If the flag was needed, note it — Phase 3a removes it along with webpack 4.

Do **not** add the flag to `package.json`; pass it on the command line. This task changes no app configuration.

- [ ] **Step 6: Pin the version and record the findings**

Write the working major version into `.nvmrc` (e.g. `v22`), and replace the "Node version target" bullet in spec §10 with what actually happened: the version chosen, whether the OpenSSL flag was required, and any lint or test failures observed on untouched code.

- [ ] **Step 7: Commit**

```bash
git add .nvmrc docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md
git commit -m "chore(node): unpin from EOL Node 14 and record the verified floor"
```

---

## Task 2: Retire the Dependabot backlog

**Files:** none — repository state only.

**Interfaces:**
- Consumes: nothing.
- Produces: a clean PR list, so later phase PRs are not lost in noise.

All 16 open Dependabot PRs target a dependency tree that Phase 3 replaces wholesale. They are closed rather than merged: merging them would rewrite `package-lock.json` and break the "the tree is the 2022 tree" property that Task 1 Step 2 protects.

- [ ] **Step 1: List them**

```bash
gh pr list --state open --limit 50 --json number,title,headRefName \
  --jq '.[] | select(.headRefName | startswith("dependabot/")) | "\(.number) \(.headRefName)"'
```

Expected: 16 rows.

- [ ] **Step 2: Close each with a reason**

```bash
for n in $(gh pr list --state open --limit 50 --json number,headRefName \
    --jq '.[] | select(.headRefName | startswith("dependabot/")) | .number'); do
  gh pr close "$n" --delete-branch --comment "Closing as part of the toolchain modernization (see docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md). The Create React App dependency tree this PR patches is being replaced wholesale, so merging it would only churn a lockfile that is about to be deleted. Vulnerability coverage is addressed by that migration, not by this bump."
done
```

- [ ] **Step 3: Verify**

```bash
gh pr list --state open --limit 50
git ls-remote --heads origin 'refs/heads/dependabot/*'
```

Expected: no Dependabot PRs, no Dependabot branches.

This step changes no files, so it produces no commit of its own.

- [ ] **Step 4: Push and open the Phase 0 PR**

```bash
git push -u origin modernize-p0-foundations
gh pr create --base modernize \
  --title "Phase 0: unpin Node and clear the backlog" \
  --body "Closes #43

Unpins Node from EOL v14 and establishes the version floor empirically, with
**no application-code changes**. Also retires the 16 stale Dependabot PRs,
which target a dependency tree Phase 3a replaces wholesale.

## Gate evidence
- Node version selected: <version>, OpenSSL legacy flag required: <yes/no>
- \`npm run lint\`: <summary>
- \`npm test\`: <suite and assertion counts — this is the Phase 1 baseline>
- \`npm run build\`: <summary>

## Constraint check
\`git diff --stat master..HEAD -- src/\` is empty — no application code touched.
\`git diff --stat master..HEAD -- package.json package-lock.json\` is empty."
```

Then run `/code-review` on the branch, address or dismiss each finding, and request manual review.

---

## Task 3: Playwright workspace and the oracle server

**Files:**
- Create: `e2e/package.json`, `e2e/playwright.config.ts`, `e2e/.gitignore`, `e2e/smoke.spec.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm --prefix e2e test` runs Playwright; the oracle is servable at `http://127.0.0.1:4021/icl-calc/`.

The oracle was built with `homepage: http://ruipinge.github.io/icl-calc`, so its asset paths are absolute under `/icl-calc/`. It must be served at that sub-path or nothing loads.

- [ ] **Step 1: Create the isolated workspace**

`e2e/package.json`:

```json
{
  "name": "icl-calc-e2e",
  "private": true,
  "version": "0.0.0",
  "description": "Golden-master capture and replay. Deliberately separate from the app's dependency tree.",
  "scripts": {
    "test": "playwright test",
    "capture": "playwright test --project=capture",
    "replay": "playwright test --project=replay"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.0",
    "http-server": "^14.1.1"
  }
}
```

`e2e/.gitignore`:

```
node_modules/
test-results/
playwright-report/
```

- [ ] **Step 2: Install and fetch browsers**

```bash
npm --prefix e2e install
npx --prefix e2e playwright install chromium
```

- [ ] **Step 3: Confirm the app's tree is still untouched**

```bash
git diff --stat package.json package-lock.json
```

Expected: **empty output.** This is the constraint that makes Phase 1 safe.

- [ ] **Step 4: Write the config**

`e2e/playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

// The frozen December 2021 build. Served under /icl-calc/ because that build
// was produced with homepage=http://ruipinge.github.io/icl-calc and therefore
// references its assets by absolute path.
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
```

- [ ] **Step 5: Create the served sub-path**

The oracle was built with `homepage: http://ruipinge.github.io/icl-calc`, so `index.html` references `/icl-calc/static/...` by absolute path. Serving the oracle directory at `/` would 404 every asset. A symlink gives the server the sub-path it needs without copying:

```bash
mkdir -p e2e/.serve
ln -sfn ../../../icl-calc-oracle e2e/.serve/icl-calc
ls -l e2e/.serve/icl-calc/index.html
```

Expected: the symlink resolves to a real `index.html`.

Add `.serve/` to `e2e/.gitignore`.

- [ ] **Step 6: Write the smoke test**

`e2e/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('the frozen oracle loads and renders the patient form', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('input[name="biometry.ata"]')).toBeVisible();
  await expect(page.locator('input[name="iclSphericalEquivalent"]')).toBeVisible();
  // All four tabs present.
  await expect(page.locator('a.nav-link')).toHaveCount(4);
});
```

- [ ] **Step 7: Run it**

```bash
npm --prefix e2e test -- --project=smoke
```

Expected: PASS. If assets 404, the sub-path serving is wrong — fix before continuing.

- [ ] **Step 8: Cross-check the frozen copy against the live site**

```bash
curl -s -o /tmp/live.html -w '%{http_code}\n' https://ruipinge.github.io/icl-calc/
diff <(sed 's/[[:space:]]*$//' /tmp/live.html) \
     <(sed 's/[[:space:]]*$//' ../icl-calc-oracle/index.html) && echo IDENTICAL
```

Expected: `IDENTICAL`. This is the spec §4.1 requirement that the worktree and the live URL agree. If they differ, **stop** — the oracle's provenance is in doubt and the whole plan rests on it.

- [ ] **Step 9: Commit**

```bash
git add e2e .gitignore
git commit -m "test(golden): isolated playwright workspace and oracle smoke test"
```

---

## Task 4: The fixture inputs

**Files:**
- Create: `src/golden/inputs.json`, `src/golden/types.ts`, `src/golden/inputs.test.ts`

**Interfaces:**
- Produces: `GoldenRow`, `GoldenInputs`, `rowToIclInputs(row: GoldenRow): ICLInputs`, and `PINNED_CLOCK_ISO`. Tasks 5, 6 and 7 all consume these.

- [ ] **Step 1: Write the fixture**

`src/golden/inputs.json` — 10 rows, per spec §5:

```json
{
  "clock": "2026-08-30T12:00:00Z",
  "rows": [
    { "id": "01-baseline", "why": "Typical myope. calcRadiusPosterior fork B (no posterior K, no prior surgery). calcICLAxis >90 path.", "expectAge": 30,
      "patient": { "name": "GM-01", "dateOfBirth": "1996-03-15", "eye": "right" },
      "biometry": { "ata": 11.8, "wtw": 11.9, "clr": 250, "acd": 3.2, "acan": 38, "acat": 39 },
      "corneaProfile": { "kaf": 43, "axisaf": 180, "kas": 44, "axisas": 90, "kpf": 0, "axispf": 0, "kps": 0, "axisps": 0, "cct": 540, "previousSurgery": "None" },
      "spectacleRefraction": { "sphere": -6, "cylindre": -1, "axis": 180, "vertex": 12 } },

    { "id": "02-posterior-k", "why": "Identical to 01 except posterior K supplied -> calcRadiusPosterior fork A. Values describe a steep, ectatic posterior cornea (mean 7.2 D, radius ~5.6 mm), deliberately NOT reproducible by fork B's 0.84 ratio — that is the clinical case where measuring posterior K matters. Differential pair with 01.", "expectAge": 30,
      "patient": { "name": "GM-02", "dateOfBirth": "1996-03-15", "eye": "right" },
      "biometry": { "ata": 11.8, "wtw": 11.9, "clr": 250, "acd": 3.2, "acan": 38, "acat": 39 },
      "corneaProfile": { "kaf": 43, "axisaf": 180, "kas": 44, "axisas": 90, "kpf": 7.0, "axispf": 180, "kps": 7.4, "axisps": 90, "cct": 540, "previousSurgery": "None" },
      "spectacleRefraction": { "sphere": -6, "cylindre": -1, "axis": 180, "vertex": 12 } },

    { "id": "03-prior-myopia-rx", "why": "Prior myopic refractive surgery, no posterior K -> fork C. Thinner cornea.", "expectAge": 45,
      "patient": { "name": "GM-03", "dateOfBirth": "1981-03-15", "eye": "left" },
      "biometry": { "ata": 12.1, "wtw": 12.2, "clr": 180, "acd": 3.35, "acan": 40, "acat": 41 },
      "corneaProfile": { "kaf": 39.5, "axisaf": 175, "kas": 40.5, "axisas": 85, "kpf": 0, "axispf": 0, "kps": 0, "axisps": 0, "cct": 490, "previousSurgery": "Myopia" },
      "spectacleRefraction": { "sphere": -1.5, "cylindre": -0.5, "axis": 175, "vertex": 12 } },

    { "id": "04-prior-hyperopia-rx", "why": "Prior hyperopic refractive surgery -> fork C, steep cornea. calcICLAxis <=90 path.", "expectAge": 45,
      "patient": { "name": "GM-04", "dateOfBirth": "1981-03-15", "eye": "right" },
      "biometry": { "ata": 12.1, "wtw": 12.2, "clr": 180, "acd": 3.35, "acan": 40, "acat": 41 },
      "corneaProfile": { "kaf": 47, "axisaf": 10, "kas": 48, "axisas": 100, "kpf": 0, "axispf": 0, "kps": 0, "axisps": 0, "cct": 520, "previousSurgery": "Hyperopia" },
      "spectacleRefraction": { "sphere": -2, "cylindre": -0.75, "axis": 10, "vertex": 12 } },

    { "id": "05-axis-hinge-at", "why": "Refraction axis exactly 90 - the inclusive side of the calcICLAxis hinge.", "expectAge": 38,
      "patient": { "name": "GM-05", "dateOfBirth": "1988-03-15", "eye": "right" },
      "biometry": { "ata": 11.95, "wtw": 12.05, "clr": 300, "acd": 3.25, "acan": 37, "acat": 38 },
      "corneaProfile": { "kaf": 43.5, "axisaf": 90, "kas": 44.5, "axisas": 180, "kpf": 0, "axispf": 0, "kps": 0, "axisps": 0, "cct": 545, "previousSurgery": "None" },
      "spectacleRefraction": { "sphere": -8, "cylindre": -2, "axis": 90, "vertex": 12 } },

    { "id": "06-axis-hinge-over", "why": "Identical to 05 except axis 91 - the other side of the hinge. Differential pair.", "expectAge": 38,
      "patient": { "name": "GM-06", "dateOfBirth": "1988-03-15", "eye": "right" },
      "biometry": { "ata": 11.95, "wtw": 12.05, "clr": 300, "acd": 3.25, "acan": 37, "acat": 38 },
      "corneaProfile": { "kaf": 43.5, "axisaf": 90, "kas": 44.5, "axisas": 180, "kpf": 0, "axispf": 0, "kps": 0, "axisps": 0, "cct": 545, "previousSurgery": "None" },
      "spectacleRefraction": { "sphere": -8, "cylindre": -2, "axis": 91, "vertex": 12 } },

    { "id": "07-small-lens-bin", "why": "Drives the Matrix into the 12.6 mm lens columns (39 matching eyes; 13.7 mm empty). Centre chosen from the actual density of src/data.csv.", "expectAge": 22,
      "patient": { "name": "GM-07", "dateOfBirth": "2004-03-15", "eye": "left" },
      "biometry": { "ata": 11.9, "wtw": 12, "clr": 100, "acd": 2.85, "acan": 33, "acat": 34 },
      "corneaProfile": { "kaf": 44.5, "axisaf": 170, "kas": 45.75, "axisas": 80, "kpf": 0, "axispf": 0, "kps": 0, "axisps": 0, "cct": 555, "previousSurgery": "None" },
      "spectacleRefraction": { "sphere": -4.5, "cylindre": -0.5, "axis": 170, "vertex": 12 } },

    { "id": "08-large-lens-bin", "why": "Drives the Matrix into the 13.7 mm lens columns (28 matching eyes; 12.6 mm empty). Centre chosen from the actual density of src/data.csv.", "expectAge": 55,
      "patient": { "name": "GM-08", "dateOfBirth": "1971-03-15", "eye": "right" },
      "biometry": { "ata": 12.7, "wtw": 12.8, "clr": 200, "acd": 3.6, "acan": 43, "acat": 44 },
      "corneaProfile": { "kaf": 41.5, "axisaf": 5, "kas": 42.25, "axisas": 95, "kpf": 0, "axispf": 0, "kps": 0, "axisps": 0, "cct": 525, "previousSurgery": "None" },
      "spectacleRefraction": { "sphere": -12, "cylindre": -3, "axis": 5, "vertex": 12 } },

    { "id": "09-schema-floor", "why": "Yup schema minimums. Negative CLR is expected to match zero eyes, locking the Matrix empty-cell path. Not a clinical case.", "expectAge": 22,
      "patient": { "name": "GM-09", "dateOfBirth": "2004-03-15", "eye": "left" },
      "biometry": { "ata": 10.5, "wtw": 10.6, "clr": -100, "acd": 2.7, "acan": 30, "acat": 31 },
      "corneaProfile": { "kaf": 30, "axisaf": 0, "kas": 30, "axisas": 90, "kpf": 0, "axispf": 0, "kps": 0, "axisps": 0, "cct": 300, "previousSurgery": "None" },
      "spectacleRefraction": { "sphere": -25, "cylindre": -8, "axis": 0, "vertex": 8 } },

    { "id": "10-schema-ceiling", "why": "Yup schema maximums, zero refraction. Not a clinical case.", "expectAge": 55,
      "patient": { "name": "GM-10", "dateOfBirth": "1971-03-15", "eye": "right" },
      "biometry": { "ata": 13.5, "wtw": 13.6, "clr": 900, "acd": 6, "acan": 45, "acat": 46 },
      "corneaProfile": { "kaf": 55, "axisaf": 0, "kas": 55, "axisas": 90, "kpf": 0, "axispf": 0, "kps": 0, "axisps": 0, "cct": 700, "previousSurgery": "None" },
      "spectacleRefraction": { "sphere": 0, "cylindre": 0, "axis": 180, "vertex": 15 } }
  ]
}
```

- [ ] **Step 2: Write the types and the converter**

`src/golden/types.ts`:

```ts
import { ICLInputs, PatientInfo, PreviousSurgery } from '../types';

export const PINNED_CLOCK_ISO = '2026-08-30T12:00:00Z';

export interface GoldenRow {
  id: string;
  why: string;
  expectAge: number;
  patient: { name: string; dateOfBirth: string; eye: 'left' | 'right' };
  biometry: {
    ata: number; wtw: number; clr: number;
    acd: number; acan: number; acat: number;
  };
  corneaProfile: {
    kaf: number; axisaf: number; kas: number; axisas: number;
    kpf: number; axispf: number; kps: number; axisps: number;
    cct: number; previousSurgery: 'None' | 'Myopia' | 'Hyperopia';
  };
  spectacleRefraction: {
    sphere: number; cylindre: number; axis: number; vertex: number;
  };
}

export interface GoldenInputs {
  clock: string;
  rows: GoldenRow[];
}

const SURGERY: Record<string, PreviousSurgery> = {
  None: PreviousSurgery.none,
  Myopia: PreviousSurgery.myopia,
  Hyperopia: PreviousSurgery.hyperopia
};

/** The single conversion from fixture JSON into the app's own input type. */
export const rowToIclInputs = (row: GoldenRow): ICLInputs => ({
  patient: new PatientInfo({
    name: row.patient.name,
    dateOfBirth: row.patient.dateOfBirth,
    eye: row.patient.eye
  }),
  biometry: { ...row.biometry },
  corneaProfile: {
    ...row.corneaProfile,
    previousSurgery: SURGERY[row.corneaProfile.previousSurgery]
  },
  spectacleRefraction: { ...row.spectacleRefraction }
});
```

- [ ] **Step 3: Write the failing validation test**

`src/golden/inputs.test.ts`:

```ts
import { GoldenInputs, PINNED_CLOCK_ISO, rowToIclInputs } from './types';

import { ICLSchema } from '../ICLSchema';
import inputsJson from './inputs.json';

const inputs = inputsJson as GoldenInputs;

describe('golden master fixture inputs', () => {
  it('pins the same clock the spec requires', () => {
    expect(inputs.clock).toBe(PINNED_CLOCK_ISO);
  });

  it('has ten rows with unique ids', () => {
    expect(inputs.rows).toHaveLength(10);
    expect(new Set(inputs.rows.map((r) => r.id)).size).toBe(10);
  });

  it.each(inputs.rows.map((r) => [r.id, r] as const))(
    'row %s satisfies the app schema',
    async (_id, row) => {
      await expect(
        ICLSchema.validate(rowToIclInputs(row))
      ).resolves.toBeTruthy();
    }
  );

  it.each(inputs.rows.map((r) => [r.id, r] as const))(
    'row %s resolves to its expected age at the pinned clock',
    (_id, row) => {
      jest.useFakeTimers('modern');
      jest.setSystemTime(new Date(PINNED_CLOCK_ISO));
      try {
        expect(rowToIclInputs(row).patient.age()).toBe(row.expectAge);
      } finally {
        jest.useRealTimers();
      }
    }
  );
});
```

- [ ] **Step 4: Run it**

```bash
npm test -- --watchAll=false --testPathPattern=src/golden
```

Expected: PASS. A failure here means a fixture typo — a value outside the Yup range, or a date of birth that doesn't produce the stated age. Fix the fixture, not the schema.

- [ ] **Step 5: Commit**

```bash
git add src/golden
git commit -m "test(golden): ten branch-driven fixture rows, validated against the app schema"
```

---

## Task 5: Capture the oracle

**Files:**
- Create: `e2e/lib/app.ts`, `e2e/capture.spec.ts`
- Create (generated, once): `src/golden/expected.json`

**Interfaces:**
- Consumes: `src/golden/inputs.json`, `GoldenRow`.
- Produces: `fillRow(page, row)`, `readAll(page)`, `type Capture`; and `expected.json`, consumed by Tasks 6 and 7.

`e2e/lib/app.ts` is deliberately shared between capture and replay. If they read the DOM differently, the gate is meaningless.

Values are captured as **strings exactly as rendered**, never parsed into numbers — parsing would hide formatting changes, which are themselves regressions in a clinical readout.

- [ ] **Step 1: Write the shared driver**

`e2e/lib/app.ts`:

```ts
import { Page, expect } from '@playwright/test';
import inputs from '../../src/golden/inputs.json';

// Single source of truth. Deliberately NOT a local constant: if this drifted
// from inputs.json, capture.spec.ts would still record inputs.clock while
// actually driving the page at a different time, and the drift would be
// invisible in the fixture.
const PINNED_CLOCK_ISO = inputs.clock;

export interface Capture {
  age: string;
  patient: Record<string, string>;
  matrix: { rows: string[][]; footer: string[] };
  regression: { prediction: string[][]; probability: string[][] };
  normality: { pointers: (string | null)[] };
}

const ICL_OUTPUTS = [
  'iclSphere',
  'iclCylindre',
  'iclAxis',
  'iclSphericalEquivalent'
];

/** Pin the clock BEFORE navigation - PatientInfo.age() reads Date.now(). */
export const openApp = async (page: Page) => {
  await page.clock.install({ time: new Date(PINNED_CLOCK_ISO) });
  await page.goto('./');
  await expect(page.locator('input[name="biometry.ata"]')).toBeVisible();
};

const setNumber = async (page: Page, name: string, value: number) => {
  const field = page.locator(`input[name="${name}"]`);
  await field.fill(String(value));
};

export const fillRow = async (page: Page, row: any) => {
  await page.goto('./#');
  await page.locator('input[name="patient.name"]').fill(row.patient.name);
  await page.locator('input[name="patient.dateOfBirth"]').fill(row.patient.dateOfBirth);
  await page.locator('select[name="patient.eye"]').selectOption(row.patient.eye);

  for (const [k, v] of Object.entries(row.biometry)) {
    await setNumber(page, `biometry.${k}`, v as number);
  }
  for (const [k, v] of Object.entries(row.corneaProfile)) {
    if (k === 'previousSurgery') continue;
    await setNumber(page, `corneaProfile.${k}`, v as number);
  }
  await page
    .locator('select[name="corneaProfile.previousSurgery"]')
    .selectOption(row.corneaProfile.previousSurgery);
  for (const [k, v] of Object.entries(row.spectacleRefraction)) {
    await setNumber(page, `spectacleRefraction.${k}`, v as number);
  }
  // Formik recomputes synchronously on change; settle the render before reading.
  await expect(page.locator('input[name="iclSphere"]')).toBeVisible();
};

const tableRows = async (page: Page, index: number): Promise<string[][]> =>
  page.locator('table').nth(index).locator('tr').evaluateAll((trs) =>
    trs.map((tr) =>
      Array.from(tr.querySelectorAll('th,td')).map((c) =>
        (c.textContent ?? '').trim()
      )
    )
  );

export const readAll = async (page: Page): Promise<Capture> => {
  // --- Patient tab
  const patient: Record<string, string> = {};
  for (const name of ICL_OUTPUTS) {
    patient[name] = await page.locator(`input[name="${name}"]`).inputValue();
  }
  const age = await page.locator('input[name="age"]').inputValue();

  // --- Matrix tab
  await page.goto('./#matrix');
  await expect(page.locator('table')).toBeVisible();
  const matrixRows = await tableRows(page, 0);
  const footer = await page
    .locator('ul.list-inline li')
    .evaluateAll((ls) => ls.map((l) => (l.textContent ?? '').trim()));

  // --- Regression tab
  await page.goto('./#regression');
  await expect(page.locator('table').first()).toBeVisible();
  const prediction = await tableRows(page, 0);
  const probability = await tableRows(page, 1);

  // --- Normality tab
  // The gauge pointer is an <svg> with style="left: calc(X% - 2px)". It is NOT
  // rendered when the value falls outside the zone range, so null is a real
  // and meaningful captured value. amCharts also renders SVG, hence the scope
  // to the gauge container's inline margin-left.
  await page.goto('./#normality');
  const gauges = page.locator('div[style*="margin-left: 71px"]');
  await expect(gauges).toHaveCount(6);
  const pointers = await gauges.evaluateAll((els) =>
    els.map((el) => {
      const svg = el.querySelector('svg');
      return svg ? svg.getAttribute('style') : null;
    })
  );

  await page.goto('./#');
  return {
    age,
    patient,
    matrix: { rows: matrixRows, footer },
    regression: { prediction, probability },
    normality: { pointers }
  };
};
```

- [ ] **Step 2: Write the capture spec**

`e2e/capture.spec.ts`:

```ts
import { Capture, fillRow, openApp, readAll } from './lib/app';
import { test } from '@playwright/test';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import inputs from '../src/golden/inputs.json';

const OUT = resolve(__dirname, '../src/golden/expected.json');

test('capture the oracle', async ({ page }) => {
  test.setTimeout(180_000);
  await openApp(page);

  const rows: Record<string, Capture> = {};
  for (const row of inputs.rows) {
    await fillRow(page, row);
    rows[row.id] = await readAll(page);
  }

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        README:
          'CAPTURED FROM THE DEPLOYED ORACLE. DO NOT REGENERATE. ' +
          'If a value here must change, see spec section 7.3 (the stop rule): ' +
          'it requires an oracle/ branch and explicit sign-off.',
        capturedFrom: {
          sha: '789ac2de9b5886878763a8c06f1a4f71db173270',
          url: 'https://ruipinge.github.io/icl-calc/',
          version: '1.7.0'
        },
        clock: inputs.clock,
        rows
      },
      null,
      2
    ) + '\n'
  );
});
```

- [ ] **Step 3: Run the capture**

```bash
npm --prefix e2e run capture
```

Expected: PASS, and `src/golden/expected.json` exists.

- [ ] **Step 4: Inspect it as a human before trusting it**

```bash
node -e "const d=require('./src/golden/expected.json');
for (const [id,r] of Object.entries(d.rows))
  console.log(id, 'age='+r.age, JSON.stringify(r.patient));"
```

Check by eye: every `age` matches the `expectAge` in `inputs.json`; no field is an empty string or `NaN`; rows 01 and 02 differ (posterior K changes the result); rows 05 and 06 differ only in `iclAxis`.

**If every row's age is identical or wrong, the clock pin failed** — fix before continuing. A fixture captured against an unpinned clock is worthless.

- [ ] **Step 5: Manually verify two rows against the live site**

Open <https://ruipinge.github.io/icl-calc/>, enter rows `01-baseline` and `08-large-lens-bin` by hand, and compare the four ICL Power values against `expected.json`. Note that the live site uses today's real date, so **age will differ** unless today is 2026-08-30 — compare the ICL Power values, which do not depend on age, rather than the Regression tab, which does.

This is the spec §6 Phase 1 gate: human confirmation that the capture harness reads what a person reads.

- [ ] **Step 6: Commit**

```bash
git add e2e/lib e2e/capture.spec.ts src/golden/expected.json
git commit -m "test(golden): capture the deployed oracle into an immutable fixture"
```

---

## Task 6: L1 — replay against the pure functions

**Files:**
- Create: `src/golden/replay.test.ts`

**Interfaces:**
- Consumes: `expected.json`, `rowToIclInputs`, `PINNED_CLOCK_ISO`.
- Produces: the fast bisect gate used by every later phase.

L1 asserts the numbers the pure functions produce, formatted the way the components format them. It cannot assert the DOM — that is L2's job.

- [ ] **Step 1: Write the failing test**

`src/golden/replay.test.ts`:

```ts
import {
  calcICLAxis,
  calcICLCylindre,
  calcICLSphere,
  calcICLSphericalEquivalent,
  round
} from '../formulas';
import {
  cornea2endothelium,
  probability,
  vaultPrediction
} from '../regression/formulas';
import { GoldenInputs, PINNED_CLOCK_ISO, rowToIclInputs } from './types';

import { DATA_POINTS, HISTOGRAM_DATA } from '../db';
import { LENS_SIZES } from '../matrix/data';
import expectedJson from './expected.json';
import { getNumEyes } from '../matrix';
import inputsJson from './inputs.json';

const inputs = inputsJson as GoldenInputs;
const expected = expectedJson as any;

beforeEach(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(PINNED_CLOCK_ISO));
});
afterEach(() => jest.useRealTimers());

describe('golden master L1', () => {
  it('reads all 542 rows from data.csv', () => {
    expect(DATA_POINTS).toHaveLength(542);
  });

  it('derives the same histogram bins from the CSV', () => {
    // Locked here because the amCharts histogram is replaced in Phase 4b:
    // the chart may change, the numbers behind it may not.
    expect(HISTOGRAM_DATA).toMatchSnapshot();
  });

  it('was captured against the pinned clock', () => {
    expect(expected.clock).toBe(PINNED_CLOCK_ISO);
  });

  it.each(inputs.rows.map((r) => [r.id, r] as const))(
    'row %s reproduces the oracle ICL Power',
    (id, row) => {
      const v = rowToIclInputs(row);
      expect(String(v.patient.age())).toBe(expected.rows[id].age);
      expect({
        iclSphere: String(calcICLSphere(v)),
        iclCylindre: String(calcICLCylindre(v)),
        iclAxis: String(calcICLAxis(v.spectacleRefraction.axis)),
        iclSphericalEquivalent: String(calcICLSphericalEquivalent(v))
      }).toEqual(expected.rows[id].patient);
    }
  );

  it.each(inputs.rows.map((r) => [r.id, r] as const))(
    'row %s reproduces the oracle regression table',
    (id, row) => {
      const v = rowToIclInputs(row);
      const ri = {
        acd: v.biometry.acd,
        ata: v.biometry.ata,
        clr: v.biometry.clr,
        se: calcICLSphericalEquivalent(v),
        age: v.patient.age()
      };
      // Rendered rows are [label, vault, endothelium]; compare the numbers only.
      const rendered = expected.rows[id].regression.prediction
        .slice(1)
        .map((r: string[]) => r.slice(1));
      const computed = LENS_SIZES.map((size) => [
        String(round(vaultPrediction({ ri, lensSizeId: size.id }))),
        String(round(cornea2endothelium({ ri, lensSizeId: size.id })))
      ]);
      expect(computed).toEqual(rendered);

      const renderedProb = expected.rows[id].regression.probability
        .slice(1)
        .map((r: string[]) => r.slice(1));
      const computedProb = LENS_SIZES.map((size) => [
        String(round(probability({ ri, lensSizeId: size.id }) * 100, 1))
      ]);
      expect(computedProb).toEqual(renderedProb);
    }
  );

  it.each(inputs.rows.map((r) => [r.id, r] as const))(
    'row %s reproduces the oracle matrix eye counts',
    (id, row) => {
      const counts = getNumEyes({
        ata: row.biometry.ata,
        clr: row.biometry.clr
      });
      // "Number of Eyes" is the first body row; cell 0 is the label.
      const rendered = expected.rows[id].matrix.rows
        .find((r: string[]) => r[0] === 'Number of Eyes')!
        .slice(1);
      expect(counts.map(String)).toEqual(rendered);
    }
  );
});
```

- [ ] **Step 2: Run it and watch it fail first**

Temporarily change `toHaveLength(542)` to `toHaveLength(541)` and run:

```bash
npm test -- --watchAll=false --testPathPattern=src/golden/replay
```

Expected: FAIL. This confirms the test actually executes rather than silently skipping — `it.each` over an empty array passes vacuously, which is the failure mode to rule out. Restore `542`.

- [ ] **Step 3: Run it for real**

```bash
npm test -- --watchAll=false --testPathPattern=src/golden/replay
```

Expected: PASS, with a new snapshot written for `HISTOGRAM_DATA`.

**If any row fails, do not adjust `expected.json`.** A mismatch here at unmodified HEAD means either the capture is wrong or L1 formats differently from the components. Both are harness bugs — fix the harness.

- [ ] **Step 4: Commit**

```bash
git add src/golden
git commit -m "test(golden): L1 replay - pure functions reproduce the oracle"
```

---

## Task 7: L2 — replay against a real build

**Files:**
- Create: `e2e/replay.spec.ts`
- Modify: `e2e/playwright.config.ts` (subject web server)

**Interfaces:**
- Consumes: `readAll`, `fillRow`, `expected.json`.
- Produces: the build-level gate used by every later phase.

This is the check that L1 structurally cannot make: it proves that today's source, built today, still produces the 2022 numbers through a real browser.

- [ ] **Step 1: Build the current source**

```bash
npm run build
mkdir -p e2e/.serve && ln -sfn ../../build e2e/.serve/icl-calc-subject
```

Add the `--openssl-legacy-provider` prefix if Task 1 Step 5 established it is needed.

- [ ] **Step 2: Add the subject server to the config**

In `e2e/playwright.config.ts`, add a second entry to `webServer`:

```ts
    {
      command: `npx http-server .serve -p ${SUBJECT_PORT} --silent`,
      url: `http://127.0.0.1:${SUBJECT_PORT}/icl-calc-subject/index.html`,
      reuseExistingServer: true
    }
```

and change the `replay` project's `baseURL` to
`http://127.0.0.1:${SUBJECT_PORT}/icl-calc-subject/`.

- [ ] **Step 3: Write the replay spec**

`e2e/replay.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { fillRow, openApp, readAll } from './lib/app';
import expected from '../src/golden/expected.json';
import inputs from '../src/golden/inputs.json';

test('the build under test reproduces the oracle exactly', async ({ page }) => {
  test.setTimeout(180_000);
  await openApp(page);

  for (const row of inputs.rows) {
    await fillRow(page, row);
    const actual = await readAll(page);
    expect(actual, `golden master row ${row.id}`).toEqual(
      (expected as any).rows[row.id]
    );
  }
});
```

- [ ] **Step 4: Run it**

```bash
npm --prefix e2e run replay
```

Expected: PASS. This is the Phase 1 gate from spec §6 — L1 **and** L2 both green against unmodified HEAD.

If it fails, the diff tells you whether the mismatch is cosmetic (whitespace, a `<th>` counted as a cell) or numerical. Cosmetic mismatches are harness bugs in `readAll` — fix them and **re-run the capture**, since capture and replay must read identically. Numerical mismatches at unmodified HEAD mean today's build genuinely differs from the 2022 build: **stop and escalate**, that is the migration's central risk showing up early.

- [ ] **Step 5: Commit**

```bash
git add e2e
git commit -m "test(golden): L2 replay - a real build reproduces the oracle"
```

---

## Task 8: Reconcile the spec and open the PR

**Files:**
- Modify: `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`

- [ ] **Step 1: Correct the spec against what was built**

Three known corrections:

1. §4.2 — file paths are `src/golden/` for fixtures and the L1 test, `e2e/` for the Playwright specs. Explain why: `tsconfig.json` has `include: ["src"]` and CRA's Jest only discovers tests under `src/`.
2. §4.4 — amCharts 4 renders **SVG**, not `<canvas>`. The exclusion still stands for the same reasons; the note about scoping gauge selectors so they don't collide with the histogram's SVG belongs here.
3. §4.4 — add that a gauge pointer is absent entirely when the value falls outside the zone range, so `null` is a valid captured value.

- [ ] **Step 2: Record the Phase 1 result in §10**

Note the captured row count, whether the oracle and live URL were byte-identical, and which two rows were manually verified.

- [ ] **Step 3: Commit and push**

```bash
git add docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md
git commit -m "docs(spec): reconcile with the implemented golden master"
git push -u origin modernize-p1-golden-master
```

- [ ] **Step 4: Open the PR**

```bash
gh pr create --base modernize \
  --title "Phase 1: golden master captured from the deployed oracle" \
  --body "Closes #44

Captures the December 2021 deployed build's outputs for 10 branch-driven input
rows and locks them as an immutable fixture.

## Gate evidence
- L1: <paste \`npm test -- --testPathPattern=src/golden\` summary>
- L2: <paste \`npm --prefix e2e run replay\` summary>
- Oracle vs live URL: identical
- Manually verified by hand against the live site: rows 01-baseline, 08-large-lens-bin

## Constraint check
\`git diff --stat master..HEAD -- package.json package-lock.json\` is empty —
no application dependency was added or changed."
```

- [ ] **Step 5: Run the automated review**

Run `/code-review` on the branch and address or explicitly dismiss each finding before requesting manual review.

---

## Notes for later phases (not tasks)

- `VAULT_SIZE_RANGES` in `VaultDistributionRows.tsx` is **not exported**, so L1 cannot assert the vault distribution rows without duplicating the ranges — which would drift. L2 covers them through the DOM instead. If Phase 3 or 4 changes that file, L2 is the gate that catches it.
- `buildZones` embeds colours read from Bootstrap CSS custom properties via `getComputedStyle`, which return empty strings under jsdom. L1 must never assert zone colours; the gauge pointer position captured by L2 is the meaningful signal.
- The `HISTOGRAM_DATA` snapshot written in Task 6 is the artifact that makes Phase 4b safe. It must survive the amCharts removal unchanged.
