# Phase 3a — Create React App to Vite: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `react-scripts` with Vite and Jest with Vitest, without moving a single number the calculator produces.

**Architecture:** React 17 and `react-router-dom` 5 are **deliberately held constant** — this phase changes the build tool and nothing else, so that if a value moves the cause is unambiguous. The golden master captured in Phase 1 is the gate: a build-tool swap that changes a rendered number is a failure, not a surprise.

**Tech Stack:** Vite 5+ · Vitest · TypeScript 5 · React 17 (unchanged) · react-router-dom 5 (unchanged)

**Spec:** `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`

**Issue:** #47 · epic #53

## Global Constraints

- **`src/data.csv` is not to be modified, reformatted, regenerated or moved.** It is 542 rows of real per-eye clinical biometry and the reference dataset the whole tool is built on.
- **`src/golden/expected.json` must not change.** CI enforces this: any PR touching it outside an `oracle/*` branch fails the `golden-master-guard` job. If a value moves, that is a regression to investigate, never a fixture to update.
- **All computation stays client-side.** No new runtime dependency that phones home.
- **React stays on 17 and `react-router-dom` on 5.** Upgrading either is #48 / #49. If something appears to require it, stop and escalate rather than widening this phase.
- **Build output stays in `build/`.** Vite defaults to `dist/`; override it. The deploy job publishes `./build` and `e2e/setup.sh` symlinks `../../build`, and changing the directory name would ripple into both for no benefit.
- **The app is served from `/icl-calc/`.** `package.json`'s `homepage` encodes this today; Vite's `base` must match, or every asset 404s in production.
- Conventional commits. Work in a git worktree. Do not merge; the human merges.

## Two things that will bite, both already diagnosed

**The Footer version must stay pinned in tests.** `src/misc/__snapshots__/Footer.test.tsx.snap` records `v0.0.t`, because the current `test` script sets `REACT_APP_VERSION=0.0.t`. Sourcing the version from `package.json` unconditionally makes that snapshot read `v1.7.0` and then churn on every release. Pin it to `0.0.t` in test mode.

**The NavBar snapshot will legitimately change.** `src/misc/NavBar.tsx` renders `href={process.env.PUBLIC_URL || '/'}`, and the snapshot records `href="/"` because CRA leaves `PUBLIC_URL` empty under test. Vite's `import.meta.env.BASE_URL` is `/icl-calc/`, so the snapshot becomes `href="/icl-calc/"`. Production behaviour is equivalent (CRA built it as `/icl-calc`). **This is expected — but the golden master does not capture the navbar, so this snapshot is the only guard on that link.** Change it deliberately and say so in the report; do not let it pass unremarked among other churn.

---

## Task 1: Harden the safety net before leaning on it

Two residuals were parked at the end of Phase 1. This phase is the one that leans hardest on the net, so close them first.

**Files:**
- Create: `src/golden/types.test.ts`
- Modify: `src/golden/inputs.json` (one `why` string only)
- Modify: `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`

- [ ] **Step 1: Write a test proving the digest is sensitive in the right way**

`capturedFrom.rowsSha256` is what stops fixture drift being misdiagnosed as an application regression under the stop rule. It was verified correct twice out-of-band, but nothing in the suite asserts it — so a future change to `rowDigestPayload` that dropped a field would silently weaken the guard.

`src/golden/types.test.ts` must assert, using the real `rowsSha256` exported from `./types` (note `rowDigestPayload` is module-private — do not export it just to test it; drive everything through `rowsSha256`, which is what the production assertions actually call):

- the digest of the real `inputs.json` rows equals `expected.json`'s recorded `capturedFrom.rowsSha256`
- mutating **each** of `id`, `expectAge`, a `biometry` value, a `corneaProfile` value, a `spectacleRefraction` value and `previousSurgery` changes the digest — assert them individually, not as one lump, so a partial regression is identifiable
- mutating a `why` string does **not** change the digest

Deep-clone the fixture before mutating; never write to it.

- [ ] **Step 2: Run it and watch it fail first**

Temporarily delete one field from `rowDigestPayload`, confirm the corresponding assertion fails, restore, confirm green. Paste both outputs in your report. A test that has never failed proves nothing.

