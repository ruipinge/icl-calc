# `e2e/` — the browser gates

A deliberately separate workspace with its own `package.json` and lockfile, so
Playwright is never a dependency of the application.

Four Playwright projects live here. Two run in CI and two do not, and the
difference matters:

| project | asserts? | runs in CI? | what it is |
|---|---|---|---|
| `capture` | — | no | writes `src/golden/expected.json` from the frozen 2021 oracle. Run once. |
| `replay` | yes | **yes** | L2. Drives a real Chromium against a production build and compares every rendered clinical value to the golden master. |
| `visual-assert` | yes | **yes** | Screenshots and accessibility-tree snapshots for all four routes plus the shell, at two viewports. |
| `visual` | no | no | a **capture tool** for the six Normality histograms (#51). Produces images for review by eye; asserts nothing. |
| `smoke` | yes | no | sanity checks against the oracle build. |

`visual` and `visual-assert` are easily confused. `visual` is the older one and
is not coverage — its own header says so, and for a long time this repository
described it as the visual coverage while nothing in CI ever invoked it.

## Running the gates locally

```sh
npm run build                         # from the repository root
npm --prefix e2e ci --prefer-offline
bash e2e/setup.sh --subject-only
SUBJECT_ONLY=1 npm --prefix e2e run replay
```

**Never run two of these at once.** `replay` and `visual-assert` both serve the
subject build on port **4022** with `reuseExistingServer: true`, so a second
run finds the first one's server still up and silently validates *its* build
instead. That failure is invisible: the run goes green.

## Visual coverage, and why it runs in a container

Screenshots are pixel fixtures, so they are bound to the operating system,
the browser build and the installed fonts. A baseline generated on macOS never
matches a Linux runner. The fixtures are therefore generated *and* asserted
inside the official Playwright image, so a maintainer's machine and CI produce
identical pixels:

```sh
# from the repository root, after `npm run build` and `bash e2e/setup.sh --subject-only`

# assert against the committed baselines - the same command CI runs
docker run --rm -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert

# regenerate them, after a deliberate visual change
docker run --rm -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert --update-snapshots
```

On a failure, Playwright writes three images per disagreement under
`e2e/test-results/`:

| image | what it is |
|---|---|
| `*-expected.png` | the committed baseline — how the page looks on the branch being compared against |
| `*-actual.png` | how it looks now |
| `*-diff.png` | the two overlaid, differences highlighted |

CI uploads that directory as a **`visual-diffs` artifact** on failure, so a
disagreement is reviewable from the run page without checking the branch out.
It is also how the #122 reskin gets compared against the current look: every
baseline the reskin moves produces exactly this triple.

Uploaded on failure only — on a green run the files do not exist, and an
artifact per run of a passing gate is noise.

**The image tag tracks `@playwright/test` in `e2e/package-lock.json`.** Bump
them together. Leaving them apart means the browsers the tests were written
against are not the browsers asserting them, and the baselines drift for a
reason no diff explains.

### Two fixture kinds, because they fail at different things

- **Accessibility-tree snapshots** (`*.aria.yml`) record roles and accessible
  names as YAML. They are platform-independent, they diff readably, and they
  are stable across restyling — so they survive a reskin and catch a
  *structural* change inside one.
- **Screenshots** record appearance. The Treeye reskin (#122) will regenerate
  all of them, and that is correct: it is the deliberate visual change, and
  regenerating is a reviewed act performed against the diff images. Their
  value is what they catch afterwards — and, during the reskin, an unintended
  change to a route it was not editing.

The aria snapshots are taken once per route rather than once per viewport,
because this application is responsive through CSS alone and no route renders
different elements at a different width. That is asserted rather than assumed:
`the accessibility tree does not change with viewport` compares the two
directly and fails if it ever stops being true.

### What the screenshots deliberately hide

The footer renders the release tag and the commit the bundle was built from,
and those differ between a local build and CI's. Both are masked, which keeps
the fixtures about the page rather than about who built it. Nothing else on
any route varies by build: the form opens at `INITIAL_VALUES`, every rendered
number is derived from constants or from `src/data.csv`, and the clock is
pinned because `PatientInfo.age()` reads `Date.now()`.
