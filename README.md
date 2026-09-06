# ICL Size Calc

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![build](https://github.com/ruipinge/icl-calc/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/ruipinge/icl-calc/actions/workflows/main.yml)

An Implantable Collamer Lenses (ICL) vault size calculator available as a web application. The last working version can be found [here](https://ruipinge.github.io/icl-calc/).

## Instructions

TODO: write some instructions

![alt text](https://ruipinge.github.io/icl-calc/instructions.png)

## Development

1. Install [Node.js](https://nodejs.org/en/download/current/) — the version
   CI runs is pinned in `.nvmrc` (currently v22), so `nvm use` here picks the
   same one
2. Clone git repository: `git clone git@github.com:ruipinge/icl-calc.git && cd icl-calc`
3. Install npm dependencies: `npm ci`
4. Run the local server: `npm start` (Vite dev server). The app is served from
   a sub-path — `base: '/icl-calc/'` in `vite.config.ts`, matching the
   `homepage` in `package.json` — so the dev URL is
   <http://localhost:5173/icl-calc/>, not the bare host. Vite prints it on
   startup.

`npm ci` no longer needs `--legacy-peer-deps`. That flag was required while
`@sentry/react@6.19.7` and `react-ga@3.3.1` capped their peer ranges at
React 18; #50 upgraded Sentry to v10 and dropped `react-ga`, so npm's peer
resolution is back on and a real peer conflict now fails loudly instead of
installing silently.

### Scripts

| command | what it does |
| --- | --- |
| `npm start` (or `npm run dev`) | Vite dev server with HMR |
| `npm run build` | production bundle into `build/` (not Vite's default `dist/`, because the deploy job and the e2e harness both expect `build/`) |
| `npm test` | Vitest, one pass with coverage |
| `npm run lint` | ESLint, flat config in `eslint.config.mjs` |
| `npm run format` / `npm run format:check` | Prettier, write / verify |
| `npx tsc --noEmit` | TypeScript typecheck |

`npm run lint`, `npm run format:check`, `npx tsc --noEmit` and `npm test` are
exactly the four checks CI's "Lint, typecheck and unit tests" job runs on every
pull request, in that order, so running them locally is that whole gate.

`npm test` runs `vitest run --coverage` under the hood: it runs once, prints a
coverage report and exits — no `--watchAll=false` flag needed. That was a
Jest/CRA flag and Vitest rejects unknown flags. For watch mode, run
`npx vitest` directly instead. Coverage is a gate, not a report: the floors in
`coverage-thresholds.json` fail the run when coverage drops below them. Don't
lower one to get green.

`npm run lint` is also the maintainability gate. `eslint-plugin-sonarjs`
supplies the cognitive-complexity and duplication checks that CodeClimate's
maintainability grade used to report, as CI failures rather than as a letter on
a dashboard — see the "maintainability gate" block in `eslint.config.mjs` for
the thresholds and for the two rules that are deliberately off.

`prettier` is pinned to an exact version (not a range) in `package.json` — a
looser range let it drift on the last lockfile regeneration and reformat files
this repo never touched, so bump it deliberately, not implicitly.

There is a second gate above the unit tests: an L2 browser replay in `e2e/`
that drives a real Chromium against a production build and compares what it
renders to the golden master in `src/golden/expected.json`. `src/golden/expected.json`
and `src/data.csv` are guarded in CI — changing either outside an `oracle/*`
branch fails the build by design.

### Commits and releases

Commits follow [Conventional Commits](https://www.conventionalcommits.org/),
with two exceptions noted below where this project's configuration does not
implement that spec.

`semantic-release` reads them on every push to `main` and cuts a version only
for `feat:` (minor), `fix:` and `perf:` (patch), and breaking changes (major).
Everything else — `ci:`, `chore:`, `docs:`, `style:`, `refactor:`, `test:`,
`build:` — still deploys, but produces no new version.

**Label a commit by what it ships, not by what it touches.** The deciding
question is whether the change alters what a clinician's browser loads. If it
does, it is a `fix:` or a `feat:` even when every edited line lives in CI
config, a build script or a comment. If it does not, it is `chore:`/`ci:` even
when the diff is entirely under `src/`.

This rule exists because the alternative was tried and failed. #90 was labelled
`ci:` because it edited a workflow — but it also rewrote the footer's own
links, so it changed the shipped bundle and shipped it under the previous
version's number. Nothing enforces this rule; it is a judgement made at commit
time, which is why it is written down here.

The version tracks **the product a clinician sees, not the toolchain
underneath it**. A major is reserved for the Treeye UI/UX reskin. Never add a
line-initial `BREAKING CHANGE:` footer to a commit body unless a major is
genuinely intended — that footer alone is enough to force one.

**Two things Conventional Commits describes that this configuration does not
do.** Both were verified by running the installed commit-analyzer plugin
against these exact message shapes, not read from documentation:

- **A `!` suffix does not mark a breaking change here — it cancels the release
  entirely.** `feat!: …` produces *no version at all*, not a major and not
  even the minor `feat:` would have given. The default `angular` preset reads
  the type as `feat!`, which matches no release rule. Use the
  `BREAKING CHANGE:` footer, which does work. This matters because the
  Conventional Commits spec linked above presents `!` as the short form, so
  following it here silently discards the release.
- **`revert:` as a type cuts nothing.** Only a git-generated revert — subject
  `Revert "…"` with `This reverts commit <sha>.` in the body, which
  `git revert` writes for you — is recognised, and it cuts a patch.

Neither syntax appears anywhere in this repository's history, so nothing has
been lost to them; they are recorded so the first use is not the discovery.

Because judgement can still be wrong, every deployed bundle names the commit
it was built from: the footer renders the version *and* the short SHA, linked
to that commit. A build is therefore identifiable even when no release was cut
for it. See `define` in `vite.config.ts`.

## Tech

- [JavaScript](https://www.javascript.com/), [TypeScript](https://www.typescriptlang.org/)
- [React](https://reactjs.org/), [React Router](https://reactrouter.com/), [Formik](https://formik.org/), [Yup](https://github.com/jquense/yup)
- [Vite](https://vite.dev/) (build and dev server), [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/) (unit tests), [Playwright](https://playwright.dev/) (golden-master browser replay)
- [Bootstrap](https://getbootstrap.com/), [Sass](https://sass-lang.com/)
- Charts are hand-rolled SVG components in `src/normality/`; #51 replaced amCharts 4 with them
- [Sentry](https://sentry.io/) for production error reporting
- [GitHub Actions](https://github.com/features/actions), [GitHub Pages](https://pages.github.com/)

## Data

TODO: Disclaimer: the statistical data used in this appliction is real data, blabla...

## Authors

- [Pedro Miguel Serra](https://www.linkedin.com/in/pedro-serra-44697321/), MSc, PhD
- [Rui Pinge](https://ruipinge.github.io/resume), Software Engineer

## References

[1] [Determining vault size in implantable collamer lenses: preoperative anatomy and lens parameters](https://doi.org/10.1097/j.jcrs.0000000000000146) (also available in [pdf](docs/2020-01-27_ASCRS_ESCRS_article.pdf))

[2] [Biometric and ICL-related risk factors associated to sub-optimal vaults in eyes implanted with implantable collamer lenses](https://eandv.biomedcentral.com/articles/10.1186/s40662-021-00250-6) (also available in [pdf](docs/2021-07-05_eye_and_vision_article.pdf))

## Warranty

This project is available under the [MIT License](https://github.com/ruipinge/icl-calc/blob/main/LICENSE) without any kind of warranty. The authors cannot be held responsible for any consequense of its usage.