- [ ] **Step 3: Correct row 09's `why`**

`09-schema-floor` claims "schema minimums", but six of its fields are not at floor: `ata` (10.5 vs min 0), `wtw` (10.6 vs 0), `clr` (−100 vs −1000), `acan`/`acat` (30/31 vs 0) and `axisas`. Reword it the way row 10's was: name which fields are genuinely at the bound and say the others are deliberately clinically plausible rather than extreme.

This is now free — the narrowed digest excludes `why`. **Confirm that:** after the edit, L1 and L2 must still pass with **no re-capture**. That is the practical proof the Phase 1 digest narrowing achieved what it was for.

- [ ] **Step 4: Record the `CC_TEST_REPORTER_ID` decision**

The credential cannot be rotated — the owner no longer has CodeClimate access. Record in the spec that this is **accepted risk, deliberately**, with the reasoning: the token's only capability is posting coverage for this repo to a service no longer in use; it grants no source access, no repository write and no other secret; the integration is deleted; and the only way to purge it is rewriting history on a public repo, which would invalidate every commit SHA — including `2436da4` and `789ac2d`, on which the oracle's entire provenance chain depends. Note it as closed, not outstanding.

- [ ] **Step 5: Commit**

```bash
git add src/golden/types.test.ts src/golden/inputs.json docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md
git commit -m "test(golden): assert the fixture digest is sensitive to inputs and blind to prose"
```

---

## Task 2: Make Vite build the app

**The highest-risk task in the phase.** It replaces the mechanism by which `data.csv` reaches the calculator.

**Files:**
- Create: `vite.config.ts`, `index.html` (repo root)
- Modify: `src/db.ts`, `src/misc/Footer.tsx`, `src/misc/NavBar.tsx`, `src/index.tsx`, `src/misc/GoogleAnalytics.ts`, `src/react-app-env.d.ts`, `package.json`
- Delete: `public/index.html`

- [ ] **Step 1: Install Vite**

```bash
npm i -D vite @vitejs/plugin-react
```

`react-scripts` stays installed for now — this task changes the build, not the tests.

- [ ] **Step 2: Write `vite.config.ts`**

```ts
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
```

- [ ] **Step 3: Move `index.html` to the repo root**

Vite treats the root `index.html` as the entry point. Copy `public/index.html` to the repo root, then:

- replace every `%PUBLIC_URL%/` with `/` — Vite rewrites root-absolute URLs in `index.html` against `base` at build time
- add `<script type="module" src="/src/index.tsx"></script>` before `</body>`
- delete `public/index.html`; everything else in `public/` is copied as-is and stays

- [ ] **Step 4: Replace `raw.macro` — the one change on the data path**

`src/db.ts:1-3`:

```ts
import raw from 'raw.macro';
const CSV = raw('./data.csv');
```

becomes:

```ts
import CSV from './data.csv?raw';
```

`src/react-app-env.d.ts` becomes a single line, which also supplies the `*?raw` module declaration:

```ts
/// <reference types="vite/client" />
```

⚠️ `src/data.csv` begins with a **UTF-8 BOM**. `mapCsvToRows` filters the header via `isNaN`, so the BOM is benign either way — but verify rather than assume. Task 3's L1 asserts 542 rows; until then, check by hand.

- [ ] **Step 5: Translate the remaining CRA-isms**

| File | From | To |
|---|---|---|
| `src/misc/Footer.tsx` (×2) | `process.env.REACT_APP_VERSION` | `import.meta.env.VITE_APP_VERSION` |
| `src/misc/NavBar.tsx` | `process.env.PUBLIC_URL \|\| '/'` | `import.meta.env.BASE_URL` |
| `src/index.tsx` | `process.env.NODE_ENV === 'production'` | `import.meta.env.PROD` |
| `src/misc/GoogleAnalytics.ts` | `process.env.NODE_ENV === 'production'` | `import.meta.env.PROD` |

`BASE_URL` is always set, so the `|| '/'` fallback goes.

- [ ] **Step 6: Point the build script at Vite**

In `package.json`, `"build": "vite build"` and add `"dev": "vite"`. Leave `test` on `react-scripts` for now.

