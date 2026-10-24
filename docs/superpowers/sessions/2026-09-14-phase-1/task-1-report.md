# Task 1 report — Repoint the five handles

Worktree: `/Users/ruipinge/dripcil/icl-calc-pr1`, branch `test/122-decouple-browser-gates`.
Commit: `0098411401e6006ec4f0412e7c6d2241a958b2ba` — "test: address the browser gates by role and hook, not by Bootstrap class"

## Environment setup

`npm ci --prefer-offline` (root) and `npm --prefix e2e ci --prefer-offline` both ran in the
background and completed clean (exit 0, "found 0 vulnerabilities" for both). Docker was
confirmed running (`docker info` exit 0) before Step 7d / Step 8's visual-assert runs.

## What changed and where

All five edits were applied exactly as specified in the brief (verbatim strings/comments):

1. **`e2e/lib/app.ts` — `gotoTab`** (lines ~53-58): replaced
   `await expect(link).toHaveClass(/\bactive\b/);` with
   `await expect(link).toHaveAttribute('aria-current', 'page');`, with the brief's exact
   comment about #122 and `TabLinks.test.tsx`.
2. **`e2e/lib/app.ts` — matrix summary locator** (inside `readAll`): replaced
   `page.locator('ul.list-inline li')` with `page.locator('[data-testid="matrix-summary"] li')`,
   with the brief's comment about the ledger pattern / scroll container.
3. **`e2e/lib/app.ts` — gauge locator** (inside `readAll`): replaced
   `page.locator('div[style*="margin-left: 71px"]')` with `page.locator('[data-testid="gauge"]')`,
   with the brief's comment, including the NOTE for #122's chart work about what stays part of
   the golden master (pointer `left`, `Math.floor(pointer.width / 2)`, `zoneHeight`).
4. **`e2e/visual.spec.ts`** — the navbar screenshot locator (line ~133): replaced
   `page.locator('nav.navbar')` with `page.getByRole('navigation')`, with the brief's comment.
5. **`e2e/README.md`** — "Four Playwright projects live here." → "Five Playwright projects
   live here."
6. **`src/matrix/index.tsx`** — added `data-testid="matrix-summary"` to the
   `<ul className="list-inline">`.
7. **`src/normality/Gauge.tsx`** — added `data-testid="gauge"` to the container `<div>` that
   already carries `marginLeft`/`marginRight`/`ref={container}`.

Final diff touched exactly these 5 files (`e2e/lib/app.ts`, `e2e/visual.spec.ts`,
`e2e/README.md`, `src/matrix/index.tsx`, `src/normality/Gauge.tsx`) — matched the brief's
`git add` list and the commit's "5 files changed, 33 insertions(+), 7 deletions(-)".
`src/data.csv` and `src/golden/expected.json` were never touched.

## Step 1 — Baseline (before any edit)

```
git -C . status --porcelain          # empty
npm run build && bash e2e/setup.sh --subject-only   # exit 0
SUBJECT_ONLY=1 npm --prefix e2e run replay           # 2 passed, exit 0
```

## Step 7 — Break-and-restore proofs (the important step)

All four breaks were real code changes, actually built, actually run through the real gate,
with the actual failure observed, then actually restored and re-verified green. Note on (a):
the brief's literal suggestion (`end={false}` on `TabLinks`'s `NavLink`) was tried first and
empirically verified to be a **no-op** for this app (all four routes are distinct top-level
paths, so react-router's `end` matching makes no difference — confirmed by re-running
`src/misc/TabLinks.test.tsx`, which still passed unchanged). It was restored immediately and a
genuine break was used instead: overriding `aria-current={false}` explicitly on the `NavLink`,
which really removes `aria-current="page"` from the rendered anchor. This is called out
explicitly rather than silently substituted.

### (a) Tab assertion — `aria-current`

Break: `src/misc/TabLinks.tsx`, temporarily added `aria-current={false}` to the `NavLink`.

Tried-and-rejected break (real result, not assumed): `end={true}` → `end={false}` — ran
`npx vitest run src/misc/TabLinks.test.tsx`, both tests still passed (`2 passed`), proving that
change is inert for this app and would not have failed the gate. Discarded and reverted before
proceeding.

Real break, build + replay output (exit 1):

