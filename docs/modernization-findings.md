# ICL Calculator — modernization findings

Survey of the repo as it stands, written 29 August 2026 before any code was
touched. It exists so the migration session doesn't have to rediscover it.

> **Status (updated during Phase 2a, issue #45; updated again during Phase
> 3a, issue #47):** this is a pre-work survey and later phases still read it
> as one, but it is no longer true that "nothing here has been actioned."
> Since it was written: **Phase 0** unpinned Node from EOL 14 and cleared
> the dependabot backlog; **Phase 1** captured the deployed app as a golden
> master (`src/golden/`, with L1 unit and L2 Playwright replay layers);
> **Phase 2a** revived CI on `checkout@v4`/`setup-node@v4`, added `tsc
> --noEmit` and an L2 replay job, and added the CI guard on
> `src/golden/expected.json` that section 7.3 of the design spec calls for;
> **Phase 3a** replaced `react-scripts` with Vite, Jest with Vitest, and
> TypeScript 4 with 5 — **findings 2, 3 and 4 below are now actioned**, each
> marked in place. Track ongoing work against epic #53. The rest of this
> document is kept as-written, as the historical survey it is — see the Node
> row below for the one correction needed to the table itself.

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
| Version | 1.7.0; last real feature work **2 December 2021** (`6f92f8e`) |
| Build | `react-scripts` 4.0.2 (Create React App) |
| Runtime | React 17 · TypeScript 4.1 · `react-router-dom` 5 |
| UI | Bootstrap 4.6 · Formik 2 · Yup · Sass |
| Charts | amCharts 4 |
| Services | Sentry 6 · `react-ga` 3 |
| Node | ~~pinned to v14 in `.nvmrc` and both CI jobs~~ ~~as of Phase 0, `.nvmrc` pins v16 (the newest version the build still passes under)~~ — as of **Phase 3a**, `.nvmrc` pins **v22** and all three CI jobs (`test`, `e2e-replay`, `deploy`) share it via `node-version-file: '.nvmrc'`. The v16 ceiling was CRA's webpack 4 build chain (`ERR_PACKAGE_PATH_NOT_EXPORTED` on 18+); Phase 3a removed that chain, so the ceiling is gone — see finding 4 below, kept as the historical record of the problem this fixed |
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

> **Actioned, Phase 3a (issue #47).** `src/db.ts` now imports the CSV via
> Vite's `?raw` import, exactly as suggested below. Verified, not assumed: a
> reviewer extracted the CSV literal from the built bundle and found it
> byte-for-byte identical to `src/data.csv` (BOM, 542 rows, no CRLF, trailing
> newline), and the L2 replay's Matrix footer (`N/542` eyes matched, all ten
> fixture rows) independently pins the row count. `src/data.csv` and
> `src/golden/expected.json` are byte-identical from before this phase to
> after it. Full account in
> `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md` §10,
> "Phase 3a result."

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

> **Actioned, Phase 3a (issue #47).** Four of five translated exactly as
> listed below. The fifth — `REACT_APP_VERSION` — was superseded by a
> different mechanism instead: `vite.config.ts`'s `define` block injects
> `import.meta.env.VITE_APP_VERSION` from `package.json`'s `version` field
> directly (pinned to `0.0.t` under `mode === 'test'` so the Footer snapshot
> doesn't churn on every release). `.env` was never rewired to feed it —
> Vite's `envPrefix` is `VITE_`, so `.env`'s `REACT_APP_VERSION` and
> `REACT_APP_NAME` were never exposed to the app at all, on any commit
> since the Vite switch — and `.env` was deleted as dead config (see
> Phase 3a task-6 report; task 6 also corrected this section, which
> previously said `.env` was "safe to keep and rename"). One near-miss on
> the way: the `%PUBLIC_URL%/` → `/` substitution in
> `index.html` missed `<meta name="msapplication-config" content>`, because
> Vite only rewrites root-absolute URLs in attributes it treats as asset
> references, not `meta[content]` — this is the design spec's §6.2
> "blind spot" (env-var renames invisible to the golden master) firing for
> real, not staying theoretical. Caught by the manual checklist §6.2 already
> required, not by CI; fixed before merge. See the design spec §6.2 and §10
> ("Phase 3a result") for the full account.

| Where | What | Vite equivalent |
|---|---|---|
| `src/misc/Footer.tsx:10,12` | `process.env.REACT_APP_VERSION` | `import.meta.env.VITE_APP_VERSION`, supplied by `define` in `vite.config.ts` from `pkg.version` (not by `.env`, which was deleted — see task-6 report) |
| `src/misc/NavBar.tsx:4` | `process.env.PUBLIC_URL` | `import.meta.env.BASE_URL` |
| `src/index.tsx:10`, `src/misc/GoogleAnalytics.ts:5` | `process.env.NODE_ENV` | `import.meta.env.PROD` |
| `public/index.html:5-7` | `%PUBLIC_URL%` | move `index.html` to the project root; use `/` or `%BASE_URL%` |
| `package.json` `test` script | `REACT_APP_VERSION=0.0.t react-scripts test` | Vitest; the pinned `0.0.t` test-mode value now lives in `vite.config.ts`'s `define`, not an env prefix |

`.env` held only `REACT_APP_VERSION` and `REACT_APP_NAME`, neither of which
Vite ever exposed (its `envPrefix` is `VITE_`) — it was dead from the moment
this migration landed. Deleted rather than renamed; nothing read it.

### 4. Node 14 is three years past end of life

> **Actioned. Phase 0 unpinned Node 14 → 16 (the CRA webpack 4 build chain's
> ceiling at the time, see the Node row above); Phase 3a (issue #47) removed
> that chain and unpinned further, Node 16 → 22 — `.nvmrc` and all three CI
> jobs now share `node-version-file: '.nvmrc'` pointing at v22.**

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

> **Actioned, Phase 4a (issue #50) — differently from the recommendation
> below.** The recommendation was to delete both integrations. The owner
> decided otherwise: keep and modernise them instead.
>
> Universal Analytics (`UA-212134595-1`, confirmed dead as described below)
> is replaced by GA4 via `react-ga4`, measurement ID read from
> `VITE_GA_MEASUREMENT_ID` with nothing initialised when it is absent (never
> hardcoded — the owner supplies it once the GA4 property exists), consent
> denied by default under Google's Consent Mode v2. **The GA4 dashboard
> shows zero traffic until #67 ships a consent banner** — deliberate, not an
> oversight. Tab navigation is *implemented* for the first time: the old
> code called `GA.init()` as a side effect inside JSX, firing one pageview
> at mount, so this hash-router SPA's four tabs had never been tracked at
> all; a `RouteTracker` now sends one `page_view` per tab via
> `useLocation`. It reports nothing until two things happen — the owner
> sets the `VITE_GA_MEASUREMENT_ID` repo variable (Settings → Secrets and
> variables → Actions → Variables, consumed by the deploy job's build
> step) and #67 grants `analytics_storage`. Be
> precise about "consent denied": it is not "nothing is sent" — GA4 still
> issues Google's documented cookieless ping (`gcs=G100`) to `/g/collect`
> carrying only anonymous session metadata and `location.pathname`, verified
> empirically (zero cookies before and after navigating all four tabs, one
> ping observed per session regardless of tab count).
>
> Sentry (`src/index.tsx:11`) was upgraded rather than deleted — `6.2.2` →
> `10.73` — and scrubbed: `tracesSampleRate` cut from `1.0` (100% of
> transactions since 2021) to `0.1`, `sendDefaultPii: false`, a
> `beforeSend`/`beforeSendTransaction` hook stripping `request.data`,
> `extra`, `contexts.state` (allow-listed to SDK-populated keys only),
> `tags`, `user`, `message` and `hint.attachments`, and console breadcrumbs
> dropped as a fail-safe against a future `console.log(formValues)`.
> **Verified on the wire, not in the config:** 21 form fields filled with
> unique sentinel values via real keystrokes, DOM-confirmed present, a real
> uncaught error triggered, the outgoing envelope intercepted before it
> could reach Sentry — zero sentinel occurrences anywhere in the payload,
> only CSS selectors of which field was touched, never its value.
>
> The two are not symmetric on consent, deliberately. GA4 is consent-denied
> by default; Sentry has no consent gate at all — it initialises
> unconditionally in production, and `browserSessionIntegration()` (a v10
> default absent from the old v6 config) sends a session envelope on every
> page load, unsampled by `tracesSampleRate`. Sentry sets no cookies and
> error reporting has a legitimate-interest basis that analytics does not,
> so the asymmetry is defensible — but state it plainly: **#67's consent
> banner is scoped to analytics only. Sentry is not gated on it.**
>
> Both were ruled out below partly because "both would have to be declared
> in a CSP that currently permits no third-party requests at all" — the
> design spec's §9 hard constraint against any phone-home dependency. That
> constraint was consciously traded, not found wrong (spec §9); **issue #68
> tracks the resulting CSP conflict** with `treeye.science`'s
> `default-src 'self'`, unresolved as of this writing. Today the app is
> served from GitHub Pages, which sends no CSP, so both integrations
> transmit from the live deployment as soon as this ships — treeye.science's
> CSP rides on the 302 redirect and never reaches the document that
> actually loads. Checked 2026-09-03:
> `https://treeye.science/tools/icl-calc` returns HTTP 302 to
> `https://ruipinge.github.io/icl-calc/`, with
> `content-security-policy: default-src 'self'` attached to that 51-byte
> redirect response; `https://ruipinge.github.io/icl-calc/` returns 200
> with no `content-security-policy` header at all. #68 covers the future
> topology where treeye.science serves the build directly instead of
> redirecting to it — under that topology both would have to be
> allow-listed. Full account:
> `docs/superpowers/plans/2026-09-02-phase-4a-telemetry.md` and the Phase 4a
> PR (`Closes #50`).

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
