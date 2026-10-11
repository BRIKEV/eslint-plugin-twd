# Roadmap

What is planned after 0.1.0, and the decisions already made about it. The
released rules are documented in [docs/rules](docs/rules/); this file is only
about what does not exist yet.

The bar for every item: **zero false positives on real TWD tests**. A rule
must check a fact visible in the source, not guess at intent. A rule that
fires on correct code gets switched off, and then it protects nothing.

## Corpus test

`tests/corpus.test.ts`: run `recommended` over copies of real TWD tests (about
100 files from the BRIKEV example repos: React, Vue, Angular, Solid, Svelte,
Nuxt, plain JS) and expect no errors, then run it with `--fix` and expect the
files to still parse and lint clean. Every report is either a real bug (fix the
copy) or a false positive (fix the rule).

A first run found real bugs in `twd-cli/test-example-app` (67 un-awaited
`twd.mockRequest`, 9 top-level `describe`s), `demo-solution` (2 un-awaited
`twd.url().should`) and the `twd` and `twd-relay` example apps (missing
`await`s). Those copies need fixing before the corpus is green.

## Component test rules

A file is a **component test** when it imports `render` from a
`@testing-library/*` package. Open question: do some TWD tests import `render`
for another reason?

- **`twd/no-screendom-in-component-tests`** (error): any `screenDom.*` call in a
  component test. `render()` mounts outside the app root that `screenDom` is
  scoped to, so the query never finds the component. Use Testing Library's
  `screen` or `screenDomGlobal`.
- **`twd/component-test-cleanup`** (error), in a component test:
  1. a `render(...)` call without `container: componentHost()`;
  2. a file with `render(...)` but no `afterEach` calling both `cleanup()` and
     `restorePage()`;
  3. `cleanup()` or `restorePage()` called in `beforeEach` instead.

  The component host detaches the app root and renders into a blank div;
  `restorePage()` puts the app back. Without it, every flow test after the file
  sees a blank page. See the twd docs, "Component Testing".

## More rules and a `strict` config

`strict` = `recommended` plus the opt-in rules. Noisy rules stay out of
`recommended`: the counts below are from the BRIKEV example repos.

| Rule | Reports | Where |
|---|---|---|
| `twd/no-actions-in-waitfor` | a `userEvent.*` call inside a `twd.waitFor` callback, which repeats on every retry | recommended, error |
| `twd/no-node-apis` | imports of `fs`, `path`, `child_process`, `node:*`: tests run in the browser | recommended, error |
| `twd/mock-request-options` | `body:`, `headers:` or positional arguments in `twd.mockRequest`. TypeScript catches these; this covers JavaScript projects | recommended, error |
| `twd/prefer-string-url` | `urlRegex: true` with a regex that has no dynamic part (`/^\/api\/users$/`) | recommended, warn |
| `twd/no-wait` | `twd.wait(ms)`; prefer `twd.waitFor` or a `findBy*` query | strict only: 38 uses in the example repos |
| `twd/prefer-find-by` | `screenDom.getBy*` where `findBy*` would wait. A suggestion, never an autofix (it needs an `await`) | strict only: 104 `getByText` uses, most of them correct |

## TWD integration (towards 1.0.0)

- **twd-ai `twd` skill:** in the self-check after the type check, lint the
  files written (`npx twd-lint <files>`, which works with or without
  ESLint in the project). Then remove the "Mistakes the type checker will not catch" list from
  `references/test-writing.md`, and the same prose repeated in the other skills.
- **twd-ai `setup` skill:** add `twd.configs.recommended` to an existing ESLint
  config, or record `npx twd-lint` as the lint command in `twd-patterns.md`.
- **twd docs:** a "Linting" page under Core Concepts.
- **twd-ai evals:** a case that writes a test with planted mistakes and checks
  the skill fixes them after linting.

1.0.0 comes after this integration has run on real projects for a while: from
then on, a rule reporting more than before is a breaking change.

## Decided against

- **`single-top-level-describe` in `recommended`**: it shipped as an error in
  0.1.x on the belief that several top-level `describe`s break the runner. They
  do not: the runner treats them like several files. Scanning real projects
  found 44 reports in 4 repos, all on working tests. It stays available as an
  opt-in style rule.

- **`mock-before-visit`**: warn on a `twd.mockRequest` registered after
  `twd.visit` with no user action between. Whether that is a bug depends on
  when the app fires the request, which the source does not show; tests are
  written in many valid orders, and `beforeEach` makes it worse.
- **Type-aware rules**: they need `parserOptions.project`, are slow, and
  TypeScript already covers that ground.
- **An autofix for `no-request-body`**: a payload with a real `body` field makes
  `rule.request.body` correct, and the fix would break it silently.
