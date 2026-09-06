// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');

const MARKER = '<!-- coverage-comment -->';

/**
 * Posts (or updates) the coverage comment on a pull request.
 *
 * This is reporting only. The gate is `test.coverage.thresholds` in
 * vite.config.ts, which fails the test step before this ever runs - so
 * nothing here decides whether a PR can merge, and this file must never
 * grow a `core.setFailed`.
 *
 * Both this and vite.config.ts read the SAME thresholds file. That is the
 * point of the file existing: an earlier version of this script hardcoded
 * its own copy of the numbers, so the comment could have gone on cheerfully
 * reporting "ok" against stale floors while CI failed against the real
 * ones - or worse, the reverse.
 *
 * @param {{ github: any, context: any, core: any }} args
 *   The objects actions/github-script injects.
 */
module.exports = async ({ github, context, core }) => {
  const root = process.env.GITHUB_WORKSPACE || process.cwd();

  // Deliberately NOT wrapped in a try/catch, unlike the coverage read
  // below. A missing coverage summary means the suite died first, which is
  // already reported; a missing thresholds file means this repo is
  // misconfigured, and silently posting a comment with no floors in it
  // would hide that.
  const thresholds = JSON.parse(
    fs.readFileSync(path.join(root, 'coverage-thresholds.json'), 'utf8')
  );

  let total;
  try {
    total = JSON.parse(
      fs.readFileSync(
        path.join(root, 'coverage', 'coverage-summary.json'),
        'utf8'
      )
    ).total;
  } catch (error) {
    // The suite can fail before coverage is written at all. Say so rather
    // than failing this step and turning one red signal into two.
    core.warning(`No coverage summary to report: ${error.message}`);
    return;
  }

  const rows = Object.keys(thresholds).map((metric) => {
    const measured = total[metric].pct;
    const floor = thresholds[metric];
    const verdict = measured >= floor ? 'ok' : '**under**';
    return `| ${metric} | ${measured}% | ${floor}% | ${verdict} |`;
  });

  const body = [
    MARKER,
    '## Coverage',
    '',
    '| | measured | floor | |',
    '| --- | ---: | ---: | :---: |',
    ...rows,
    '',
    'Floors live in `coverage-thresholds.json`, read by both `vite.config.ts`',
    '(where they fail CI) and this comment. Raise them when coverage improves;',
    'lowering one belongs in a PR description, not a quiet edit.'
  ].join('\n');

  const { owner, repo } = context.repo;
  const issue_number = context.issue.number;

  // Update the existing comment rather than adding one per push - a
  // long-running PR would otherwise accumulate a wall of them.
  const existing = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number
  });
  const mine = existing.find((comment) => comment.body.includes(MARKER));

  if (mine) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: mine.id,
      body
    });
    return;
  }

  await github.rest.issues.createComment({ owner, repo, issue_number, body });
};
