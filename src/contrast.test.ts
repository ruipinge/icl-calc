import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const css = readFileSync(join(__dirname, 'App.css'), 'utf8');

// The :root block holds the Treeye tokens. It is the only one; the match
// below takes the first, so a later :root cannot shadow a token here.
const root = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

const token = (name: string): string => {
  const hex = new RegExp(`${name}:\\s*(#[0-9a-f]{6})\\s*;`, 'i').exec(
    root
  )?.[1];
  if (!hex) throw new Error(`no hex value for ${name} in the first :root`);
  return hex;
};

// WCAG 2.2 relative luminance and contrast ratio.
const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// The declaration block of the rule whose selector list is exactly `selector`
// (comma-separated, any whitespace), so a longer list that merely starts with
// the same selectors cannot match.
const body = (selector: string): string => {
  const list = selector
    .split(',')
    .map((s) =>
      s
        .trim()
        .replace(/[.[\]()'*]/g, '\\$&')
        .replace(/\s+/g, '\\s+')
    )
    .join('\\s*,\\s*');
  const match = new RegExp(`(?:^|\\})\\s*${list}\\s*\\{([^}]*)\\}`, 'm').exec(
    css
  );
  if (!match) throw new Error(`no rule for ${selector}`);
  return match[1];
};

it('measures contrast as WCAG 2.2 does', () => {
  expect(contrast('#8e8598', '#ffffff')).toBeCloseTo(3.52, 2);
  expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
});

const PAIRS: [role: string, fg: string, bg: string, min: number][] = [
  ['clinical value', '--ink', '--field', 7],
  ['unit, column and row label', '--ink', '--paper', 7],
  ['histogram axis numeral', '--ink', '--paper', 7],
  ['section heading, footer', '--muted', '--paper', 4.5],
  ['placeholder', '--muted', '--field', 4.5],
  ['input boundary', '--faint', '--field', 3],
  ['tool name on the header', '--violet', '--chrome', 7],
  // it quotes the valid range of a clinical value, so it is held to 7:1
  ['validation message', '--leaf-crimson', '--paper', 7],
  // it qualifies a clinical value, so it is held to 7:1
  ['gauge band caption', '--ink', '--paper', 7],
  ['gauge zone against its paper gap', '--leaf-crimson', '--paper', 3],
  ['gauge zone against its paper gap', '--leaf-ember', '--paper', 3],
  ['gauge zone against its paper gap', '--leaf-jade', '--paper', 3]
];
it.each(PAIRS)('%s: %s on %s is at least %d:1', (_, fg, bg, min) =>
  expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min)
);

const USES: [selector: string, declaration: RegExp][] = [
  ['thead th', /(?:^|[;\s])color:\s*var\(--ink\)/],
  ['.ledger thead th', /(?:^|[;\s])color:\s*var\(--ink\)/],
  // every matrix value, a 0 included, is a clinical value at full ink
  ['.ledger td', /(?:^|[;\s])color:\s*var\(--ink\)/],
  ['.unit', /(?:^|[;\s])color:\s*var\(--ink\)/],
  ['h4', /(?:^|[;\s])color:\s*var\(--muted\)/],
  ['.site-footer', /(?:^|[;\s])color:\s*var\(--muted\)/],
  ['input::placeholder', /(?:^|[;\s])color:\s*var\(--muted\)/],
  ['input:disabled', /(?:^|[;\s])color:\s*var\(--ink\)/],
  ['.mrow-error', /(?:^|[;\s])color:\s*var\(--leaf-crimson\)/],
  ['.mrow-error', /font-family:\s*var\(--prose\)\s*;/],
  ['.gauge-band', /(?:^|[;\s])color:\s*var\(--ink\)/],
  // it carries numerals ("2.5th"), and every numeral is Newsreader
  ['.gauge-band', /font-family:\s*var\(--prose\)\s*;/],
  // at least 0.8rem, legible at clinical distance (#173)
  ['.gauge-band', /font-size:\s*0\.875rem\s*;/],
  ['.site-footer a', /text-decoration:\s*underline\s*;/],
  ['input, select', /border-bottom:\s*1px solid var\(--faint\)/],
  ['input, select', /min-height:\s*2\.75rem\s*;/],
  ['.tabs a', /min-height:\s*2\.75rem\s*;/],
  ['.btn-ghost', /min-height:\s*2\.75rem\s*;/],
  // Case-folding turns μ into Μ, so micrometres would read as millimetres.
  ['.ledger thead th', /(?:^|[;\s])text-transform:\s*none\s*;/],
  ['.regression-block h4', /(?:^|[;\s])color:\s*var\(--ink\)/],
  ['.regression-block h4', /(?:^|[;\s])text-transform:\s*none\s*;/]
];
it.each(USES)('%s uses the token its role is measured with', (sel, decl) =>
  expect(body(sel)).toMatch(decl)
);

// The chart grid's columns live in App.css hunks other work also edits, and no
// visual fixture covers 769-1200px, so a lost merge hunk would go unseen.
// `inMedia` returns what sits inside every @media block for one query (each
// closed by a `}` at column 0), since several blocks may share a breakpoint;
// `outsideMedia` is the stylesheet with every such block removed, so the
// top-level rule cannot be satisfied by a nested one.
const inMedia = (query: string): string => {
  const blocks = [
    ...css.matchAll(
      new RegExp(
        `@media \\(${query.replace(/[().]/g, '\\$&')}\\)\\s*\\{([\\s\\S]*?)\\n\\}`,
        'g'
      )
    )
  ].map((match) => match[1]);
  if (blocks.length === 0) throw new Error(`no @media (${query})`);
  return blocks.join('\n');
};
const outsideMedia = css.replace(/@media[^{]*\{[\s\S]*?\n\}/g, '');
const chartGrid = (scope: string): string => {
  const match = /^[ \t]*\.chart-grid\s*\{([^}]*)\}/m.exec(scope);
  if (!match) throw new Error('no .chart-grid rule');
  return match[1];
};

describe('the chart grid keeps its columns', () => {
  it('sets three columns by default', () =>
    expect(chartGrid(outsideMedia)).toMatch(
      /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)\s*;/
    ));
  it('sets two columns up to 75rem', () =>
    expect(chartGrid(inMedia('max-width: 75rem'))).toMatch(
      /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*;/
    ));
  it('sets one column up to 48rem', () =>
    expect(chartGrid(inMedia('max-width: 48rem'))).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*;/
    ));
});
