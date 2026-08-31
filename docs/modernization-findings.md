# ICL Calculator — modernization findings

Survey of the repo as it stands, written 29 August 2026 before any code was
touched. Nothing here has been actioned. It exists so the migration session
doesn't have to rediscover it.

Companion document, covering the move onto treeye.science and the decisions
around it: `treeye/docs/icl-calc-migration.md` in the Treeye repo.

> **This is a clinical tool used for surgical planning.** A silently changed
> numerical result is the worst outcome of this work — worse than the migration
> failing loudly. Everything below is ordered around that.

---

## Where it stands

| | |
|---|---|
| Live | <https://ruipinge.github.io/icl-calc/> — returns 200, still works in current browsers |
| Published as | <https://treeye.science/tools/icl-calc> — 302 to the above, already live |
| Repo | `ruipinge/icl-calc`, public, MIT, default branch `master` |
| Version | 1.7.0; last real feature work **February 2022** |
| Build | `react-scripts` 4.0.2 (Create React App) |
| Runtime | React 17 · TypeScript 4.1 · `react-router-dom` 5 |
| UI | Bootstrap 4.6 · Formik 2 · Yup · Sass |
| Charts | amCharts 4 |
| Services | Sentry 6 · `react-ga` 3 |
| Node | pinned to **v14** in `.nvmrc` and both CI jobs |
| Release | `semantic-release` on `master`, then `peaceiris/actions-gh-pages` publishing `./build` to the `gh-pages` branch |

**Computation is entirely client-side**, against `src/data.csv` inlined at build
time. No patient measurement leaves the browser. This is the most valuable
property of the current architecture and the easiest to lose by accident.

---

## Findings

### 1. Create React App is retired

The React team retired CRA in February 2025 and now points at Vite or a
framework. `react-scripts` 4.0.2 is four years old. **This is a build-tool
migration, not a version bump**, and it is the bulk of the work.

### 2. `raw.macro` will not survive the move — and it sits on the data path

`src/db.ts:1-3`:

```ts
import raw from 'raw.macro';
const CSV = raw('./data.csv');
```

`raw.macro` is a `babel-plugin-macros` macro. **Vite has no babel-macros
support.** The replacement is Vite's `?raw` import:

```ts
import CSV from './data.csv?raw';
```

Flagging this separately from the general migration because it is the one CRA
feature that sits directly on the path the numbers travel. If the CSV loads
differently — encoding, trailing newline, BOM — the calculator's reference data
changes silently. `src/data.csv` begins with a UTF-8 BOM; check it survives.

### 3. Other CRA-isms that need translating

| Where | What | Vite equivalent |
|---|---|---|
| `src/misc/Footer.tsx:10,12` | `process.env.REACT_APP_VERSION` | `import.meta.env.VITE_*`; rename in `.env` and in the `test` script |
| `src/misc/NavBar.tsx:4` | `process.env.PUBLIC_URL` | `import.meta.env.BASE_URL` |
| `src/index.tsx:10`, `src/misc/GoogleAnalytics.ts:5` | `process.env.NODE_ENV` | `import.meta.env.PROD` |
| `public/index.html:5-7` | `%PUBLIC_URL%` | move `index.html` to the project root; use `/` or `%BASE_URL%` |
| `package.json` `test` script | `REACT_APP_VERSION=0.0.t react-scripts test` | Vitest, with the renamed variable |

`.env` is committed and holds only `REACT_APP_VERSION` and `REACT_APP_NAME` —
no secrets, safe to keep and rename.

### 4. Node 14 is three years past end of life

EOL April 2023, pinned in `.nvmrc` and in both CI jobs. Nothing builds on a
current toolchain until this moves.

### 5. CI will need rewriting, not patching

`.github/workflows/main.yml` uses `actions/checkout@v2`, `actions/setup-node@v2`
and `actions/cache@v2` — all long deprecated, on runtimes GitHub has since
removed — plus `codecov/codecov-action@v1` with `fail_ci_if_error: true` and
`paambaati/codeclimate-action@v2.7.5`. **Assume the workflow does not run green
today**; check before assuming a failure is yours.

Also: `CC_TEST_REPORTER_ID` is committed in plaintext in the workflow, in a
public repo. CodeClimate treats it as a secret — it permits posting coverage for
this repo. Low severity, but it belongs in a GitHub secret, and rotating it is
cheap.

### 6. The analytics have recorded nothing since July 2023

`src/misc/GoogleAnalytics.ts:8` initialises `UA-212134595-1`, a **Universal
Analytics** property. UA stopped processing data on 1 July 2023. Don't port it —
delete it. Sentry (`src/index.tsx:11`) goes with it: both would have to be
declared in a CSP that currently permits no third-party requests at all.

