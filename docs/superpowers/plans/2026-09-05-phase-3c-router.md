# Phase 3c — react-router-dom 5 → 7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `react-router-dom` from 5.2 to 7 without changing a single
number the calculator produces, and without breaking the tab URLs people have
bookmarked.

**Architecture:** The app renders its own `<HashRouter>` inside
`ICLContainer`, with four tab routes and a `TabLinks` nav. v7 removes
`Switch`, removes the `hashType` prop, changes `<Route>` to take an `element`,
changes `NavLink`'s active API, ships its own types, and adds an invariant
that throws when a `<Router>` is nested inside another `<Router>`. That last
one breaks the existing test helper, which has always wrapped `ICLContainer`
in a `BrowserRouter` it never actually needed.

**Tech Stack:** React 19.2, Vite 4, Vitest 1.6, `@testing-library/react` 16,
`react-router-dom` 7.18.

**Spec:** `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`
(this is phase **3c** in §6's table; it is being executed after 4a because the
owner reordered them)

**Issue:** #49

## Global Constraints

- `src/data.csv` is not to be modified, reformatted, regenerated or moved.
- `src/golden/expected.json` is not to be modified. A CI gate
  (`golden-master-guard`) blocks any PR that changes either file outside
  `oracle/*`. This is the stop rule, spec §7.3 — it is not advisory.
- The GitHub Pages deployment target and configuration are not to be changed.
  **This is why the app keeps a hash router.** GitHub Pages cannot do SPA
  fallback routing, so `BrowserRouter` is not available. Moving to
  `treeye.science` on Cloudflare would change that; it is not in scope here.
