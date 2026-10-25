# Task 3 report: Tokens, fonts, base layer, and Bootstrap's removal

Worktree: `/Users/ruipinge/dripcil/icl-calc-pr3` (branch `feat/122-design-system-and-shell`)

## Font file sizes (downloaded from https://preview.treeye.pages.dev/fonts/)

| file | expected | actual |
|---|---|---|
| `poppins-300-latin.woff2` | 7844 | 7844 |
| `poppins-500-latin.woff2` | 7740 | 7740 |
| `newsreader-400-latin.woff2` | 22504 | 22504 |

All three matched exactly on the first download; no retry needed.

## `src/App.css`

Transcribed verbatim from the brief (lines 31-530 of task-3-brief.md). Diffed byte-for-byte
against the brief's code block before running Prettier — `diff` returned no differences.
`npx prettier --write src/App.css` was then run per the brief's warning about `format:check`
covering this file; it reflowed the `h1, h2, h3, h4, h5, h6` selector list onto one selector
per line and the `--spectrum` gradient's `var(...)` arguments onto one per line. No content
was otherwise altered. `npm run format:check` passes on the Prettier-formatted file.

## Sass file check after removal

```
$ find src -name '*.scss' -o -name '*.sass'
```
returned nothing (empty output) — confirms `src/App.scss` was the only Sass file in the repo.

## `src/index.tsx`

Line 1 changed from `import './App.scss';` to `import './App.css';`. No other lines touched.

## `package.json` diff (from `npm uninstall bootstrap sass`)

```diff
--- a/package.json
+++ b/package.json
@@ -14,7 +14,6 @@
   },
   "dependencies": {
     "@sentry/react": "^10.73.0",
-    "bootstrap": "^4.6.0",
     "date-fns": "^4.4.0",
     "formik": "^2.2.6",
     "react": "^19.2.8",
@@ -76,7 +75,6 @@
     "globals": "^17.12.0",
     "jsdom": "^30.0.1",
     "prettier": "3.9.6",
-    "sass": "^1.104.0",
     "semantic-release": "^25.0.9",
     "typescript": "^6.0.3",
     "typescript-eslint": "^8.69.0",
```
`package-lock.json` updated accordingly by npm; no other dependency changed. `npm uninstall`
reported "removed 3 packages, and audited 869 packages... found 0 vulnerabilities".

## Lint / format:check / tsc / test

Command: `npm run lint && npm run format:check && npx tsc --noEmit && npm test` — exit 0.

- `npm run lint` (eslint src/): clean. Two informational lines from jsx-ast-utils
  ("The prop value with an expression type of MetaProperty could not be resolved...") printed
  but did not fail the run — this is a known upstream eslint-plugin-jsx-a11y/jsx-ast-utils
  informational message, not a lint error, and is unrelated to this change (it's about a
  MetaProperty JSX prop expression, nothing CSS/font/dependency related).
- `npm run format:check`: "All matched files use Prettier code style!"
- `npx tsc --noEmit`: no output, exit 0.
- `npm test` (vitest run --coverage): **27 test files passed (27), 257 tests passed (257)**.

Coverage (unchanged from before, as expected — no application logic changed):
```
All files          |   98.96 |    98.11 |   99.39 |   99.13 |
 src/normality/Histogram.tsx |   90.74 |       75 |      90 |      92 | 50,60-62
```
Statements 98.96% (477/482), Branches 98.11% (104/106), Functions 99.39% (163/164),
Lines 99.13% (457/461).

## `npm run build`

Succeeded (exit 0), 843 modules transformed, built in 785ms. Notably the three font files were
fingerprinted and emitted under `build/assets/` with hashed names, confirming the `src/fonts/`
(not `public/fonts/`) placement works as the brief intended:

```
build/assets/poppins-500-latin-CWICHMj6.woff2       7.74 kB
build/assets/poppins-300-latin-CAodptMY.woff2       7.84 kB
build/assets/newsreader-400-latin-DExrRRrN.woff2   22.50 kB
build/assets/index-DyO2yaki.css                     7.06 kB │ gzip:   2.26 kB
build/assets/index-u4Q0vjaG.js                    516.90 kB │ gzip: 167.35 kB │ map: 2,764.93 kB
```
A pre-existing "chunks are larger than 500 kB" warning printed; unrelated to this change (JS
bundle size, not CSS/fonts) and not something this task's scope covers.

## Anything that surprised me

- Nothing surprising: font byte sizes matched expected values exactly on the first try, the
  CSS transcription diffed clean against the brief before formatting, `npm uninstall` found
  no other dependents of `bootstrap`/`sass` to warn about, and the full verification pipeline
  (lint/format/tsc/test/build) passed clean on the first run with coverage unchanged.
- The only expected-and-documented step was running Prettier on `src/App.css` before
  `format:check`, per the brief's own warning — this reformatted the `h1..h6` selector list
  and the `--spectrum` gradient argument list to one item per line but changed no values or
  comments.

## Commit

```
git rm src/App.scss
git add -A
git commit -F - <<'EOF'
feat: adopt the Treeye design system and drop Bootstrap
...
EOF
```
(full commit message as specified in the brief, with the Opus 5 co-author trailer per this
task's global constraints)