### 7. amCharts 4 is end-of-life and licence-sensitive

Used for exactly one histogram, `src/normality/Histogram.tsx` (plus two test
files). amCharts is not unconditionally free for commercial or closed-source
use; the free tier carries an attribution requirement. Replacing it is cheaper
than upgrading to v5: one fewer dependency, no licence question, much smaller
bundle. Note `package.json` carries a `transformIgnorePatterns` entry specifically
for `@amcharts/amcharts4` — that goes too.

### 8. Bootstrap 4 will fight the Treeye design system

Not this session's problem. Treeye's site is hand-rolled CSS on custom
properties (Poppins + Newsreader, leaf-spectrum accents); overriding Bootstrap
to match costs more than removing it. Leave it until the toolchain is stable and
verified — one concern at a time.

---

## The safety net

**Better than expected.** The suite covers the numerical core, not just
rendering:

- `src/formulas.test.ts`, `src/regression/formulas.test.ts` — the formulas
- `src/db.test.ts`, `src/matrix/data.test.ts` — data loading and derivation
- `src/util.test.ts`, `src/types.test.ts`
- Snapshot tests across `matrix/`, `normality/`, `patient/`, `misc/`

Coverage config in `package.json` excludes `src/index.tsx`,
`src/normality/Histogram.tsx`, `src/normality/index.tsx` and
`src/normality/linear-gauge/index.ts` — worth knowing which parts are unguarded,
and note the histogram is both uncovered *and* the thing amCharts is being
removed from.

### The deployed app is an oracle — use it before it's gone

The December 2021 build still works correctly in 2026 browsers. That means the
risk in this migration is the toolchain, not the app's logic, and it means the
live deployment is an **independent reference** the migrated version can be
diffed against.

1. Get the existing suite green on current Node first, changing nothing else.
   That establishes what the safety net already catches.
2. Build a **golden-master table** — representative inputs and the exact outputs
   the *deployed* app produces, captured from the running app rather than read
   off the code. Cover the real clinical range including the extremes of each
   input, not just happy-path values.
3. Check every subsequent step against it. If a number moves, stop and find out
   why before continuing.

**Do not decommission or overwrite the GitHub Pages deployment during the
migration.** It is the reference. It retires last, once the replacement is
verified — and the `treeye.science/tools/icl-calc` redirect means nothing
printed depends on which of the two is serving.

---

## Suggested order

1. Unpin Node; get the existing tests running and CI green. Nothing else.
2. Golden-master table, captured from the live app.
3. CRA → Vite. React 17→19, `react-router-dom` 5→7 (a breaking API rewrite —
   budget for it), TypeScript 4.1→5. Handle `raw.macro` and the CRA-isms above.
   Diff against the golden master.
4. Remove amCharts (replace the histogram), Sentry and `react-ga`. Diff again.
5. Stop. Design system and the move onto treeye.science are separate work.

Commit at each step so a regression can be bisected.

---

## Hard constraints

- **All computation stays client-side.** No server round-trip for anything,
  telemetry included. Today no patient measurement leaves the browser; that is a
  deliberate property to preserve, not an accident of the old architecture.
- **No new runtime dependency that phones home.** No analytics, no error
  reporting, no CDN fonts. treeye.science ships
  `Content-Security-Policy: default-src 'self'` and makes zero third-party
  requests; anything added here has to survive that.
- **`src/data.csv` is not to be modified, reformatted, regenerated or moved.**
  542 rows of real per-eye clinical biometry — age, ICL size and SE, ACD, CCT,
  ATA, CLR, ACA, vault, WTW, keratometry — from patients operated on at
  Ophthalmology Clinic Sánchez Trancón. It is the reference dataset the whole
  tool is built on.
- Repo stays public and MIT for now.
- Don't touch the deployment target or the GitHub Pages configuration.

---

## Open, tracked elsewhere

- **⚠️ Written confirmation that the row-level dataset may be published
  publicly.** The ethics/consent position for the research is covered. What is
  outstanding is the narrower permission: that these 542 rows may sit in a
  public repository. Covered-for-research and cleared-for-publication are not
  the same thing. Blocks nothing in this session; tracked in the Treeye roadmap.
- **Repo strategy** — recommendation is to keep this repo separate from the
  website and have the website vendor a pinned build artifact into
  `public/tools/icl-calc/`. Revisit when sign-in spans both. Reasoning in
  `treeye/docs/icl-calc-migration.md`.
- **Analytics** — recommendation is none at all. Cloudflare gives server-side
  request counts with no client JS, no cookies and no consent banner; the
  planned sign-up answers "who uses this" properly.
