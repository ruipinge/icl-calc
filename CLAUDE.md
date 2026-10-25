# icl-calc

A clinical ICL (Implantable Collamer Lens) surgical-planning calculator, live at
<https://ruipinge.github.io/icl-calc/>. Clinicians use its numbers to size a
lens for a real eye. That is the reason for most of the rules below.

## The one that matters most

`src/data.csv` (the 542-row clinical dataset) and `src/golden/expected.json`
(the frozen oracle) are **CI-guarded** by the `golden-master-guard` job. A
reskin, a refactor or a dependency bump must not change one computed clinical
value.

The L2 replay drives a real Chromium against a production build and compares
every rendered number to the oracle. **If L2 goes red, assume the change broke
arithmetic or wiring.** Stop. Do not fix forward, do not regenerate the
fixture, do not edit either guarded file to make a test pass.

A deliberate correction to the oracle needs a branch named `oracle/*` plus
written per-value justification — see §7.3 of
`docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`.

The frozen oracle is the annotated tag `golden-master-oracle` → commit
`789ac2d`, normally checked out at a sibling path `../icl-calc-oracle`.
**Never write to that worktree.** It is only needed by the `capture` and
`smoke` Playwright projects; `SUBJECT_ONLY=1` skips it, which is how CI runs
L2.

## Browser gates

Five Playwright projects live in `e2e/`, documented in `e2e/README.md`. Two
assert in CI: `replay` (L2) and `visual-assert`.

**Never run two of them at once.** Both serve the build under test on port
**4022** with `reuseExistingServer: true`, so the second finds the first one's
server still up and silently validates *that* build instead. It passes, and
nothing in the output says which build was measured. This is the most likely
way to get a false green, especially across parallel worktrees.

`visual-assert` is **not a separate CI job** — it is a step inside *L2 browser
replay of the golden master* (`.github/workflows/main.yml`), placed there for
exactly the port reason above. Splitting or renaming that job silently drops
visual coverage from the required checks.

Screenshots are pixel fixtures and platform-bound, so they are generated *and*
asserted inside the official Playwright container:

```sh
npm run build
bash e2e/setup.sh --subject-only
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert
```

Run the container as yourself, as above. The image runs as root by default,
so on a Linux host every file it writes — diff images, and with
`--update-snapshots` the tracked fixtures under `e2e/visual.spec.ts-snapshots/`
— ends up root-owned. `HOME=/tmp` because your UID has no home inside the
image and Playwright needs a writable one.

Drop `--update-snapshots` to assert, add it to regenerate. **The image tag
tracks `@playwright/test` in `e2e/package-lock.json`** — bump them together, or
the browsers asserting the fixtures are not the ones they were written against.

Two fixture kinds, which fail at different things. `*.aria.yml` records roles
and accessible names: restyle-proof, so movement there means *structure*
changed and needs justifying per hunk. The PNGs record appearance and are
regenerated when a visual change is deliberate — a reviewed act performed
against Playwright's diff images, which CI uploads as a `visual-diffs`
artifact on failure.

## Coverage

Floors live in `coverage-thresholds.json` and **fail CI**. They sit at or very
near the measured value, so there is almost no headroom.

Never lower one to go green. If coverage drops, work out why first — and note
that deleting *covered* code lowers the percentage without anything becoming
untested, because the denominator shrinks. That case is a re-seed, not a
relaxation, and it is still the owner's call.

## Tests must be able to fail

Every new or changed test is proven capable of failing: break the thing it
checks, see red, restore, see green, report both. Mutate each assertion
individually rather than reading it.

This is not ceremony. This repository has found eight tests that passed for
years while asserting nothing, and one implementation plan that shipped a
"proof" step which could not fail.

## Releases

semantic-release, angular preset, from commits on `main`.

- A **line-initial breaking-change footer in a commit body cuts a major**, and
  it works.
- A **`!` type suffix does not.** `feat!:` cuts nothing at all, not even a
  minor — the preset reads the type as `feat!` and matches no rule.

That footer token triggers a major from the start of **any** line in **any**
commit body, including prose explaining this rule. It has cost this project a
spurious major that had to be withdrawn by hand. Never write the bare uppercase
token except in the one commit genuinely meant to cut a major; everywhere else
write "the breaking-change footer".

Required status checks are matched by job **display name**, not id:
`Lint, typecheck and unit tests`, `Golden-master stop rule (expected.json,
data.csv)`, `L2 browser replay of the golden master`. Renaming a `name:` makes
branch protection match nothing and silently stop enforcing.

## Typography

The Treeye design system self-hosts three woff2 subsets and makes no
third-party requests — do not add a font CDN.

**Every numeral is set in Newsreader, the serif.** Both Poppins subsets the
site serves were built with every OpenType feature stripped, so
`font-variant-numeric: tabular-nums` is inert on them, and their digits are
proportional — `1` is less than half the width of `6`. Newsreader's subset
keeps `tnum` and is uniform. Poppins carries labels, headings and micro-caps.

Measured, not assumed. Do not re-litigate it without re-measuring the served
files.

## Hosting

The base path is `/icl-calc/` and does not change: `base` in
`vite.config.ts`, `import.meta.env.BASE_URL` in the navbar brand link, and the
`test.env` pin (vitest 5 stopped deriving it from `base`). A test asserts the
brand link renders `/icl-calc/` — if it fails, something moved that should not
have.

## Working practices

- **Worktree per piece of work.** Never work in the primary checkout. Remove
  after merge.
- Branch from the integration branch the work belongs to, not from `main`.
- **Squash-merging breaks stacked PRs.** After a squash the base commit is no
  longer an ancestor, so a stacked branch needs
  `git rebase --onto <base> <old-base>`, not a retarget.
- Verify claims against the installed code and the live site, not from memory
  and not from issue text. Several tables in this backlog's issues have been
  wrong and were corrected only when someone measured.
- `gh ... --body-file`, never `--body` with markup.
- `gh pr checks` can report a finished job as pending; use
  `gh run view <id> --json jobs` for the truth.
- Merge one PR at a time and watch its publish land before merging the next.

### Shell

Node version is pinned in `.nvmrc` (`e2e/.nvmrc` is inert).

**Do not read an exit code through a pipe.** `${PIPESTATUS[0]}` is a bash
feature and is empty under zsh, which this project has been developed on — so
it is not portable between a maintainer's macOS shell and a Linux server or CI
runner. Check with a standalone `echo $?` on its own line, which is correct
everywhere.

Run `npm install`/`npm ci` in the background and poll rather than in the
foreground — a command that goes quiet for long enough can be killed by an
agent stall watchdog.

Paths differ by host: the oracle worktree, any shared-folder mount and the
worktree layout are all machine-specific. Nothing in this file assumes a
particular one.

## Do not "helpfully" fix

- **`src/formulas.ts`** — the `TODO` marks an unwritten clinical safety
  warning. `sonarjs/todo-tag` is disabled in `eslint.config.mjs` specifically
  so CI cannot pressure anyone into deleting the marker instead of
  implementing it. Do not delete it, and do not tidy that file.
- **#41 (posterior keratometry)** is parked pending clinical input: the sign
  convention, the `if (kpf && kps)` falsy guard, whether the inert
  `axispf`/`axisps` fields get wired up or removed, and the unimplemented
  ratio-fallback warning. Do not implement any of it.
