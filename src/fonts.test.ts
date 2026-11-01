import { join, relative } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

import { brotliDecompressSync } from 'node:zlib';
import ts from 'typescript';

/*
 * #193: every character the app renders must be in a self-hosted font of the
 * stack that sets it. Neither the Poppins nor the Newsreader subset has the
 * Greek mu (U+03BC) of "μm", so for years every "μm" was drawn by whatever
 * system font came next in the stack. Nothing failed; it just looked wrong.
 *
 * This reads the served WOFF2 files' cmap tables and the font stacks in
 * App.css, collects the characters in every string literal and JSX text in
 * src/, and holds each stack to all of them. The browser picks one face per
 * family, by weight, and falls back glyph by glyph to the next family, never
 * to another weight of the same one. So a family covers a character only when
 * every one of its weights has it, and a stack when one of its families does.
 */

const SRC = __dirname;
const css = readFileSync(join(SRC, 'App.css'), 'utf8');

// ---------------------------------------------------------------- WOFF2 cmap

/* UIntBase128, WOFF2 section 4.1. */
const readBase128 = (
  buf: Buffer,
  offset: number
): { value: number; next: number } => {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const byte = buf[offset + i];
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) return { value, next: offset + i + 1 };
  }
  throw new Error('bad UIntBase128');
};

// Known-tag indices (WOFF2 section 5.1) that matter here.
const CMAP = 0;
const GLYF = 10;
const LOCA = 11;

/* One WOFF2 table directory entry (section 5.2): its tag and stored length. */
const readEntry = (
  file: Buffer,
  pos: number
): { tag: number; length: number; next: number } => {
  const flags = file[pos];
  const tag = flags & 0x3f;
  const version = flags >> 6;
  // An arbitrary tag (0x3f) carries four tag bytes; it is never cmap.
  const orig = readBase128(file, pos + 1 + (tag === 0x3f ? 4 : 0));
  // glyf and loca are transformed unless version 3; the rest unless version 0.
  const transformed =
    tag === GLYF || tag === LOCA ? version !== 3 : version !== 0;
  if (!transformed) return { tag, length: orig.value, next: orig.next };
  const stored = readBase128(file, orig.next);
  return { tag, length: stored.value, next: stored.next };
};

/*
 * The cmap table of a WOFF2 file. Tables sit in the decompressed stream in
 * directory order, unpadded, each at its transformed length where it has one
 * (only glyf, loca and hmtx can be transformed; cmap never is).
 */
const woff2Cmap = (file: Buffer): Buffer => {
  if (file.toString('latin1', 0, 4) !== 'wOF2') throw new Error('not WOFF2');
  const entries = [];
  let pos = 48;
  for (let t = file.readUInt16BE(12); t > 0; t--) {
    const entry = readEntry(file, pos);
    entries.push(entry);
    pos = entry.next;
  }
  const index = entries.findIndex((e) => e.tag === CMAP);
  if (index === -1) throw new Error('no cmap');
  const offset = entries.slice(0, index).reduce((sum, e) => sum + e.length, 0);
  return brotliDecompressSync(file.subarray(pos)).subarray(
    offset,
    offset + entries[index].length
  );
};

/* The characters one format 4 segment maps to a real glyph (not glyph 0). */
const segment = (cmap: Buffer, at: number, s: number): number[] => {
  const segs = cmap.readUInt16BE(at + 6) / 2;
  const endAt = at + 14 + s * 2;
  const startAt = endAt + segs * 2 + 2;
  const deltaAt = startAt + segs * 2;
  const rangeAt = deltaAt + segs * 2;
  const end = Math.min(cmap.readUInt16BE(endAt), 0xfffe);
  const start = cmap.readUInt16BE(startAt);
  const delta = cmap.readInt16BE(deltaAt);
  const range = cmap.readUInt16BE(rangeAt);
  const glyph = (c: number): number =>
    range === 0
      ? (c + delta) & 0xffff
      : cmap.readUInt16BE(rangeAt + range + (c - start) * 2);
  return Array.from(
    { length: Math.max(0, end - start + 1) },
    (_, i) => start + i
  ).filter((c) => glyph(c) !== 0);
};

/*
 * Every code point mapped by a cmap's format 4 subtables. The subsets are all
 * Basic Multilingual Plane, so format 4 holds everything; a character beyond
 * it would be reported missing, loudly, not passed.
 */
const codepoints = (cmap: Buffer): Set<number> => {
  const offsets = Array.from({ length: cmap.readUInt16BE(2) }, (_, i) =>
    cmap.readUInt32BE(8 + i * 8)
  ).filter((at) => cmap.readUInt16BE(at) === 4);
  return new Set(
    [...new Set(offsets)].flatMap((at) =>
      Array.from({ length: cmap.readUInt16BE(at + 6) / 2 }, (_, s) =>
        segment(cmap, at, s)
      ).flat()
    )
  );
};