- [ ] **Step 7: Build, and check the CSV survived**

```bash
npm run build
```

Expected: `build/` produced. Then confirm the data path:

```bash
node -e "const s=require('fs').readFileSync('build/assets/'+require('fs').readdirSync('build/assets').find(f=>f.startsWith('index')&&f.endsWith('.js')),'utf8'); console.log('rows marker present:', s.includes('47.1'));"
```

Adjust to the actual asset layout — the point is to confirm the CSV content is genuinely inlined, not silently empty.

- [ ] **Step 8: THE GATE — replay the golden master against the Vite build**

```bash
npm --prefix e2e run setup -- --subject-only
npm --prefix e2e run replay
```

Expected: **2 passed**, `the build under test reproduces the oracle exactly`.

**This is the moment the entire safety net exists for.** A Vite build of unchanged source must render exactly what the December 2021 Create React App build rendered.

If a value moves: **STOP. Report BLOCKED.** Do not adjust the fixture, do not add tolerance, do not round. Report which rows and fields moved and by how much. The most likely culprits are the CSV import and the `base`/`BASE_URL` change.

- [ ] **Step 9: Check the blind spot by hand**

Both gates are blind to `VITE_APP_VERSION` and `BASE_URL` — `readAll` captures neither the footer nor the navbar. So verify manually: serve `build/` and confirm the footer reads a real version (not `vundefined`) and the brand link points at `/icl-calc/`. Paste what you saw.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "build(vite): replace Create React App's build with Vite"
```

---

## Task 3: Vitest replaces Jest

**Files:**
- Modify: `vite.config.ts`, `package.json`, `src/setupTests.js` → `src/setupTests.ts`, `tsconfig.json`
- Modify: `src/types.test.ts`, `src/patient/Info.test.tsx`, `src/golden/inputs.test.ts`, `src/golden/replay.test.ts`

- [ ] **Step 1: Install**

```bash
npm i -D vitest @vitest/coverage-v8 jsdom
```

- [ ] **Step 2: Add the `test` block to `vite.config.ts`**

```ts
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
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
```

The `exclude` list mirrors the existing `coveragePathIgnorePatterns` in `package.json` — keep it identical so the coverage number stays comparable to Phase 0's recorded baseline.

- [ ] **Step 3: Rename the setup file and update tsconfig**

`src/setupTests.js` → `src/setupTests.ts`. In `tsconfig.json`'s `compilerOptions`, add `"types": ["vitest/globals", "vite/client"]`.

- [ ] **Step 4: Translate the `jest` API — only four files use it**

```
src/types.test.ts:5              jest.spyOn      -> vi.spyOn
src/patient/Info.test.tsx:9      jest.spyOn      -> vi.spyOn
src/golden/inputs.test.ts:30,31,35   jest.useFakeTimers('modern') -> vi.useFakeTimers()
                                     jest.setSystemTime  -> vi.setSystemTime
                                     jest.useRealTimers  -> vi.useRealTimers
src/golden/replay.test.ts:37,38,40   same
```

Vitest's `useFakeTimers()` takes no mode argument — `'modern'` is a Jest 26 concept and must be dropped.

⚠️ **The two golden files are the safety net itself.** Their clock pin is what makes `PatientInfo.age()` deterministic. After translating, verify the ages assert correctly rather than silently passing against a real clock.

- [ ] **Step 5: Point the test script at Vitest**

`"test": "vitest run --coverage"`. Remove the `REACT_APP_VERSION=0.0.t` prefix — `vite.config.ts` now pins it via `define`.

- [ ] **Step 6: Run the suite**

```bash
npm test
```

Phase 0's baseline was 22 suites / 152 tests / 22 snapshots after Phase 2a, at 99.39% statements.

**Expect exactly one snapshot to change: `NavBar`**, from `href="/"` to `href="/icl-calc/"`, for the reason given at the top of this plan. **Any other snapshot change must be explained before you proceed** — report it rather than accepting it.

- [ ] **Step 7: Remove the Jest config**

Delete the `jest` block from `package.json` (including the amCharts `transformIgnorePatterns`, which Vitest does not need).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test(vitest): replace Jest with Vitest"
```