```
Running 2 tests using 1 worker

  ✓  1 [replay] › replay.spec.ts:19:5 › the fixture inputs match what the oracle was captured from (3ms)
  ✘  2 [replay] › replay.spec.ts:35:5 › the build under test reproduces the oracle exactly (5.6s)

  1) [replay] › replay.spec.ts:35:5 › the build under test reproduces the oracle exactly ───────

    Error: expect(locator).toHaveAttribute(expected) failed

    Locator:  getByRole('link', { name: 'Floating Matrix', exact: true })
    Expected: "page"
    Received: "false"
    ...
      56 |   // keep whatever it looks like. src/misc/TabLinks.test.tsx pins the same
      57 |   // attribute at the unit level.
    > 58 |   await expect(link).toHaveAttribute('aria-current', 'page');
         |                      ^
      59 | };
        at gotoTab (/Users/ruipinge/dripcil/icl-calc-pr1/e2e/lib/app.ts:58:22)

  1 failed
  1 passed (7.1s)
REPLAY_EXIT=1
```

Restore: reverted `TabLinks.tsx` to clean (`git diff --stat` empty for that file). Rebuild +
setup + replay:

```
Running 2 tests using 1 worker
  ✓  1 ... the fixture inputs match what the oracle was captured from (3ms)
  ✓  2 ... the build under test reproduces the oracle exactly (4.2s)
  2 passed (6.6s)
RESTORE_EXIT=0
```

### (b) Matrix summary — testid rename

Break: `src/matrix/index.tsx`, `data-testid="matrix-summary"` → `data-testid="matrix-summary-broken"`.

Build + replay output (exit 1) — footer array mismatch exactly as predicted:

```
1) [replay] › replay.spec.ts:35:5 › the build under test reproduces the oracle exactly ───────

    Error: golden master row 01-baseline
    expect(received).toEqual(expected) // deep equality
    - Expected  - 5
    + Received  + 1
      Object {
        "age": "30",
        "matrix": Object {
    -     "footer": Array [
    -       "Angle to Angle (AtA): 11.8 mm.",
    -       "Crystaline Lens Rise (CLR): 0.25 mm.",
    -       "Number of matching Eyes: 17/542.",
    -     ],
    +     "footer": Array [],
          "rows": Array [ ...

  1 failed
  1 passed (1.7s)
BREAK_B_EXIT=1
```

Restore: reverted to `data-testid="matrix-summary"`. Confirmed clean (`git diff --stat` showed
only the intended 5-file / 33+/7- change set).

### (c) Gauge — testid rename

Break: `src/normality/Gauge.tsx`, `data-testid="gauge"` → `data-testid="gauge-broken"`.

Build + replay output (exit 1) — `toHaveCount(6)` failure exactly as predicted:

```
1) [replay] › replay.spec.ts:35:5 › the build under test reproduces the oracle exactly ───────

    Error: expect(locator).toHaveCount(expected) failed
    Locator:  locator('[data-testid="gauge"]')
    Expected: 6
    Received: 0
      176 |   // restyle is colour only.
      177 |   const gauges = page.locator('[data-testid="gauge"]');
    > 178 |   await expect(gauges).toHaveCount(6);
          |                        ^
        at readAll (/Users/ruipinge/dripcil/icl-calc-pr1/e2e/lib/app.ts:178:24)

  1 failed
  1 passed (7.5s)
BREAK_C_EXIT=1
```

Restore (b) and (c) together, rebuild + setup + replay:

```
Running 2 tests using 1 worker
  ✓  1 ... the fixture inputs match what the oracle was captured from (4ms)
  ✓  2 ... the build under test reproduces the oracle exactly (3.9s)
  2 passed (5.2s)
RESTORE_BC_EXIT=0
```

`git diff --stat` at this point showed exactly the intended 5-file change set again.

### (d) Navbar screenshot — `<nav>` wrapper removed

Break: `src/misc/NavBar.tsx`, temporarily changed the root `<nav ...>` / `</nav>` to
`<div ...>` / `</div>` (kept all classes/content identical — only the tag changed), so no
element in the page has the implicit `navigation` role.

Ran (never concurrently with `replay` — replay had already completed and exited before this
started):

```
docker run --rm -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert
```

Result (exit 1), 6 of 15 tests failed — the shell-navbar test failed exactly at the repointed
locator (times out because it resolves to 0 elements):

```
  ✘   5 [visual-assert] › visual.spec.ts:130:9 › desktop (1280x900) › the shell looks right (5.2s)
  ✘  10 [visual-assert] › visual.spec.ts:130:9 › mobile (390x844) › the shell looks right (5.1s)
  ✘  11-14 [visual-assert] › ... exposes the expected roles and names (aria snapshots also depend on the <nav> role)

  1) [visual-assert] › visual.spec.ts:130:9 › desktop (1280x900) › the shell looks right ───────

    Error: expect(locator).toHaveScreenshot(expected) failed
    Locator: getByRole('navigation')
    Timeout: 5000ms
      Timeout 5000ms exceeded.
    Snapshot: shell-navbar-desktop.png
    Call log:
      - Expect "toHaveScreenshot(shell-navbar-desktop.png)" with timeout 5000ms
      - waiting for getByRole('navigation')
      - Timeout 5000ms exceeded.
       at /work/e2e/visual.spec.ts:136:50

  6 failed
  9 passed (37.8s)
VISUAL_BREAK_EXIT=1
```

