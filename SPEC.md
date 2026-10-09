# eslint-plugin-twd — Spec

An ESLint plugin that catches TWD test mistakes while they are being written, in
the editor and in CI, instead of in a failing browser run.

Status: draft. Written to be built step by step, as a learning project. The
"Learning path" section at the end orders the work so each step teaches one
idea.

## Why

TWD tests run in the browser. A mistake in a test is found by launching the dev
server, opening the page, running the suite and reading the failure. That is
slow for a person and expensive for an AI agent, which spends a full run to
learn it forgot an `await`.

Most of these mistakes are visible in the source code. TypeScript already catches
some of them (wrong `mockRequest` option names, positional arguments, Jest
matchers on Chai's `expect`). The rest need a linter:

- a missing `await` on `twd.visit`, `userEvent.click` or `screenDom.findByRole`
- `rule.request.body` when `rule.request` already is the body
- `describe` and `it` imported from Vitest instead of `twd-js/runner`
- more than one top-level `describe` in a file
- an `it.only` left behind
- a component test rendered without the component host, or without
  `cleanup()` and `restorePage()` in `afterEach`

Today these rules live as prose in the twd-ai skills, repeated in three places.
A linter turns each one into a red underline, a CI failure and, where safe, an
automatic fix. The skills can then drop the prose.

## Goals

- Catch the mistakes above with **zero false positives on real TWD tests**.
- Work in TypeScript and JavaScript projects, with or without type information.
- Fit into a project's existing ESLint setup with one line.
- Work without any ESLint setup through a `twd-lint` command, so the twd-ai
  skill can always run it.
- Autofix where the fix is certain.

## Non-goals

- Type-aware rules. They need `parserOptions.project`, are slow, and TypeScript
  already covers that ground.
- Checking app code. Rules apply to `*.twd.test.*` files only.
- Running tests or talking to the browser. This is static analysis only.
- Replacing `tsc`. The two are complementary.

## How projects use it

With ESLint (flat config, ESLint 9+):

```js
// eslint.config.js
import twd from 'eslint-plugin-twd';

export default [
  // ...the project's own config
  twd.configs.recommended,
];
```

`recommended` sets `files: ['**/*.twd.test.{ts,tsx,js,jsx}']`, so it never
touches app code.

Without ESLint:

```bash
npx twd-lint                # lints **/*.twd.test.* from the current directory
npx twd-lint src/twd-tests  # or a given path
npx twd-lint --fix          # applies the safe autofixes
```

`twd-lint` runs ESLint programmatically with only this plugin's
`recommended` config and the TypeScript parser. Exit code 0 when clean, 1 when
any error is reported.

## Rules

Each rule has: a name, what it reports, its level in `recommended`, whether it
autofixes, and the valid and invalid code its tests must cover.

### Phase 1 — what TypeScript does not catch

#### `twd/no-missing-await` — error, autofix

Reports a call to an async TWD API that is not awaited, returned, or otherwise
handled (`.then`, assigned to a variable that is later awaited, passed to
`Promise.all`).

Async APIs, taken from `twd-js` source (`src/twd.ts`, `src/commands/url.ts`):

| Object | Async methods |
|---|---|
| `twd` | `visit`, `get`, `getAll`, `mockRequest`, `waitForRequest`, `waitForRequests`, `waitFor`, `wait`, `notExists`, `initRequestMocking`, `matchLayout` |
| `twd.url()` | `should` |
| `userEvent` and any `userEvent.setup()` result | every method (`click`, `type`, `clear`, `selectOptions`, `keyboard`, `upload`, `hover`, …) |
| `screenDom`, `screenDomGlobal`, Testing Library `screen` | `findBy*`, `findAllBy*` |

Synchronous, never reported: `twd.should`, `twd.setInputValue`,
`twd.mockComponent`, `twd.clearRequestMockRules`, `twd.clearComponentMocks`,
`twd.getRequestCount(s)`, `twd.getRequestMockRules`, `screenDom.getBy*`,
`queryBy*`, `getAllBy*`, `queryAllBy*`.

Fix: insert `await ` before the call, only when the enclosing function is
`async`. Otherwise report without a fix.

```ts
// invalid
twd.visit("/");
userEvent.click(button);
const user = userEvent.setup(); user.type(input, "a");

// valid
await twd.visit("/");
return twd.visit("/");
await Promise.all([twd.waitForRequest("a"), twd.waitForRequest("b")]);
twd.should(el, "be.visible");           // sync
const p = twd.waitForRequest("a"); await p;
```

Track `userEvent.setup()` results: `const user = userEvent.setup()` makes
`user.*` async too. Usage in the example repos: 20 files use this form.

#### `twd/single-top-level-describe` — error

Reports every top-level `describe(...)` after the first in a file. The TWD
runner needs one root per file; nest the rest.

```ts
// invalid
describe("List", () => {});
describe("Create", () => {});

// valid
describe("Todos", () => {
  describe("List", () => {});
  describe("Create", () => {});
});
```

"Top-level" means a `describe` call whose statement sits in the program body,
not inside another function.

#### `twd/no-request-body` — error, autofix

Reports `.request.body` read from the result of `twd.waitForRequest(...)` or
`twd.waitForRequests(...)[i]`. `rule.request` already is the parsed body;
`.body` is `undefined` and the next property access throws.

Fix: remove `.body`.

```ts
// invalid
const rule = await twd.waitForRequest("create");
expect(rule.request.body.title).to.equal("A");

// valid
expect(rule.request.title).to.equal("A");
expect(rule.request).to.deep.equal({ title: "A" });
```

Only report when the object is known to come from `waitForRequest`: a variable
initialised from it, or the call itself. A `.request.body` on anything else is
left alone.

#### `twd/runner-imports` — error, autofix

Reports `describe`, `it`, `beforeEach`, `afterEach` imported from `vitest`,
`@jest/globals`, `mocha` or `node:test`, and `expect` imported from those or from
`chai`.

Fix: move the names to `twd-js/runner` (test functions) and `twd-js`
(`expect`), merging into an existing import of that module when there is one.

```ts
// invalid
import { describe, it, expect } from "vitest";

// valid
import { describe, it } from "twd-js/runner";
import { expect } from "twd-js";
```

#### `twd/no-focused-tests` — error

Reports `it.only(...)` and `describe.only(...)`. They silence every other test,
locally and in CI. The way to isolate a test is
`npx twd-cli run --test "name"`. No autofix: removing `.only` changes what runs,
and the author should see that.

#### `twd/mock-before-visit` — warn

Reports a `twd.mockRequest(...)` or `twd.mockComponent(...)` that comes after
a `twd.visit(...)` in the same test **with no user action between them**.

Why the "no action between" condition: registering a mock after `visit` is fine
when the request is fired later by a click (`visit` → `mockRequest("create")` →
`click("Save")`). It is a bug when the request fires on page load, because the
load already happened. Statically, "no `userEvent.*` call between the visit and
the mock" is the closest safe signal.

```ts
// invalid — the page load request already fired
await twd.visit("/todos");
await twd.mockRequest("getTodos", { method: "GET", url: "/api/todos", response: [] });

// valid — mocked before the click that sends it
await twd.visit("/todos");
await twd.mockRequest("createTodo", { method: "POST", url: "/api/todos", response: {} });
await userEvent.click(save);

// valid — re-registering an alias to wait on it twice, after an action
await userEvent.click(refresh);
await twd.waitForRequest("getUser");
await twd.mockRequest("getUser", { /* ... */ });
```

Level `warn`, not `error`: it is a heuristic.

### Phase 2 — component tests

A file is a **component test** when it imports `render` from a
`@testing-library/*` package.

#### `twd/no-screendom-in-component-tests` — error

Reports any `screenDom.*` call in a component test. `render()` mounts outside the
app root `screenDom` is scoped to, so the query never finds the component. Use
`screen` from Testing Library, or `screenDomGlobal`.

#### `twd/component-test-cleanup` — error

In a component test, reports:

1. a `render(...)` call without a `container` option set to `componentHost()`;
2. a file with `render(...)` but no `afterEach` that calls both `cleanup()` and
   `restorePage()`;
3. `cleanup()` or `restorePage()` called in `beforeEach` instead.

Background: the component host helper detaches the app root and renders into a
blank div; `restorePage()` puts the app back. Without it in `afterEach`, every
flow test after the file sees a blank page. See the twd docs, "Component Testing".

### Phase 3 — good practice (warnings, opt-in where noisy)

| Rule | Reports | In `recommended`? |
|---|---|---|
| `twd/no-actions-in-waitfor` | a `userEvent.*` call inside a `twd.waitFor` callback, which repeats on every retry | yes, error |
| `twd/no-node-apis` | imports of `fs`, `path`, `child_process`, `node:*` — tests run in the browser | yes, error |
| `twd/mock-request-options` | `body:`, `headers:` or positional arguments in `twd.mockRequest`. TypeScript catches these; this covers JavaScript projects | yes, error |
| `twd/prefer-string-url` | `urlRegex: true` with a regex that has no dynamic part (`/^\/api\/users$/`) | yes, warn |
| `twd/no-wait` | `twd.wait(ms)`; prefer `twd.waitFor` or a `findBy*` query | no — 38 uses in the example repos |
| `twd/prefer-find-by` | `screenDom.getBy*` where `findBy*` would wait. Offered as a suggestion (it needs an `await`), never an autofix | no — 104 `getByText` uses in the example repos, most of them correct |

Noisy rules stay out of `recommended` and go in a `strict` config. A rule that
fires on correct code gets switched off, and then it protects nothing.

## Configs

- `recommended` — every rule marked "yes" above, at the level given, for
  `**/*.twd.test.{ts,tsx,js,jsx}`.
- `strict` — `recommended` plus the opt-in rules.

## Package layout

```
eslint-plugin-twd/
├── src/
│   ├── index.ts               # exports { meta, rules, configs }
│   ├── configs/
│   │   ├── recommended.ts
│   │   └── strict.ts
│   ├── rules/
│   │   ├── no-missing-await.ts
│   │   └── ...                # one rule per file
│   └── utils/
│       ├── twd-calls.ts       # "is this node a call to an async TWD API?"
│       ├── test-structure.ts  # find describe/it/beforeEach/afterEach scopes
│       └── create-rule.ts     # RuleCreator with the docs URL pattern
├── bin/
│   └── twd-lint.ts            # the zero-config CLI
├── tests/
│   ├── rules/<rule>.test.ts   # RuleTester: valid and invalid cases per rule
│   └── corpus.test.ts         # runs recommended over real TWD tests
├── docs/rules/<rule>.md       # one page per rule; ESLint links to it
├── package.json
└── README.md
```

Dependencies:

- `@typescript-eslint/utils` — typed `RuleCreator`, AST node types, `RuleTester`
- `@typescript-eslint/parser` — parses TS and TSX; also used by `twd-lint`
- `eslint` ^9 as a `peerDependency` (and a dependency of `twd-lint`'s own run)
- Dev: `vitest` for the test runner, `typescript`, `tsup` (or `tsc`) to build

Module format: ESM, with a CJS build if ESLint consumers need it. Node >= 20.

## Quality bar

1. **Every rule is test-first.** Write the `RuleTester` cases (valid and
   invalid, with expected messages and fixed output) before the rule.
2. **Zero false positives on real tests.** `tests/corpus.test.ts` runs
   `recommended` over a corpus of real TWD test files and expects no errors.
   The corpus starts as copies of the tests in the BRIKEV example repos (about
   100 files across React, Vue, Angular, Solid, Svelte, Nuxt and plain JS). Every
   report the corpus produces is either a real bug — fix the example — or a
   false positive — fix the rule.
3. **Every autofix is checked twice.** The fixed output in the tests, and a
   corpus run with `--fix` that must leave the files parsing and the corpus
   still clean.
4. **Every rule has a docs page** with the why, an invalid and a valid example,
   and when to turn it off.

## Integration with TWD (after 0.1.0)

- **twd-ai `twd` skill:** in the Phase 3 self-check, after the type check, run
  the linter on the files written (`npx eslint <files>` when the project has
  ESLint, `npx twd-lint <files>` otherwise). The "Mistakes the type checker will
  not catch" list in `references/test-writing.md` then goes.
- **twd-ai `setup` skill:** add `twd.configs.recommended` to an existing ESLint
  config, or record `npx twd-lint` as the lint command in `twd-patterns.md`.
- **twd docs:** a "Linting" page under Core Concepts.
- **twd-ai evals:** a case that writes a test with planted mistakes and checks
  the skill fixes them after linting.

## Release plan

| Version | Contents |
|---|---|
| 0.1.0 | Phase 1 rules, `recommended`, corpus test, docs pages |
| 0.2.0 | Phase 2 rules, `twd-lint` CLI |
| 0.3.0 | Phase 3 rules, `strict` config |
| 1.0.0 | After the twd-ai integration has run on real projects for a while |

## Learning path

The order to build it in, one idea per step. Each step ends with green tests.

1. **Read the AST.** Paste a TWD test into https://typescript-eslint.io/play
   (AST tab) or https://astexplorer.net with the `@typescript-eslint/parser`.
   Click `await twd.visit("/")` and find the `AwaitExpression` →
   `CallExpression` → `MemberExpression` (`object: twd`, `property: visit`).
   Every rule is "find this shape in the tree".
2. **Scaffold the package.** `package.json`, TypeScript, Vitest, the
   `src/index.ts` export shape ESLint expects for a flat-config plugin.
3. **First rule, `no-focused-tests`.** The simplest shape: a `CallExpression`
   whose callee is `it.only` or `describe.only`. Learn `RuleCreator`, `meta`,
   `messages`, `context.report`, and `RuleTester` with valid and invalid cases.
4. **`single-top-level-describe`.** Learn to look at a node's parent
   (`ExpressionStatement` directly in `Program`) and keep state across nodes
   in one file.
5. **`runner-imports`.** Learn `ImportDeclaration` nodes and your first
   **autofix** (`fixer.replaceText`), and testing it with `output`.
6. **`no-missing-await`.** The real one. Write `utils/twd-calls.ts` (is this
   call an async TWD API?), then check the parent: `AwaitExpression`,
   `ReturnStatement`, an argument of `Promise.all`, a variable later awaited.
   Then track `userEvent.setup()` results through variables (scope analysis
   with `context.sourceCode.getScope`). Autofix with `fixer.insertTextBefore`.
7. **`no-request-body`.** Learn to follow a variable back to its initialiser
   (`const rule = await twd.waitForRequest(...)`).
8. **`mock-before-visit`.** Learn to walk the statements of a function body in
   order and keep a small state machine (seen visit → seen action → mock).
9. **The corpus test.** Copy the real tests in, run `recommended`, and triage
   every report. This is where the rules meet reality.
10. **Configs and docs.** `recommended`, the docs pages, the README. Publish
    0.1.0.
11. **Phase 2, then `twd-lint`.** The CLI teaches the ESLint Node API
    (`new ESLint({ overrideConfigFile: true, overrideConfig: [...] })`).

References:

- ESLint custom rules: https://eslint.org/docs/latest/extend/custom-rules
- ESLint plugins and flat config: https://eslint.org/docs/latest/extend/plugins
- typescript-eslint custom rules: https://typescript-eslint.io/developers/custom-rules
- Prior art worth reading: `eslint-plugin-testing-library`,
  `eslint-plugin-playwright` (its `missing-playwright-await` rule is close to
  `no-missing-await`), `eslint-plugin-vitest`.

## Open questions

- Package name: `eslint-plugin-twd` (ESLint's naming convention, gives the
  `twd/` rule prefix) — free on npm as of 2026-10-09, as is `twd-lint`. Publish
  `twd-lint` as the bin of the same package, or as its own package?
- Should `mock-before-visit` also know about `beforeEach`? A mock registered in
  `beforeEach` always runs before the test's `visit`, so it is safe; a `visit`
  in `beforeEach` followed by a mock in the test is the bug.
- Detecting a component test by the `render` import: are there TWD tests that
  import `render` for another reason?