---

## Task 4: Cut over and clean up

**Files:** `package.json`, `package-lock.json`, delete `scripts/link-bins.js`, `.github/workflows/main.yml`

- [ ] **Step 1: Remove what CRA leaves behind**

```bash
npm uninstall react-scripts raw.macro @types/jest
```

- [ ] **Step 2: TypeScript 4.1 → 5**

```bash
npm i -D typescript@5
npx tsc --noEmit
```

Fix any new errors **in this repo's own code**. If an error comes from a dependency's types, report it rather than suppressing it repo-wide.

- [ ] **Step 3: Regenerate the lockfile, and confirm the workaround dies**

This is the step that retires `scripts/link-bins.js` (see #47's checklist).

```bash
rm -rf node_modules package-lock.json
npm install
ls node_modules/.bin | wc -l
```

Expected: a populated `.bin` **without** running the repair script. Confirm `package-lock.json` now has a top-level `packages` object — its absence was the whole defect.

```bash
node -e "console.log('has packages:', !!require('./package-lock.json').packages)"
```

- [ ] **Step 4: Delete the workaround**

```bash
git rm scripts/link-bins.js
```

Remove **both** "Repair node_modules/.bin symlinks" steps from `.github/workflows/main.yml` — they exist in the `test` and `deploy` jobs.

- [ ] **Step 5: Re-run both gates**

```bash
npm test
npm run build
npm --prefix e2e run setup -- --subject-only && npm --prefix e2e run replay
```

Both must be green, with `expected.json` untouched.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(deps): drop react-scripts, regenerate the lockfile, retire link-bins"
```

---

## Task 5: Update CI

**Files:** `.github/workflows/main.yml`, `.nvmrc`

- [ ] **Step 1: Unpin Node**

The Node 16 pin existed because CRA's webpack 4 chain failed on 18+ with `ERR_PACKAGE_PATH_NOT_EXPORTED`. Vite removes that constraint. Walk the ladder — try 22, fall back if anything fails — and set `.nvmrc` and both CI jobs to one modern version. Record which you chose and why.

The `test` job and the `e2e-replay` job's build step no longer need different versions; simplify if they now agree.

- [ ] **Step 2: Keep the gates intact**

`golden-master-guard` and the `deploy` gating condition must survive unchanged. In particular `deploy`'s `if:` uses `!cancelled()` deliberately — **do not** revert it to `always()`; see the comment above it.

- [ ] **Step 3: Push and iterate until CI is green**

```bash
gh run list --branch <branch> --limit 3
gh run view <id> --log-failed
```

Do not stop at "it should work now". Stop when a run is green and you have pasted the summary.

- [ ] **Step 4: Commit**

---

## Task 6: Reconcile the documents and open the PR

- [ ] **Step 1: Update the spec**

Record what Phase 3a actually did: the Node version now in use, that `link-bins.js` is gone and why it is no longer needed, that `raw.macro` is replaced and the CSV verified, and — importantly — **whether the `REACT_APP_VERSION`/`PUBLIC_URL` blind spot bit**, since the spec records it as a known gap and this was its first live test.

- [ ] **Step 2: Update `docs/modernization-findings.md`**

Findings 2 (`raw.macro`), 3 (CRA-isms) and 4 (Node 14) are now actioned. Mark them, keeping the rest as the historical survey.

- [ ] **Step 3: Open the PR**

Base `modernize`. `Closes #47`. The body must lead with the golden-master result — a Vite build of unchanged application source reproducing the December 2021 numbers exactly — and state the NavBar snapshot change explicitly, with its reason.

---

## Notes for later phases, not tasks

- React 17 → 19 is **#48**, router 5 → 7 is **#49**. Both were deliberately excluded here so that a moved number in this phase has exactly one plausible cause.
- `normality/index.test.tsx` is `xit`-skipped and its component takes untyped `{...args}`, so a stale prop name there would not be caught by `tsc`. Whoever revives it should type the props first (#48).
- The `dependencies` / `devDependencies` split in `package.json` is wrong throughout — `semantic-release`, `prettier`, `typescript` and the testing libraries are all runtime dependencies today. That cleanup belongs to **#50**, not here.
