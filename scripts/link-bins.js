#!/usr/bin/env node
/**
 * Repair script: recreate node_modules/.bin symlinks after `npm ci`.
 *
 * Why this exists:
 * package-lock.json is lockfileVersion 2 but has no top-level "packages"
 * object (only the legacy "dependencies" tree). Modern npm (8/10.x) reads
 * each dependency's `bin` metadata from that "packages" object to decide
 * what to link into node_modules/.bin. Without it, `npm ci` completes
 * without error but links ZERO bins - so commands like `eslint` and
 * `react-scripts` are "command not found" even though the packages are
 * physically present in node_modules.
 *
 * We can't fix this by regenerating the lockfile: it pins the exact 2022
 * dependency tree the golden-master safety net was verified against, and
 * re-resolving the `^` ranges would change that tree. Phase 3a replaces
 * the lockfile wholesale and this script becomes unnecessary at that point.
 *
 * This script walks node_modules, reads each package's own package.json
 * `bin` field (string or object form, including scoped @org/pkg packages),
 * and creates the missing symlinks in node_modules/.bin itself. It is
 * idempotent: existing files/symlinks are left alone and any errors while
 * linking a single package are swallowed so one bad entry can't stop the
 * rest.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'node_modules');
const bin = path.join(root, '.bin');
fs.mkdirSync(bin, { recursive: true });

const link = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name === '.bin') continue;
    const p = path.join(dir, e.name);
    if (e.name.startsWith('@')) {
      link(p);
      continue;
    }
    const pj = path.join(p, 'package.json');
    if (!fs.existsSync(pj)) continue;
    let m;
    try {
      m = JSON.parse(fs.readFileSync(pj, 'utf8'));
    } catch (_) {
      continue;
    }
    let b = m.bin;
    if (typeof b === 'string') b = { [String(m.name).split('/').pop()]: b };
    if (b && typeof b === 'object') {
      for (const n of Object.keys(b)) {
        const target = path.join(p, b[n]);
        if (!fs.existsSync(target)) continue;
        const linkPath = path.join(bin, n);
        if (fs.existsSync(linkPath)) continue; // already linked - idempotent
        try {
          fs.symlinkSync(path.relative(bin, target), linkPath);
          fs.chmodSync(target, 0o755);
        } catch (_) {
          // best-effort: skip packages we can't link
        }
      }
    }
  }
};

link(root);