- Do not touch the ESLint stack (issue #63 owns it).
- Do not touch Sentry or `src/index.tsx` (phase 4a is merged and closed).
- Browser floor stays `chrome87 / edge88 / firefox78 / safari14`
  (`vite.config.ts`).
- Node version comes from `.nvmrc`; do not change it.
- Conventional commits. Do **not** write `BREAKING CHANGE:` or a `!` type
  suffix in any commit here — the 2.0.0 declaration belongs to the final
  `modernize` → `master` merge (#52), which is the only commit
  semantic-release will read.

---

## Established facts — verified, do not re-derive

These were checked against `react-router-dom@7.18.3` as actually installed,
not recalled from documentation. Two of them contradict issue #49's stated
acceptance criteria; the plan follows the evidence.

**1. v7 throws on nested routers.** In
`react-router/dist/*/chunk-*.mjs`, the `Router` component opens with:

```js
invariant(
  !useInRouterContext(),
  `You cannot render a <Router> inside another <Router>. ...`
)
```

Present in both the production and development builds. `ICLContainer` renders
its own `<HashRouter>`, and `src/ICLContainer.test.tsx`'s `renderWithRouter`
helper wraps it in `<BrowserRouter>`. Under v5 the inner router simply won —
the wrapper has been decorative for four years. Under v7 every test in that
file throws. **The wrapper must be deleted, not ported.**

**2. Legacy `#matrix` URLs already resolve under v7 — no shim is needed.**
`createHashHistory`'s location reader is:

```js
let { pathname = "/", search = "", hash = "" } =
  parsePath(window.location.hash.substring(1));
if (!pathname.startsWith("/") && !pathname.startsWith(".")) {
  pathname = "/" + pathname;
}
```

So `#matrix` → `"matrix"` → `parsePath` → `{pathname: "matrix"}` → normalised
to `/matrix`. And `#` or no hash → `parsePath("")` returns `{}` → the
destructuring default gives `/`. Every legacy URL this app has ever produced
lands on the right route without help.

Issue #49 asks for "a redirect shim rewriting legacy `#normality`, `#matrix`,
`#regression` to their `#/` equivalents on load". **Do not write one unless
Task 2's tests prove it is needed.** A shim would be dead code duplicating
the library. The *tests* in that acceptance criterion are still required —
they are what proves the behaviour and what would catch a future v8 dropping
the normalisation.

**3. `hashType` does not exist in v7.** Confirmed: `'hashType' in
require('react-router-dom')` is false, and `createHashHref` is unconditionally
`href + "#" + createPath(to)`. After this upgrade, *newly created* links read
`#/matrix`. Old bookmarks still load (fact 2) and then normalise on the next
click. That is the desired behaviour and needs no migration.

**4. `<Route path="/">` stops being a catch-all.** v5's `Switch` picked the
first match and a bare `path="/"` matched everything. v7's `Routes` ranks
matches and `path="/"` matches only exactly. The existing test `renders
Patient for inexistent route` currently passes because of the v5 behaviour;
without a `<Route path="*">` it would start asserting a blank page while
still passing. **A catch-all is required**, and Task 1 must prove it.

---

## File Structure

| File | Change |
| --- | --- |
| `package.json` | `react-router-dom` `^5.2.0` → `^7.18.3`; **remove** `@types/react-router-dom` |
| `package-lock.json` | regenerated |
| `src/ICLContainer.tsx` | `Switch` → `Routes`, `element` props, catch-all route, drop `hashType` |
| `src/misc/TabLinks.tsx` | `exact` → `end`, `activeClassName` → `className` callback |
| `src/ICLContainer.test.tsx` | delete the `BrowserRouter` wrapper; add `#/`-form and legacy-form route tests |
| `src/misc/TabLinks.test.tsx` | unchanged except snapshot |
| `src/**/__snapshots__/*.snap` | regenerated where the router changes markup |
| `docs/...-design.md`, `docs/modernization-findings.md` | reconcile |

---

## Task 1: Upgrade the router and convert the app

This task is deliberately large. The upgrade cannot be split: the moment
`react-router-dom` is v7, `Switch` no longer exists, so the dependency bump
and the code conversion have to land in one commit or the tree is red.

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `src/ICLContainer.tsx`
- Modify: `src/misc/TabLinks.tsx`
- Modify: `src/ICLContainer.test.tsx`
- Regenerate: `src/**/__snapshots__/*.snap`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: a v7 app whose four routes render the same components as before.
  Task 2 depends on `<Route path="*">` existing and on `renderWithRouter`
  having no `BrowserRouter` wrapper.

- [ ] **Step 1: Install v7 and remove the obsolete types package**

```bash
npm install react-router-dom@^7.18.3
npm uninstall @types/react-router-dom
```

`@types/react-router-dom` must be **removed**, not upgraded — v7 ships its own
types and the DefinitelyTyped package will produce conflicting declarations.
This is not a peer-dependency conflict, so the restored peer resolution will
not catch it; it surfaces as type errors.

- [ ] **Step 2: Run the suite to see exactly what breaks**

Run: `npm test`
Expected: FAIL. You should see `Switch` missing, and every test in
`src/ICLContainer.test.tsx` throwing `You cannot render a <Router> inside
another <Router>`. Record what you actually see — if the nested-router error
does *not* appear, stop and say so in your report, because the plan's fact 1
would then be wrong.

- [ ] **Step 3: Convert `src/ICLContainer.tsx`**

Change the import:

```tsx
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
```

Convert `TabContent`'s body. Note `element` props and the catch-all:

```tsx
  <Routes>
    <Route
      path="/normality"
      element={
        <Normality
          ata={values.biometry.ata}
          clr={values.biometry.clr}
          acd={values.biometry.acd}
          aca={(values.biometry.acan + values.biometry.acat) / 2.0}
          wtw={values.biometry.wtw}
          age={values.patient.age()}
        />
      }
    />
    <Route
      path="/matrix"
      element={<Matrix ata={values.biometry.ata} clr={values.biometry.clr} />}
    />
    <Route
      path="/regression"
      element={
        <Regression
          acd={values.biometry.acd}
          ata={values.biometry.ata}
          clr={values.biometry.clr}
          se={calcICLSphericalEquivalent(values)}
          age={values.patient.age()}
        />
      }
    />
    {/*
      v5's <Switch> picked the first match and a bare path="/" matched
      everything, so an unknown hash fell through to Patient. v7's <Routes>
      ranks matches and path="/" matches only exactly, so the catch-all
      below is what preserves that behaviour - without it an unknown hash
      renders nothing at all. Both entries point at the same element.
    */}
    <Route path="/" element={patientTab} />
    <Route path="*" element={patientTab} />
  </Routes>
```

Hoist the shared element above the `return` so it is written once:

```tsx
const patientTab = (
  <Patient
    values={values}
    errors={errors}
    touched={touched}
    {...otherProps}
  />
);
```

Then drop the now-invalid prop on the router itself — `hashType` does not
exist in v7:

```tsx
<Router>
```

Replace the `hashType` line with a comment recording why the app still uses a
hash router at all, since the prop that used to hint at it is gone:

```tsx
{/*
  Hash routing, not BrowserRouter: this deploys to GitHub Pages, which
  serves no SPA fallback, so a real path would 404 on reload. v7 dropped
  the hashType="noslash" prop this used to carry, so links now render as
  #/matrix rather than #matrix. Old bookmarks still resolve - v7's
  createHashHistory prefixes a missing leading slash - and normalise on
  the next click. See src/ICLContainer.test.tsx for the tests that hold
  that guarantee.
*/}
<Router>
```

- [ ] **Step 4: Convert `src/misc/TabLinks.tsx`**

`exact` becomes `end`; `activeClassName` is gone, replaced by a `className`
callback:

```tsx
        <NavLink
          end={true}
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
          to={link.to}
        >
          {link.label}
        </NavLink>
```

The rendered class list must stay `nav-link` and `nav-link active` — the L2
golden-master read path locates tabs by `a.nav-link` and asserts `active`
after clicking (`e2e/lib/app.ts`). Getting this wrong breaks the replay, not
just a snapshot.

- [ ] **Step 5: Delete the nested-router wrapper in `src/ICLContainer.test.tsx`**

`ICLContainer` renders its own `HashRouter`, so the helper must not supply
one. Replace `renderWithRouter` with:

```tsx
/**
 * ICLContainer renders its own <HashRouter>, so this must NOT wrap it in
 * another router - react-router 7 throws "You cannot render a <Router>
 * inside another <Router>". The old helper wrapped it in <BrowserRouter>,
 * which under v5 was simply ignored (the inner router won) and had been
 * decorative since it was written.
 *
 * Setting window.location.hash is what actually selects the route: the
 * inner HashRouter reads it on mount.
 */
const renderWithHash = (route: string = '#') => {
  window.history.pushState({}, 'Test page', route);
  return render(<ICLContainer />);
};
```

Update every call site in the file (`renderWithRouter(<ICLContainer />)` →
`renderWithHash()`, and `renderWithRouter(<ICLContainer />, '#matrix')` →
`renderWithHash('#matrix')`). Remove the now-unused `BrowserRouter` and
`JSX` imports.

- [ ] **Step 6: Run tests and regenerate snapshots**

Run: `npm test`
If failures are snapshot mismatches only, inspect the diff before accepting
it. You are looking for markup changes caused by the router — `NavLink` in v7
renders `aria-current="page"` on the active link, which v5 also did, so
compare rather than assume. **Any snapshot change that is not explainable by
the router upgrade is a bug — investigate it, do not accept it.**

Then: `npx vitest run -u` and re-run `npm test` to confirm green.

- [ ] **Step 7: Prove the catch-all actually catches**

The existing test `renders Patient for inexistent route` must still pass.
Prove it is not vacuous: temporarily delete the `<Route path="*">` line, run
that single test, confirm it FAILS, then restore it.

Run: `npx vitest run src/ICLContainer.test.tsx -t 'inexistent'`
Report both the red and the green result.

- [ ] **Step 8: Full gates**

Run each, capturing the exit code standalone — never through a pipe:

```bash
npm run lint      ; echo $?
npx tsc --noEmit  ; echo $?
npm test          ; echo $?
```

All three must be 0.

- [ ] **Step 9: L2 golden master replay**

This is the gate that matters. It drives a real browser against a real build
and is the only thing that would catch the URL format change breaking tab
navigation.

```bash
npm run build
cd e2e && ./setup.sh --subject-only
SUBJECT_ONLY=1 npm run replay
```

Both replay tests must pass. If `gotoTab` times out, the `className`
callback in Step 4 is wrong.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/
git commit -m "feat(router): upgrade react-router-dom 5 to 7

Switch -> Routes with element props, NavLink's exact/activeClassName ->
end/className callback, and @types/react-router-dom removed since v7 ships
its own types.

Two behaviour changes needed handling. v7's Routes ranks matches and
path=\"/\" no longer matches everything, so an explicit path=\"*\" catch-all
preserves the fallback to the Patient tab. And v7 throws when a Router is
nested inside another Router, which the test helper had been doing
harmlessly since it was written - the BrowserRouter wrapper is deleted
rather than ported, since ICLContainer supplies its own HashRouter.

Golden master intact: L1 green and the L2 browser replay still reproduces
the December 2021 oracle exactly."
```

---

## Task 2: Lock the legacy hash URLs behind tests

**Files:**
- Modify: `src/ICLContainer.test.tsx`

**Interfaces:**
- Consumes: `renderWithHash` from Task 1.
- Produces: nothing later tasks read.

The acceptance criterion in #49 is "a test per tab proving the legacy URL
resolves". Per established fact 2, this should already pass with no shim.
These tests exist to *prove* that and to catch a future router version
dropping the normalisation.

- [ ] **Step 1: Write the legacy-URL tests**

Add to `src/ICLContainer.test.tsx`:

```tsx
/*
 * Tab URLs were #matrix / #normality / #regression under router 5's
 * hashType="noslash", which v7 removed - new links render as #/matrix.
 * Anything a clinician bookmarked before this upgrade is in the old form,
 * so these assert the old form still lands on the right tab.
 *
 * No redirect shim implements this. react-router 7's createHashHistory
 * prefixes a missing leading slash itself, so "#matrix" parses to the
 * pathname "/matrix". These tests hold that library behaviour in place:
 * if a future version drops it, they go red and a shim becomes real work.
 */
it.each([
  ['#matrix', /Number of Eyes/],
  ['#regression', /Vault Prediction/]
])('resolves the legacy %s URL to its tab', (hash, expected) => {
  renderWithHash(hash);
  expect(screen.getByText(expected)).toBeVisible();
  expect(screen.queryByLabelText('Name')).toBeNull();
});

it.each([
  ['#/matrix', /Number of Eyes/],
  ['#/regression', /Vault Prediction/]
])('resolves the current %s URL to its tab', (hash, expected) => {
  renderWithHash(hash);
  expect(screen.getByText(expected)).toBeVisible();
  expect(screen.queryByLabelText('Name')).toBeNull();
});

it.each(['#', '#/', ''])(
  'resolves %s to the Patient tab',
  (hash) => {
    renderWithHash(hash || '/');
    expect(screen.getByLabelText('Name')).toBeVisible();
  }
);
```

`#normality` is deliberately absent: the Normality tab renders an amCharts
histogram that does not work under jsdom, which is why the existing
normality tests are `it.skip`. Issue #51 replaces amCharts with hand-rolled
SVG; add the `#normality` case then. Note this explicitly in your report.

- [ ] **Step 2: Run them**

Run: `npx vitest run src/ICLContainer.test.tsx`
Expected: PASS, with no shim written.

**If the legacy cases FAIL,** established fact 2 is wrong. Stop, say so in
your report with the actual failure, and implement the shim from #49's
acceptance criteria in `src/index.tsx` before `createRoot` — rewriting
`#matrix` to `#/matrix` — then make these tests pass. Do not write the shim
speculatively.

- [ ] **Step 3: Prove the legacy tests can fail**

A test that passes because the library happens to normalise must be shown to
be watching something. Temporarily change the `#matrix` case's expectation to
a string that is not on the Matrix tab, confirm RED, restore, confirm GREEN.
Report both.

- [ ] **Step 4: Commit**

```bash
git add src/ICLContainer.test.tsx
git commit -m "test(router): prove legacy hash URLs still resolve after v7

Bookmarks made before this upgrade use #matrix; v7 renders new links as
#/matrix. No shim implements the compatibility - react-router 7's
createHashHistory prefixes a missing leading slash itself. These tests hold
that behaviour in place so a future version dropping it goes red here
rather than silently 404-ing a clinician's bookmark.

#normality is omitted because amCharts does not run under jsdom; add it
with #51."
```

---

## Task 3: Reconcile the documentation

**Files:**
- Modify: `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`
- Modify: `docs/modernization-findings.md`

- [ ] **Step 1: Update the spec's phase table row for 3c**

The row currently reads:

```
| 3c | Router 5 → 7 | `Switch`→`Routes`, `element` props, plus a legacy-hash redirect shim | `expected.json` unchanged; a test proving `#matrix` resolves to `#/matrix` |
```

Replace the shim claim with what was actually done and why, in the same
"**As implemented:**" style the 4a row now uses. State that no shim was
written because v7's `createHashHistory` normalises a missing leading slash
itself, that tests hold that behaviour, and that a `path="*"` catch-all was
needed because `Routes` ranks matches.

- [ ] **Step 2: Annotate `docs/modernization-findings.md`**

Follow the document's own convention — historical text kept as-written with
an in-place `>` annotation. Record: the router is now v7;
`@types/react-router-dom` is gone; the app still uses a hash router and
**why** (GitHub Pages has no SPA fallback), with a forward pointer that
moving to Cloudflare removes that constraint and would allow `BrowserRouter`.

- [ ] **Step 3: Verify no stale claims remain**

```bash
grep -rn "hashType\|Switch\|activeClassName\|@types/react-router-dom" docs/ src/
```

Every remaining hit must be either historical text under an annotation, or
gone. Report the list.

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs(router): reconcile the 3c record with what was built

No redirect shim was written: react-router 7 normalises a missing leading
slash in the hash itself, so the acceptance criterion's shim would have
been dead code duplicating the library. Tests hold the behaviour instead.

Also records why this app still uses a hash router - GitHub Pages serves no
SPA fallback - and that the planned Cloudflare move would lift that."
```

---

## Verification summary

The phase is done when all of these hold:

1. `npm run lint`, `npx tsc --noEmit`, `npm test` all exit 0.
2. The L2 browser replay reproduces the oracle exactly.
3. `git diff` touches neither `src/data.csv` nor `src/golden/expected.json`.
4. `@types/react-router-dom` is absent from `package.json`.
5. No `Switch`, `hashType` or `activeClassName` remains in `src/`.
6. Legacy `#matrix` and `#regression` URLs resolve, proven by tests that were
   each shown capable of failing.