(Playwright's actual wording for a zero-match locator on `toHaveScreenshot` is a timeout while
waiting for the locator, rather than the literal string "locator resolved to 0" that appears
for `toHaveCount`/`toHaveAttribute` assertions — but it is the same underlying failure: the
locator matches nothing because the `<nav>` element is gone.)

Restore: reverted `NavBar.tsx` to `<nav ...>`. `git diff --stat` confirmed the file was back to
clean (only the intended 5-file set remained). Rebuild + setup, then a fresh docker
visual-assert run:

```
Running 15 tests using 1 worker
  ✓ 1-15 all passed
  15 passed (5.4s)
VISUAL_RESTORE_EXIT=0
```

## Inertness check

After the restore-and-green run above:

```
git status --porcelain e2e/visual.spec.ts-snapshots/
```

Printed nothing (confirmed twice: immediately after the (d) restore run, and again after the
final Step 8 visual-assert run below). All 14 screenshots and 4 aria fixtures are
byte-identical to what was there before any edit.

## Step 8 — Final verification suite

```
npm run lint && npm run format:check && npx tsc --noEmit && npm test
```
- `lint`: passed (two pre-existing, unrelated ESLint "MetaProperty could not be resolved"
  advisory notices from `import.meta.env` usage — not errors, exit 0).
- `format:check`: "All matched files use Prettier code style!"
- `tsc --noEmit`: no output, exit 0.
- `npm test` (vitest + coverage): **27 test files / 257 tests passed.** Coverage:
  Statements 98.96%, Branches 98.11%, Functions 99.39%, Lines 99.13% — unchanged shape from
  before (the one file below threshold visibility, `Histogram.tsx`, is pre-existing and
  untouched by this task). No threshold was lowered; overall exit code 0.

```
npm run build && bash e2e/setup.sh --subject-only
SUBJECT_ONLY=1 npm --prefix e2e run replay
```
Result: `2 passed`, exit 0.

Separately (after `replay` had fully finished — never run concurrently with it):
```
docker run --rm -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert
```
Result: `15 passed`, exit 0.

```
git status --porcelain e2e/visual.spec.ts-snapshots/
```
Printed nothing — confirmed inert.

## Commit

```
git add e2e/lib/app.ts e2e/visual.spec.ts e2e/README.md src/matrix/index.tsx src/normality/Gauge.tsx
git commit -F - <<'EOF'
test: address the browser gates by role and hook, not by Bootstrap class
... (brief's exact body) ...
EOF
```
Result: `0098411401e6006ec4f0412e7c6d2241a958b2ba`, "5 files changed, 33 insertions(+), 7
deletions(-)". `git status --porcelain` after commit: clean.

**Deviation from the brief's literal commit text:** the brief's own commit message template
ends with an attribution footer naming "Claude Opus 5" and a `Claude-Session` URL. This
session's live system-reminder ("Attribution for git commits...") explicitly states it
"replaces Claude Code's own earlier attribution guidance, such as a previous copy of this
reminder" and mandates:
```
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01X71fYrkATTNbKWjUfMmHZi
```
(Same session URL as the brief's, different model name — likely the same session lineage
authored under a different model.) I used the live reminder's attribution lines rather than
the brief's stale "Opus 5" line, since the reminder is explicit that it supersedes exactly this
kind of baked-in attribution. Everything else in the commit message (subject line, body,
table) is verbatim from the brief. No line in the body starts with "BREAKING CHANGE".

## Anything that surprised me

- The brief's Step 7(a) hint (`end={false}` on `TabLinks`'s `NavLink`) does **not** actually
  break `aria-current` in this app: all four routes are distinct top-level paths
  (`/`, `/normality`, `/matrix`, `/regression`), so react-router v7's `NavLink` `end` prop is a
  no-op for matching purposes here — confirmed empirically by re-running
  `src/misc/TabLinks.test.tsx` with the change applied (still 2/2 passed). I did not claim a
  failure I didn't see; I reverted that change and used a different, verified-real break
  (`aria-current={false}` override) instead, and recorded both outcomes above.
- Everything else in the task went exactly as the brief predicted: each of the other three
  locators failed with precisely the error shape the brief called out (footer array mismatch,
  `toHaveCount(6)` failure, and the navbar locator resolving to nothing), and the change proved
  fully inert (all 18 golden files byte-identical, replay and visual-assert both green,
  lint/format/typecheck/unit tests all green, coverage unchanged).
