# SDD ledger — plan: /Users/ruipinge/dripcil/icl-calc-phase1-spec/docs/superpowers/plans/2026-09-14-treeye-reskin-phase-1.md

Spec: /Users/ruipinge/dripcil/icl-calc-phase1-spec/docs/superpowers/specs/2026-09-14-treeye-reskin-phase-1-design.md (read)

Worktrees: PR1 = /Users/ruipinge/dripcil/icl-calc-pr1 (test/122-decouple-browser-gates, off origin/treeye-reskin @ 5003240)
Plan + spec live on branch docs/122-phase-1-design (PR #144, UNMERGED) — referenced by absolute path, not present in the PR branches.

## Pre-flight scan

### Pairs sharing a file or an interface

| A → B | A produces | B consumes | finding |
|---|---|---|---|
| 1 → 4 | `e2e/visual.spec.ts` locator `getByRole('navigation')` | Task 4 rewrites NavBar | **CONFLICT** — Task 4 as written changes `<nav>` to `<header>`, so the role stops matching and the locator moves twice in three PRs. See Ruling 1. |
| 1 → 5 | all 18 fixtures byte-identical | Task 5 regenerates all 18 | no conflict — different PRs, sequential |
| 1 → 3 | `data-testid` on `src/matrix/index.tsx`, `src/normality/Gauge.tsx` | Task 3 touches neither | clean |
| 2 → 3 | leaves `className="col-4"` on regression `<th>` | Task 3's shim defines `.col-4` | clean — consistent |
| 2 → 5 | `regression.aria.yml` regenerated | Task 5 regenerates all four | clean — sequential |
| 3 → 4 | `.wrap .chrome .chrome-bar .tabs .btn-ghost .site-footer .brand .wordmark .toolname .rule` | Task 4 uses exactly those names | clean — verified name by name |
| 3 → 5 | base layer + shim | fixture regeneration | clean |
| 4 → 5 | shell markup changes | Task 5's list of permitted aria changes | **CONFLICT** — Task 4 introduces `<hr className="rule">` in the Footer, which renders a NEW `separator`, while Task 5 says separators only disappear. See Ruling 2. |

### Each task against itself

| task | self-consistency | finding |
|---|---|---|
| 1 | tests specified vs code specified | clean — each of the four locators has a named break-and-observe step |
| 2 | asserts `rowheader` role, fix changes `scope` | clean — the role follows from the attribute |
| 3 | CSS defines every class Task 4 uses; `src/App.scss` deleted and import repointed in the same task | clean |
| 4 | components vs the CSS in Task 3 | clean apart from Rulings 1 and 2 |
| 5 | permitted-diff list vs what Tasks 3+4 actually change | **CONFLICT** — see Rulings 1 and 2; the list was incomplete |

## Rulings

Ruling 1: NavBar keeps its `<nav>` element; only its classes change. Task 4 as drafted promoted it to `<header>`, which swaps the `navigation` landmark for `banner`, moves the shell screenshot locator twice in three PRs, and changes landmark semantics under cover of a restyle — against #122's "restyle the controls, keep the arrangement". Cost if wrong: the chrome stays a `navigation` landmark where `banner` would be more precise; a later PR can correct that deliberately, with its own aria-fixture justification.

Ruling 2: the Footer's spectrum bar is a decorative `<div className="rule" />`, not an `<hr>`. An `<hr>` renders a `separator` in the accessibility tree, so Task 4 would have removed one separator and added another while Task 5 claimed separators only disappear. It is decoration — the footer already carries `border-top` — so it has no business in the tree. Cost if wrong: none identified; if a thematic break is genuinely wanted there, restoring `<hr>` is one line plus a fixture regeneration.

Ruling 3: PR 1 branches from `treeye-reskin`, not from `docs/122-phase-1-design`. The plan and spec (PR #144) stay unmerged and out of the implementation branches; subagents read them by absolute path from the spec worktree. Cost if wrong: if #144 is merged first, PR 1 needs a rebase, which is routine. Keeping them separate means a docs review cannot block a test-only fix.

Plan amended for Rulings 1–3 before Task 1 dispatch (commit on docs/122-phase-1-design).

## Progress

Task 1: dispatched (sonnet) — BASE 5003240, worktree icl-calc-pr1
Task 1: implementer DONE (commit 0098411, amended to b512d91). 257 unit tests, replay 2/2, visual-assert 15/15, all 18 fixtures byte-identical.
Task 1: Ruling 4 — commit attribution normalised to `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. The subagent ran on Sonnet and wrote its own model; the repo history uses "Claude Opus 5 (1M context)" and this session's standing instruction says "Claude Opus 5", which supersedes. A phase whose commit trailers vary by which model happened to transcribe each task makes the history harder to read, and the subagent is an implementation detail of this session rather than a separate author. Cost if wrong: the trailer names Opus 5 where Sonnet did the transcription; amending is trivial while unpushed.
Task 1: plan defect found by the implementer — step 7(a)'s suggested break (`end={false}`) is inert in this app; it substituted `aria-current={false}` and reported the discrepancy. Plan corrected on docs/122-phase-1-design. This is the project's own recurring defect class (a proof step that cannot fail) appearing in the plan itself.
Task 1: review dispatched (sonnet) over 5003240..b512d91.
Task 1: review clean — spec ✅, quality approved, zero findings. Reviewer independently confirmed scope (5 files) and fixture byte-identity via git diff --stat.
Task 1: ⚠️ items resolved by controller — all were "did not re-run the suites". Not gaps: the reviewer confirmed inertness at git level, and CI re-runs lint/typecheck/tests/replay/visual-assert on the PR, which is this project's stated source of truth.
Task 1: complete (commits 5003240..b512d91, review clean)
Task 2: first dispatch (sonnet) KILLED by the stream watchdog at 600s while waiting on npm ci. Installs had in fact completed; the agent was killed waiting, not failing. Worktree left clean, no commits.
Task 2: Ruling 5 — the controller pre-installs dependencies in each worktree before dispatching an implementer. npm ci in a cold worktree routinely exceeds the 600s no-progress watchdog, and an implementer that dies waiting burns a full dispatch for nothing. Installing is environment setup, not implementation, so it neither pollutes the review surface nor skips review. Cost if wrong: none identified; the implementer still verifies the toolchain by running the suites.
Task 1: PR #145 opened; CI run 34791091354 completed success (golden-master pass, L2 replay pass, lint/typecheck/unit pass). Independently confirms the implementer's report and closes the review's ⚠️ items.
Note: `visual-assert` is NOT a separate CI job — it is a step inside "L2 browser replay of the golden master" (main.yml:358), placed there deliberately because both bind port 4022. So that check passing covers the visual fixtures too. Consequence worth remembering for later phases: splitting that job, or renaming it, silently drops visual coverage from the required checks.
Task 2: re-dispatched (sonnet) with installs pre-warmed.
PR3 worktree created at /Users/ruipinge/dripcil/icl-calc-pr3 (feat/122-design-system-and-shell); installs warming in background.
Task 2: second dispatch also killed at 600s, at "Step 2: run and watch it fail". DIAGNOSED: not the agents. The command itself runs in 1.29s (verified by running it directly), but the tool harness took >300s to return its result, and the Bash safety classifier was intermittently timing out too. Both subagents died waiting on a stream, not on work.
Task 2: Ruling 6 — Task 2 completed in the controller session rather than a third dispatch. Two dispatches died to harness stalls without producing a commit; the remaining work was mechanical with the exact code already in the brief, and the second agent had correctly written the test and the docblock before it was killed. The review gate is preserved: an independent reviewer is still dispatched over the diff, and is told the controller wrote it so it reviews without deference. Cost if wrong: the implementer and controller are the same context for this one task, so a blind spot in my reading of the brief would not be caught until review.
Task 2: Ruling 7 — long commands now run via `run_in_background` with output redirected to a file, read back with Read. Direct foreground runs are what stalled. Cost if wrong: none; it is strictly more robust.
Task 2: Step 5 proof PASSED — with only VaultPrediction fixed, the test found 3 rowheaders instead of 6 and failed (exit 1, "expected [ '12.6 mm', '13.2 mm', '13.7 mm' ] to deeply equal [ …(6) ]"). Restored.
Task 2: controller-implemented. 258 tests green, coverage exactly on floors, L2 2/2, visual-assert 15/15. Fixture diff is exactly 6 lines, all columnheader->rowheader, 3 per table; no PNG moved. Commit d0480bb.
Task 2: review dispatched (sonnet) over 5003240..d0480bb, with explicit instruction to review without deference since the controller authored it.
Task 2: first review dispatch also stalled at 600s, mid-verification. Ruling 8 — reviewer dispatches are now scoped to STATIC analysis only (read files, reason, run nothing) whenever the gates have already been run and recorded by the controller. The stalls correlate with command execution, and a reviewer's real value here is re-deriving the claims from source, not re-running suites the controller already ran and logged. Cost if wrong: the reviewer takes the recorded gate output on trust rather than reproducing it; mitigated because CI re-runs every gate on the PR independently.
Task 2: static review clean — spec ✅, quality approved, zero findings. Reviewer independently re-derived the both-tables discrimination from the component code and verified the docblock's readRows claim against readRows itself.
Task 2: ⚠️ resolved by controller — "could not run the suites" was by instruction; the controller ran and logged all of them and CI re-runs them on the PR.
Task 2: complete (commits 5003240..d0480bb, review clean)
Task 2: PR #151 opened.
Task 3: dispatched (sonnet) — BASE 5003240, worktree icl-calc-pr3, with explicit background-command instructions to survive the watchdog.
Task 3: implementer DONE, commit e9f2d21, no concerns. Controller verified independently: 8 files; bootstrap + sass removed from package.json; fonts 7844/7740/22504 exactly; no scss remains; App.scss (50) deleted, App.css (555) added. 257 tests, coverage unchanged, build OK.
Task 3: static review dispatched (sonnet) over 5003240..e9f2d21, focused on token hex values, relative font URLs, shim comments and cascade collisions.
Task 3: review clean — spec ✅, quality approved. Reviewer checked all 19 hex tokens digit-for-digit against the brief, confirmed relative font URLs, and verified every shim class is genuinely used by the app (none invented).
Task 3: ⚠️ resolved by controller — reviewer could only check tokens against the brief, not the live site. Controller diffed src/App.css tokens against the live preview.treeye.pages.dev stylesheet: 24 shared tokens, ZERO semantic mismatches (the one textual difference is Prettier whitespace inside linear-gradient), and no live token left unadopted.
Task 3: minor (deferred): the utility-class shim block's comment says "deleted alongside their components" rather than naming a PR. Ruling 9 — left as written. Those classes are deleted across PRs 4, 5 and 6, so no single PR number is correct, and the "shim section empty by end of PR 6" invariant still covers them. Cost if wrong: a reader wanting a per-class removal schedule has to infer it from which component uses the class.
Task 3: complete (commits 5003240..e9f2d21, review clean)
Task 4: dispatch FAILED with an API authentication error ("Not logged in"), not the watchdog. Left no commits and a clean tree.
Task 4: Ruling 10 — Task 4 (and Task 5 if needed) implemented in the controller. Five of seven subagent dispatches in this session have now died to infrastructure (3 watchdog stalls, 1 auth failure, 1 reviewer stall), while every STATIC reviewer dispatch has succeeded. Implementation is therefore done in-session and review stays independent and static. Cost if wrong: author and reviewer share a context for these tasks; mitigated by the reviewer being told so explicitly and by CI re-running every gate.
Task 4: NavBar break proof PASSED — removing the mark's href drops the anchor's `link` role entirely; getByRole('link', {name:'Treeye'}) fails, exit 1, while the ICL Size Calc base-path test and the Reset test both still pass (break is isolated). Restored.
Note: session attribution guidance changed mid-run — the Claude-Session trailer is no longer to be added. Commits from Task 4 onward carry only the Co-Authored-By line. Earlier commits keep what they were made with; not rewriting history for a trailer.
Task 4: code complete and UNCOMMITTED in icl-calc-pr3. 258 tests pass; shell tests 31/31 including the ICL Size Calc base-path guard. BLOCKED on one thing: branch coverage 98.11 -> 98.07.
Task 4: coverage analysis — before 104/106 (98.1132%), now 102/104 (98.0769%). Exactly 2 branches removed, BOTH COVERED: the `isActive ? 'nav-link active' : 'nav-link'` ternary deleted from TabLinks when the active state moved to aria-current. Uncovered count is UNCHANGED at 2 (Histogram.tsx's ResizeObserver path, unreachable under jsdom). So coverage quality did not regress; the denominator shrank.
Task 4: STOPPED for owner decision. Editing coverage-thresholds.json was refused by the auto-mode classifier as a CI bypass, and the owner's standing instruction is not to lower a floor to go green. Running the L2 replay was refused for the same reason. Not worked around. Awaiting owner choice between re-seeding the branch floor to 98.07 and adding a real test for Histogram's ResizeObserver path.
