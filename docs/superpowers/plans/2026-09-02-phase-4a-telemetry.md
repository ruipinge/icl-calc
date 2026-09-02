# Phase 4a — Modernise Sentry and analytics: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring error reporting and analytics up to date, scrub patient data out of what they send, and clear the two peer conflicts that force `--legacy-peer-deps` — without moving a single number the calculator produces.

**Architecture:** Sentry stays and is upgraded; Universal Analytics is replaced by GA4 with consent mode denied by default. This phase was originally *remove Sentry and analytics*; the owner decided to keep and improve them instead, so #50 was re-scoped.

**Tech Stack:** `@sentry/react` 10 · `react-ga4` · React 19 · Vite 4 · Vitest 1 · Node 22

**Spec:** `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`

**Issue:** #50 · epic #53 · follow-ups #67 (consent) and #68 (CSP)

## Global Constraints

- **`src/data.csv` and `src/golden/expected.json` must not change.** CI enforces both.
- **`react-router-dom` stays on 5.** #49 upgrades it, and is deliberately sequenced *after* this phase — see below.
- **No patient data may reach Sentry.** This is the constraint that matters most here and is the reason the phase is worth doing at all.
- Conventional commits. Work in the existing worktree. Do not merge; the human merges.

## Why this phase now, ahead of #49

`--legacy-peer-deps` is currently in every CI `npm ci`, required by exactly two packages — `@sentry/react@6.19.7` and `react-ga@3.3.1`, both capped at React 18. **While that flag is set, npm's peer resolution is switched off entirely.** #49 upgrades `react-router-dom` 5 → 7 underneath it, so a peer incompatibility there would install silently instead of erroring.

The flag's *absence* in Phase 3a is precisely why these two conflicts surfaced as errors rather than passing quietly. This phase removes both, restoring that signal before the router moves.

## Operational note

**Six agents in Phase 3a were killed by a stall watchdog during silent multi-minute `npm` commands.** Run every install with `run_in_background: true` and poll. Commit early. Node 22 throughout.

## What exists today

`src/index.tsx:10-21` — Sentry 6.2.2, `new Integrations.BrowserTracing()` from the separate `@sentry/tracing` package, `tracesSampleRate: 1.0`, guarded by `import.meta.env.PROD`.

`src/misc/GoogleAnalytics.ts` — `ReactGA.initialize('UA-212134595-1')` plus a single `pageview`, called from **inside JSX** at `src/ICLContainer.tsx:69` as `{GA.init()}`. Universal Analytics stopped processing data on 1 July 2023, so this has recorded nothing for over three years. Because it fires once at mount and the app is a hash-router SPA, **tab navigation has never been tracked at all.**

`web-vitals` is a declared dependency and is **never imported**.

---

## Task 1: Sentry — upgrade, and stop it seeing patient data

**Files:** `package.json`, `package-lock.json`, `src/index.tsx`

- [ ] **Step 1: Upgrade**

Backgrounded. `@sentry/tracing` no longer exists as a separate package from v7 onward — its contents moved into `@sentry/react`, so remove it:

```bash
npm i --legacy-peer-deps @sentry/react@^10
npm uninstall @sentry/tracing
```

- [ ] **Step 2: Rewrite the init block**

The v6 API in `src/index.tsx:10-21` is gone. In v10, `new Integrations.BrowserTracing()` becomes the `browserTracingIntegration()` function. Consult the installed package's own types rather than reciting from memory — this API has changed repeatedly across majors.

Keep the `import.meta.env.PROD` guard exactly as it is. Keep the DSN.

- [ ] **Step 3: Reduce `tracesSampleRate` from `1.0`**

It has sent 100% of transactions since 2021. Use `0.1`, and replace the stale comment (which still says "we recommend adjusting this value") with the actual reasoning.

- [ ] **Step 4: Scrub patient data — the point of this task**

⚠️ **Clinicians type patient biometry into this form.** Sentry's default breadcrumbs capture UI interactions, and error context can carry surrounding state. Nothing has ever been configured to prevent that.

Set, deliberately and with comments explaining each:
- `sendDefaultPii: false`
- a `beforeSend` hook that strips anything resembling form input
- breadcrumb configuration that does **not** capture input values — check what the installed version captures by default rather than assuming

**Then verify it empirically.** Build, serve, fill the form with recognisable values, trigger an error, and inspect the outgoing request payload — browser devtools network tab, or intercept it. **Confirm no biometry values appear.** Report what you actually saw in the payload. A configuration that looks right is not evidence.

- [ ] **Step 5: Gates**

`npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, then `SUBJECT_ONLY=1 npm --prefix e2e run setup` and `SUBJECT_ONLY=1 npm --prefix e2e run replay` — both need the env var.

Note `src/index.tsx` is excluded from coverage, so no unit test reaches this file. **Serve the build and confirm the app still mounts.**

- [ ] **Step 6: Commit**

---

## Task 2: Analytics — GA4, out of the render, consent denied

**Files:** `package.json`, `src/misc/GoogleAnalytics.ts`, `src/ICLContainer.tsx`, `.env.example` (new)

- [ ] **Step 1: Replace the library**

```bash
npm i --legacy-peer-deps react-ga4
npm uninstall react-ga
```

`react-ga` speaks only the UA protocol and is one of the two packages capping React at 18.

- [ ] **Step 2: The measurement ID comes from an env var**

The UA ID is currently hardcoded. Use `import.meta.env.VITE_GA_MEASUREMENT_ID` instead, and **initialise nothing when it is absent** — so dev and test runs never reach GA.

Add a committed `.env.example` documenting the variable. Do **not** commit a real ID; the owner supplies it via the build environment once the GA4 property exists.

- [ ] **Step 3: Consent mode, defaulting to denied**

⚠️ GA4 sets cookies, and the clinic is in the EU. There is no consent banner — that is #67.

Initialise with consent **denied** by default, so GA4 loads but collects nothing until consent is granted. **State plainly in a comment that analytics will report nothing until #67 ships**, so nobody spends a day debugging an empty dashboard.

- [ ] **Step 4: Get `GA.init()` out of the JSX**

`src/ICLContainer.tsx:69` renders `{GA.init()}` — a side effect during render. It returns a boolean, which React renders as nothing, so the snapshot should not change; **verify that**. Under React 19 with StrictMode it would double-fire, and it is simply wrong.

Move it into a `useEffect` that runs once.

- [ ] **Step 5: Track route changes — the thing that has never worked**

The app is a hash-router SPA with four tabs and has only ever sent one pageview at mount. Add a small component inside the `Router` that uses `useLocation` and sends a pageview on change.

Note **#49 changes the router to v7**, which will alter this import — flag it in that issue so it is not discovered by breakage.

- [ ] **Step 6: Gates** — as Task 1, plus confirm `src/__snapshots__/ICLContainer.test.tsx.snap` is unchanged (or explain precisely why it moved).

- [ ] **Step 7: Commit**

---

## Task 3: Clean up, and take the flag back out

**Files:** `package.json`, `package-lock.json`, `.github/workflows/main.yml`

- [ ] **Step 1: Remove `web-vitals`** — declared, never imported.

- [ ] **Step 2: Confirm both peer blockers are gone**

```bash
node -e "const l=require('./package-lock.json'); for (const [k,v] of Object.entries(l.packages)) { const p=v.peerDependencies||{}; if (p.react && !/19/.test(p.react)) console.log(k, p.react); }"
```

Anything still capping below React 19 is a finding — report it rather than leaving the flag in.

- [ ] **Step 3: Regenerate the lockfile without the flag**

Backgrounded:

```bash
rm -rf node_modules package-lock.json
npm install
```

A clean `npm install` with **no** `--legacy-peer-deps` is the deliverable. If it fails, stop and report exactly what conflicts — do not reinstate the flag silently.

- [ ] **Step 4: Remove the flag from CI**

All three `npm ci` calls in `.github/workflows/main.yml`, plus the explanatory comments. Leave the `e2e/` install alone — it has no React dependency and never carried the flag.

- [ ] **Step 5: Full gates, then push and confirm CI green.**

Check the hard-won pieces survive: the `test` step's `shell: bash` (without it the step exits with `tee`'s status and the gate cannot fail), `deploy`'s `!cancelled()` condition, and `golden-master-guard` covering both `expected.json` and `data.csv`.

- [ ] **Step 6: Commit**

---

## Task 4: Documentation and the pull request

- [ ] **Step 1: Amend the spec's hard constraint.** §9 says no runtime dependency may phone home, on the basis of `treeye.science`'s CSP. The owner has decided otherwise. Record the decision, and that #68 tracks the CSP conflict it creates — the constraint was not wrong, it has been consciously traded.

- [ ] **Step 2: Update `docs/modernization-findings.md`.** Findings 6 (analytics recorded nothing since July 2023) and the Sentry half of the same section are now actioned, differently from how they were originally recommended.

- [ ] **Step 3: Open the PR** against `modernize`, `Closes #50`.

Lead with what changed about **data leaving the browser**, since that is the substance: Sentry upgraded and scrubbed, with the evidence from the payload inspection; GA4 replacing a property that has been dead since July 2023; tab navigation tracked for the first time; consent denied by default so nothing is collected until #67. Then the peer-conflict clearance and `--legacy-peer-deps` removal, and the golden-master result.

Be explicit that **analytics collect nothing until #67**, and that **both integrations are blocked under `treeye.science`'s CSP until #68**.

---

## Notes for later phases, not tasks

- **#49 (router 5 → 7) declares the 2.0.0 breaking change.** Its squash commit must carry `BREAKING CHANGE:` in the footer — the squash message is what `semantic-release` reads. It will also need to update the route-change tracking added in Task 2.
- **#52 (ship)** must run `npx semantic-release --dry-run` and confirm **2.0.0** before merging to master. There is no checkpoint between computing the version and tagging, releasing and deploying it.
- #67 consent, #68 CSP, #63 the ESLint stack.
