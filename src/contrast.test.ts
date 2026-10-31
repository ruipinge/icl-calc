import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const css = readFileSync(join(__dirname, 'App.css'), 'utf8');

// The first :root block holds the Treeye tokens; the second is the Bootstrap shim.
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
  ['section heading, footer', '--muted', '--paper', 4.5],
  ['placeholder', '--muted', '--field', 4.5],
  ['input boundary', '--faint', '--field', 3],
  ['tool name on the header', '--violet', '--chrome', 7],
  // it quotes the valid range of a clinical value, so it is held to 7:1
  ['validation message', '--leaf-crimson', '--paper', 7],
  ['gauge zone against its paper gap', '--leaf-crimson', '--paper', 3],
  ['gauge zone against its paper gap', '--leaf-ember', '--paper', 3],
  ['gauge zone against its paper gap', '--leaf-jade', '--paper', 3]
];
it.each(PAIRS)('%s: %s on %s is at least %d:1', (_, fg, bg, min) =>
  expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min)
);

const USES: [selector: string, declaration: RegExp][] = [
  ['thead th', /(?:^|[;\s])color:\s*var\(--ink\)/],
  ['.unit', /(?:^|[;\s])color:\s*var\(--ink\)/],
  ['h4', /(?:^|[;\s])color:\s*var\(--muted\)/],
  ['.site-footer', /(?:^|[;\s])color:\s*var\(--muted\)/],
  ['input::placeholder', /(?:^|[;\s])color:\s*var\(--muted\)/],
  ['input:disabled', /(?:^|[;\s])color:\s*var\(--ink\)/],
  ['.mrow-error', /(?:^|[;\s])color:\s*var\(--leaf-crimson\)/],
  ['.mrow-error', /font-family:\s*var\(--prose\)\s*;/],
  ['.site-footer a', /text-decoration:\s*underline\s*;/],
  ['input, select', /border-bottom:\s*1px solid var\(--faint\)/],
  ['input, select', /min-height:\s*2\.75rem\s*;/],
  ['.tabs a', /min-height:\s*2\.75rem\s*;/],
  ['.btn-ghost', /min-height:\s*2\.75rem\s*;/]
];
it.each(USES)('%s uses the token its role is measured with', (sel, decl) =>
  expect(body(sel)).toMatch(decl)
);
