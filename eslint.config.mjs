// Flat config replacing eslint-config-react-app (CRA, unmaintained, the last
// CRA remnant in this repo). Every plugin used is named explicitly here.
//
// The `rules` block below is a verbatim transcription of the rules that were
// active under the old eslintrc config (captured via
// `eslint --print-config src/db.ts` before this migration - see
// .superpowers/sdd/2026-09-06-phase-63-eslint/before-source.json), minus:
//   - the three `flowtype/*` rules (no Flow in this project)
//   - `prettier/prettier` (Prettier now runs as its own check - see
//     `npm run format` / `npm run format:check` - decoupling its version
//     from ESLint entirely, per #76)
// This is deliberate: the point of this migration is to prove no rule was
// silently dropped, not to redesign the rule set.
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import testingLibrary from 'eslint-plugin-testing-library';
import vitest from '@vitest/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['build/**', 'coverage/**', 'node_modules/**', 'e2e/**']
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...globals.browser
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin
    },
    settings: {
      react: {
        // React 19 - no fixed version to hardcode against.
        version: 'detect'
      }
    },
    rules: {
      // --- core (68) ---
      'array-callback-return': ['warn'],
      'dot-location': ['warn', 'property'],
      eqeqeq: ['warn', 'smart'],
      'getter-return': ['warn'],
      'new-parens': ['warn'],
      'no-caller': ['warn'],
      'no-cond-assign': ['warn', 'except-parens'],
      'no-const-assign': ['warn'],
      'no-control-regex': ['warn'],
      'no-delete-var': ['warn'],
      'no-dupe-args': ['warn'],
      'no-dupe-keys': ['warn'],
      'no-duplicate-case': ['warn'],
      'no-empty-character-class': ['warn'],
      'no-empty-pattern': ['warn'],
      'no-eval': ['warn'],
      'no-ex-assign': ['warn'],
      'no-extend-native': ['warn'],
      'no-extra-bind': ['warn'],
      'no-extra-label': ['warn'],
      'no-fallthrough': ['warn'],
      'no-func-assign': ['warn'],
      'no-implied-eval': ['warn'],
      'no-invalid-regexp': ['warn'],
      'no-iterator': ['warn'],
      'no-label-var': ['warn'],
      'no-labels': ['warn', { allowLoop: true, allowSwitch: false }],
      'no-lone-blocks': ['warn'],
      'no-loop-func': ['warn'],
      'no-mixed-operators': [
        'warn',
        {
          groups: [
            ['&', '|', '^', '~', '<<', '>>', '>>>'],
            ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
            ['&&', '||'],
            ['in', 'instanceof']
          ],
          allowSamePrecedence: false
        }
      ],
      'no-multi-str': ['warn'],
      'no-native-reassign': ['warn'],
      'no-negated-in-lhs': ['warn'],
      'no-new-func': ['warn'],
      'no-new-object': ['warn'],
      'no-new-symbol': ['warn'],
      'no-new-wrappers': ['warn'],
      'no-obj-calls': ['warn'],
      'no-octal': ['warn'],
      'no-octal-escape': ['warn'],
      'no-regex-spaces': ['warn'],
      'no-restricted-globals': [
        'error',
        'addEventListener',
        'blur',
        'close',
        'closed',
        'confirm',
        'defaultStatus',
        'defaultstatus',
        'event',
        'external',
        'find',
        'focus',
        'frameElement',
        'frames',
        'history',
        'innerHeight',
        'innerWidth',
        'length',
        'location',
        'locationbar',
        'menubar',
        'moveBy',
        'moveTo',
        'name',
        'onblur',
        'onerror',
        'onfocus',
        'onload',
        'onresize',
        'onunload',
        'open',
        'opener',
        'opera',
        'outerHeight',
        'outerWidth',
        'pageXOffset',
        'pageYOffset',
        'parent',
        'print',
        'removeEventListener',
        'resizeBy',
        'resizeTo',
        'screen',
        'screenLeft',
        'screenTop',
        'screenX',
        'screenY',
        'scroll',
        'scrollbars',
        'scrollBy',
        'scrollTo',
        'scrollX',
        'scrollY',
        'self',
        'status',
        'statusbar',
        'stop',
        'toolbar',
        'top'
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'require',
          property: 'ensure',
          message:
            'Please use import() instead. More info: https://facebook.github.io/create-react-app/docs/code-splitting'
        },
        {
          object: 'System',
          property: 'import',
          message:
            'Please use import() instead. More info: https://facebook.github.io/create-react-app/docs/code-splitting'
        }
      ],
      'no-restricted-syntax': ['warn', 'WithStatement'],
      'no-script-url': ['warn'],
      'no-self-assign': ['warn'],
      'no-self-compare': ['warn'],
      'no-sequences': ['warn'],
      'no-shadow-restricted-names': ['warn'],
      'no-sparse-arrays': ['warn'],
      'no-template-curly-in-string': ['warn'],
      'no-this-before-super': ['warn'],
      'no-throw-literal': ['warn'],
      'no-unreachable': ['warn'],
      'no-unused-labels': ['warn'],
      'no-useless-computed-key': ['warn'],
      'no-useless-concat': ['warn'],
      'no-useless-escape': ['warn'],
      'no-useless-rename': [
        'warn',
        { ignoreDestructuring: false, ignoreImport: false, ignoreExport: false }
      ],
      'no-whitespace-before-property': ['warn'],
      'no-with': ['warn'],
      'require-yield': ['warn'],
      'rest-spread-spacing': ['warn', 'never'],
      // Carried verbatim - every import block in this repo is ordered to
      // this exact rule; changing the options churns every file.
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: false,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: false
        }
      ],
      strict: ['warn', 'never'],
      'unicode-bom': ['warn', 'never'],
      'use-isnan': ['warn'],
      'valid-typeof': ['warn'],

      // --- react (14) ---
      'react/forbid-foreign-prop-types': ['warn', { allowInPropTypes: true }],
      'react/jsx-no-comment-textnodes': ['warn'],
      'react/jsx-no-duplicate-props': ['warn'],
      'react/jsx-no-target-blank': ['warn'],
      'react/jsx-no-undef': ['error'],
      'react/jsx-pascal-case': ['warn', { allowAllCaps: true, ignore: [] }],
      'react/jsx-uses-react': ['warn'],
      'react/jsx-uses-vars': ['warn'],
      'react/no-danger-with-children': ['warn'],
      'react/no-direct-mutation-state': ['warn'],
      'react/no-is-mounted': ['warn'],
      'react/no-typos': ['error'],
      'react/require-render-return': ['error'],
      'react/style-prop-object': ['warn'],

      // --- react-hooks (2) ---
      // v7 ships React Compiler rules under `recommended`; those are not
      // wanted here, so the two rules this project actually had are named
      // explicitly instead of spreading a preset.
      'react-hooks/exhaustive-deps': ['warn'],
      'react-hooks/rules-of-hooks': ['error'],

      // --- jsx-a11y (17) ---
      'jsx-a11y/alt-text': ['warn'],
      'jsx-a11y/anchor-has-content': ['warn'],
      'jsx-a11y/anchor-is-valid': ['warn', { aspects: ['noHref', 'invalidHref'] }],
      'jsx-a11y/aria-activedescendant-has-tabindex': ['warn'],
      'jsx-a11y/aria-props': ['warn'],
      'jsx-a11y/aria-proptypes': ['warn'],
      'jsx-a11y/aria-role': ['warn', { ignoreNonDOM: true }],
      'jsx-a11y/aria-unsupported-elements': ['warn'],
      'jsx-a11y/heading-has-content': ['warn'],
      'jsx-a11y/iframe-has-title': ['warn'],
      'jsx-a11y/img-redundant-alt': ['warn'],
      'jsx-a11y/no-access-key': ['warn'],
      'jsx-a11y/no-distracting-elements': ['warn'],
      'jsx-a11y/no-redundant-roles': ['warn'],
      'jsx-a11y/role-has-required-aria-props': ['warn'],
      'jsx-a11y/role-supports-aria-props': ['warn'],
      'jsx-a11y/scope': ['warn'],

      // --- @typescript-eslint (7) ---
      '@typescript-eslint/consistent-type-assertions': ['warn'],
      '@typescript-eslint/no-array-constructor': ['warn'],
      '@typescript-eslint/no-redeclare': ['warn'],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
          enforceForJSX: false
        }
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { args: 'none', ignoreRestSiblings: true }
      ],
      '@typescript-eslint/no-use-before-define': [
        'warn',
        { functions: false, classes: false, variables: false, typedefs: false }
      ],
      '@typescript-eslint/no-useless-constructor': ['warn'],

      // --- import (4) ---
      'import/first': ['error'],
      'import/no-amd': ['error'],
      'import/no-anonymous-default-export': ['warn'],
      'import/no-webpack-loader-syntax': ['error']
    }
  },
  {
    // The project sets `test.globals: true` in vite.config.ts, so
    // describe/it/expect/vi/... are ambient in test files and would
    // otherwise all report no-undef.
    files: ['src/**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.vitest
      }
    }
  },
  {
    // Test-file rules — the actual point of #63. Under the old
    // `eslint-config-react-app`, `react-app/jest` supplied `jest/*` rules,
    // but they were never wired to anything test-file-scoped (see
    // established fact #4: zero jest/testing-library rules were ever
    // active). This block replaces that dead configuration with two
    // runner-appropriate plugins, restricted to test files only.
    files: ['src/**/*.{test,spec}.{ts,tsx}'],
    plugins: {
      vitest,
      'testing-library': testingLibrary
    },
    rules: {
      // `@vitest/eslint-plugin` recommended - the Vitest-native replacement
      // for the `jest/*` rules `react-app/jest` used to define. Mapping
      // from the old jest rule set, deliberately:
      //   jest/no-conditional-expect        -> vitest/no-conditional-expect (direct)
      //   jest/no-identical-title           -> vitest/no-identical-title (direct)
      //   jest/no-interpolation-in-snapshots -> vitest/no-interpolation-in-snapshots (direct)
      //   jest/no-mocks-import              -> vitest/no-mocks-import (direct)
      //   jest/valid-describe               -> vitest/valid-describe-callback (renamed equivalent)
      //   jest/valid-expect                 -> vitest/valid-expect (direct)
      //   jest/valid-expect-in-promise      -> vitest/valid-expect-in-promise (direct)
      //   jest/valid-title                  -> vitest/valid-title (direct)
      //   jest/no-jasmine-globals           -> no equivalent, dropped: Jasmine globals
      //     are a Jest-runner concept (Jest's Jasmine-compat layer); Vitest has no
      //     Jasmine compatibility layer, so the condition the rule checks for
      //     cannot occur here.
      //   jest/no-jest-import               -> no equivalent, dropped: that rule bans
      //     `import jest from 'jest'` because Jest globals are ambient; under Vitest,
      //     `import { vi } from 'vitest'` is the normal, encouraged way to reach the
      //     mocking API, so an inverse rule would be actively wrong here.
      // `recommended` also adds rules the old jest set never had -
      // notably `vitest/expect-expect`, which is exactly the shape of bug
      // this task found by hand (a test with no assertion in its body).
      ...vitest.configs.recommended.rules,
      // `eslint-plugin-testing-library`, `flat/react` preset - these lint
      // DOM Testing Library usage and are runner-agnostic, so they map
      // directly rather than needing per-rule translation.
      // `no-dom-import` is configured `['error', 'react']` by this preset,
      // as called out in the brief.
      ...testingLibrary.configs['flat/react'].rules
    }
  },
  // Last, so it can turn off stylistic rules that would fight Prettier.
  prettierConfig
];
