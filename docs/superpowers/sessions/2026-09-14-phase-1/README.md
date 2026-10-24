# Phase 1 execution record — 14 September 2026

Working notes from the session that executed PRs 1–3 of the Treeye reskin
(#122). Committed because the originals lived in a git-ignored scratch
directory and the work was handed over to a different machine; nothing else
records the evidence below.

This is a record, not a specification. The spec is
`docs/superpowers/specs/2026-09-14-treeye-reskin-phase-1-design.md` and the
plan is `docs/superpowers/plans/2026-09-14-treeye-reskin-phase-1.md`. Where
this directory and those two disagree, they are right and this is stale.

| file | what it holds |
|---|---|
| `ledger.md` | the pre-flight conflict scan, and eleven rulings each with its cost if wrong |
| `task-1-report.md` | PR 1 — the four break-and-restore transcripts proving each repointed locator can still fail |
| `task-3-report.md` | PR 3 — font byte sizes as downloaded, the dependency removal, and the verification run |

No report exists for tasks 2 and 4. Both were implemented in the controller
session after their subagents were killed by infrastructure stalls, so their
evidence is in the commit messages and pull request descriptions instead.

## Why the rulings are worth keeping

Five of them (5, 6, 7, 8, 10) are workarounds for a failing dispatch harness
on one laptop — five of seven subagent dispatches died to a 600-second
watchdog or an auth error, on commands that take about a second. **Those
should not be carried to a healthy machine.** The rest are project decisions
that still bind:

- **Ruling 1** — `NavBar` keeps its `<nav>`; promoting it to `<header>` swaps
  the `navigation` landmark for `banner` across all four aria fixtures.
- **Ruling 2** — the footer's spectrum bar is a `<div>`, not an `<hr>`, so it
  stays out of the accessibility tree.
- **Ruling 3** — implementation branches start from `treeye-reskin`, not from
  the docs branch, so a documentation review cannot block a test-only fix.
- **Ruling 4** — commit attribution is `Co-Authored-By: Claude Opus 5`
  whatever model transcribed the task.
- **Ruling 9** — the grid shim's utility-class block names no single PR
  because those classes are deleted across PRs 4, 5 and 6.

## Two plan defects the proof steps caught

Both argue for keeping the break-and-restore step rather than trusting review:

- The plan's suggested break for the tab assertion, flipping `end={true}` to
  `end={false}`, is **inert in this application**. All four routes are
  distinct top-level paths, so react-router v7's `end` prop changes no
  matching decision and the unit test still passes with it flipped. A proof
  step that cannot fail is the defect class this repository keeps finding in
  its own tests, and the plan shipped one.
- The plan's task 2 test called `render(<Regression {...VALUES} />)` with
  `VALUES` undefined; the file has a `renderRegression()` helper built on
  `RI`.