const cmapOf = (file: string): Set<number> =>
  codepoints(woff2Cmap(readFileSync(join(SRC, file))));

// ------------------------------------------------------------ App.css stacks

/* The self-hosted files of each family, from App.css's @font-face rules. */
const faces = new Map<string, string[]>();
const weights: [url: string, weight: string][] = [];
for (const [, rule] of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
  const family = /font-family:\s*'([^']+)'/.exec(rule)?.[1];
  const url = /url\('\.\/([^']+)'\)/.exec(rule)?.[1];
  const weight = /font-weight:\s*(\d+)\s*;/.exec(rule)?.[1];
  if (!family || !url || !weight) {
    throw new Error(`unreadable @font-face: ${rule}`);
  }
  faces.set(family, [...(faces.get(family) ?? []), url]);
  weights.push([url, weight]);
}

const root = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
const stack = (token: string): string[] => {
  const value = new RegExp(`${token}:\\s*([^;]+);`).exec(root)?.[1];
  if (!value) throw new Error(`no ${token} in :root`);
  return value.split(',').map((f) => f.trim().replace(/^'|'$/g, ''));
};

/* The characters every one of these sets has. */
const shared = (sets: Set<number>[]): Set<number> =>
  sets.length === 0
    ? new Set()
    : new Set([...sets[0]].filter((cp) => sets.every((s) => s.has(cp))));

/* What a family draws at every weight: the characters all its faces share. */
const family = (name: string): Set<number> =>
  shared((faces.get(name) ?? []).map(cmapOf));

/* What a stack can draw from its self-hosted families. */
const covered = (families: string[]): Set<number> =>
  new Set(families.flatMap((name) => [...family(name)]));

// ---------------------------------------------------- what the app renders

const sources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) &&
      !/\.(test|render\.test)\.tsx?$/.test(entry.name) &&
      !entry.name.endsWith('.d.ts') &&
      entry.name !== 'setupTests.ts'
      ? [path]
      : [];
  });

/* The text of every string literal, template piece and JSX text in a file. */
const strings = (path: string, text = readFileSync(path, 'utf8')): string[] => {
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node) ||
      ts.isJsxText(node)
    ) {
      out.push(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return out;
};

/* Each non-ASCII character in src/'s strings, with one file that uses it. */
const used = new Map<number, string>();
const all: string[] = [];
for (const path of sources(SRC)) {
  for (const text of strings(path)) {
    all.push(text);
    for (const char of text) {
      const cp = char.codePointAt(0)!;
      if (cp > 0x7e && !used.has(cp)) used.set(cp, relative(SRC, path));
    }
  }
}

// Printable ASCII is always required: a user can type any of it into a field.
const PRINTABLE_ASCII = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) =>
  String.fromCodePoint(0x20 + i)
).join('');

const missingFrom = (have: Set<number>, text: string): string[] =>
  [...new Set(text)]
    .filter((char) => !have.has(char.codePointAt(0)!))
    .map(
      (char) =>
        `U+${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')} ${char}`
    );

const missing = (families: string[], text: string): string[] =>
  missingFrom(covered(families), text);

