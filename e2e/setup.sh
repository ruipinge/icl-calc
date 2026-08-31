#!/usr/bin/env bash
set -euo pipefail

# Creates the two http-server roots playwright.config.ts expects, each with
# an `icl-calc` symlink so the served asset paths match what the respective
# build was compiled with (homepage=http://ruipinge.github.io/icl-calc means
# both the oracle and a same-homepage local build reference their assets by
# the absolute path /icl-calc/...).
#
#   e2e/.serve/icl-calc         -> the frozen oracle worktree (read-only, a
#                                  SIBLING of this repo; never written to by
#                                  this script or anything else here)
#   e2e/.serve-subject/icl-calc -> this repo's own build/ (produced by
#                                  `npm run build` under Node 16)
#
# Two separate roots, not one: reusing .serve's own `icl-calc` symlink for
# the subject build would make every asset request on the subject's port
# resolve to the oracle's files instead of the subject's - a same-path
# collision. See the comment above the `webServer` array in
# playwright.config.ts for the full reasoning.
#
# Safe to re-run - symlinks are (re)created with `ln -sfn`, directories with
# `mkdir -p`. Both are gitignored (e2e/.gitignore) and hand-run, so this is
# the only recipe for recreating them; run it before
# `npm --prefix e2e run capture` or `npm --prefix e2e run replay`.
#
# Wired to `npm --prefix e2e run setup` (see e2e/package.json).
#
# Subject-only mode: pass --subject-only, or set SUBJECT_ONLY=1, to skip the
# oracle worktree entirely and its FATAL checks below. Only the 'replay'
# project (L2, against this branch's own build) needs the subject root; the
# 'capture' and 'smoke' projects need the oracle and must keep failing loudly
# without it. This is how CI runs L2: there is no oracle worktree on a
# runner, and there must never be one - it is a read-only, hand-checked-out
# reference that is not meant to be reproduced or faked in CI (see design
# spec section 7.1). e2e/.serve is still created (empty, no icl-calc
# symlink) so playwright.config.ts's oracle webServer entry - which starts
# unconditionally regardless of which project runs - has a directory to
# serve; it is never navigated to by the 'replay' project.

SUBJECT_ONLY="${SUBJECT_ONLY:-}"
for arg in "$@"; do
  case "$arg" in
    --subject-only)
      SUBJECT_ONLY=1
      ;;
    *)
      echo "e2e/setup.sh: unrecognised argument '$arg'" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ORACLE_DIR="$SCRIPT_DIR/../../icl-calc-oracle"
BUILD_DIR="$SCRIPT_DIR/../build"

if [ -z "$SUBJECT_ONLY" ]; then
  if [ ! -d "$ORACLE_DIR" ]; then
    echo "e2e/setup.sh: FATAL - oracle worktree not found at $ORACLE_DIR" >&2
    echo "  e2e/capture.spec.ts and the 'capture'/'smoke' Playwright projects" >&2
    echo "  serve this worktree as the frozen December 2021 oracle. Check it" >&2
    echo "  out as a sibling of this repo (see design spec section 7.1) before" >&2
    echo "  running setup.sh. If you only need the L2 replay (no oracle" >&2
    echo "  required), re-run with --subject-only." >&2
    exit 1
  fi
  if [ ! -f "$ORACLE_DIR/index.html" ]; then
    echo "e2e/setup.sh: FATAL - $ORACLE_DIR exists but has no index.html." >&2
    echo "  Expected a checked-out gh-pages build there, not an empty or" >&2
    echo "  wrong worktree." >&2
    exit 1
  fi
fi

if [ ! -d "$BUILD_DIR" ]; then
  echo "e2e/setup.sh: FATAL - $BUILD_DIR not found." >&2
  echo "  e2e/replay.spec.ts (L2) replays against a real production build of" >&2
  echo "  this branch. Run 'npm run build' (Node 16) from the repo root" >&2
  echo "  first, then re-run setup.sh." >&2
  exit 1
fi
if [ ! -f "$BUILD_DIR/index.html" ]; then
  echo "e2e/setup.sh: FATAL - $BUILD_DIR exists but has no index.html." >&2
  echo "  Looks like an incomplete or stale build/. Re-run 'npm run build'." >&2
  exit 1
fi

mkdir -p "$SCRIPT_DIR/.serve" "$SCRIPT_DIR/.serve-subject"
if [ -z "$SUBJECT_ONLY" ]; then
  ln -sfn ../../../icl-calc-oracle "$SCRIPT_DIR/.serve/icl-calc"
fi
ln -sfn ../../build "$SCRIPT_DIR/.serve-subject/icl-calc"

echo "e2e/setup.sh: OK"
if [ -z "$SUBJECT_ONLY" ]; then
  echo "  .serve/icl-calc         -> $(readlink "$SCRIPT_DIR/.serve/icl-calc")"
else
  echo "  .serve/icl-calc         -> (skipped: --subject-only, no oracle symlink)"
fi
echo "  .serve-subject/icl-calc -> $(readlink "$SCRIPT_DIR/.serve-subject/icl-calc")"