const hasEntity = (text: string): boolean =>
  /&(#\d+|#x[\da-f]+|[a-z]+\d*);/i.test(text);

const usedText = [...used.keys()]
  .map((cp) => String.fromCodePoint(cp))
  .join('');

// ------------------------------------------------------------------- tests

describe('the WOFF2 cmap reader', () => {
  /*
   * A hand-built format 4 cmap: 'A' and 'B' in one segment through the glyph
   * array, where 'B' maps to glyph 0 (no glyph), then the 0xFFFF terminator.
   */
  it('skips a character mapped to glyph 0', () => {
    const words = [
      ...[0, 1, 3, 1, 0, 12], // header and one (3, 1) record at offset 12
      ...[4, 36, 0, 4, 4, 1, 0], // format 4, 36 bytes, two segments
      ...[0x42, 0xffff, 0], // end codes, pad
      ...[0x41, 0xffff], // start codes
      ...[0, 1], // deltas
      ...[4, 0], // range offsets: segment 0 reads the glyph array
      ...[7, 0] // glyph array: A -> 7, B -> 0
    ];
    const cmap = Buffer.alloc(words.length * 2);
    words.forEach((w, i) => cmap.writeUInt16BE(w, i * 2));
    expect([...codepoints(cmap)]).toEqual([0x41]);
  });

  it('reads the mu that Inter has and Newsreader lacks', () => {
    expect(cmapOf('fonts/inter-400-latin.woff2').has(0x03bc)).toBe(true);
    expect(cmapOf('fonts/newsreader-400-latin.woff2').has(0x03bc)).toBe(false);
  });

  it('reads every printable ASCII character from each subset', () => {
    for (const files of faces.values()) {
      for (const file of files) {
        expect(missingFrom(cmapOf(file), PRINTABLE_ASCII)).toEqual([]);
      }
    }
  });
});

describe('the strings the app renders', () => {
  it('are read from every kind of string node', () =>
    expect(
      strings(
        'fixture.tsx',
        // source code under test, so its template is written as a string
        // eslint-disable-next-line no-template-curly-in-string
        'const a = "lit"; const b = `head${1}mid${2}tail`; const c = `plain`; const d = <p>jsx</p>;'
      )
    ).toEqual(['lit', 'head', 'mid', 'tail', 'plain', 'jsx']));

  it('include the mu of "μm"', () => expect(used.has(0x03bc)).toBe(true));

  /*
   * JSX text keeps entities as written ("&micro;"), so a character written
   * as one would escape the check above. None are used; keep it that way.
   */
  it('write no character as an HTML entity', () =>
    expect(all.filter(hasEntity)).toEqual([]));

  it('would notice an entity', () => {
    expect(hasEntity('12&micro;m')).toBe(true);
    expect(hasEntity('&#956;m')).toBe(true);
    expect(hasEntity('a & b; c')).toBe(false);
    expect(hasEntity('AT&T')).toBe(false);
  });
});

/*
 * One weight lacking a character is enough to lose it: the browser will not
 * borrow it from the family's other weight.
 */
it('credits a family only with what all its weights have', () =>
  expect([...shared([new Set([1, 2]), new Set([2, 3])])]).toEqual([2]));

describe.each(['--display', '--prose', '--numeric'])(
  'the %s stack',
  (token) => {
    it('starts with a self-hosted face', () => {
      expect(faces.has(stack(token)[0])).toBe(true);
    });

    it('draws every character src/ renders from its self-hosted faces', () => {
      expect(missing(stack(token), PRINTABLE_ASCII + usedText)).toEqual([]);
    });
  }
);

/*
 * The proof that the check above can fail: the stack the app shipped before
 * #193, Newsreader alone, misses the mu of every "μm".
 */
it('would have caught the mu falling back from Newsreader', () => {
  expect(missing(['Newsreader'], PRINTABLE_ASCII + usedText)).toContain(
    'U+03BC μ'
  );
});

/*
 * The reader agrees with fontTools: these are the sizes of each subset's
 * cmap as `TTFont(path).getBestCmap()` reports them (fontTools 4.68.0).
 */
it.each([
  ['fonts/inter-400-latin.woff2', 216],
  ['fonts/inter-500-latin.woff2', 216],
  ['fonts/newsreader-400-latin.woff2', 224],
  ['fonts/poppins-300-latin.woff2', 217],
  ['fonts/poppins-500-latin.woff2', 217]
])('reads all of %s (%d characters)', (file, size) =>
  expect(cmapOf(file).size).toBe(size)
);

// ------------------------------------------------------------- the roles

/* The declaration block of the rule whose selector list is exactly this. */
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

/*
 * #193's scope: what is set in the numeric face, tabular and with ss02.
 * `.unit` is the one exception to tabular-nums: a unit has no digits.
 */
describe.each([
  // the base rule for both; `select` then takes --display, as it holds words
  ['input, select', true],
  ['tbody td, tbody th.numeric', true],
  ['.mrow-error', true],
  ['.ledger-summary', true],
  ['.unit', false]
])('%s', (selector, tabular) => {
  it('is set in the numeric face with ss02', () => {
    expect(body(selector)).toMatch(/font-family:\s*var\(--numeric\)\s*;/);
    expect(body(selector)).toMatch(/font-feature-settings:\s*'ss02'\s*;/);
  });

  if (tabular) {
    it('has tabular digits', () =>
      expect(body(selector)).toMatch(
        /font-variant-numeric:\s*tabular-nums\s*;/
      ));
  }
});

it('puts the numeric face first in its own stack', () =>
  expect(stack('--numeric')[0]).toBe('Inter'));

// The rule for `select` alone, not the `input,\nselect` list above it.
it('sets a select, which holds words, in --display', () =>
  expect(/\}\s*select\s*\{([^}]*)\}/.exec(css)?.[1]).toMatch(
    /font-family:\s*var\(--display\)\s*;/
  ));

/* Where in App.css a rule starts, for the cascade order of equal selectors. */
const position = (selector: string): number =>
  css.indexOf(`${body(selector)}}`);

/*
 * `tbody th.numeric` and `tbody th[scope='row']` are equally specific, so the
 * numeric face wins only from the later rule.
 */
it('sets a numeric row header after the row-header rule, so it wins', () =>
  expect(position('tbody td, tbody th.numeric')).toBeGreaterThan(
    position("tbody th[scope='row']")
  ));

/* Each face is the file of its weight, so no weight is served the wrong one. */
it.each(weights)('serves %s at weight %s', (url, weight) =>
  expect(url).toMatch(new RegExp(`-${weight}-`))
);
