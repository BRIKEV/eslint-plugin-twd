# twd/single-top-level-describe

Prefer a single top-level `describe` per TWD test file.

⚪ Opt-in: not in `recommended`, not run by `npx twd-lint`

## Why

A style preference: one root `describe` per file, with further groups nested
inside it, makes each file read as one group, in the code and in the TWD
sidebar.

It is a preference, not a mistake. The TWD runner handles several top-level
`describe`s in one file exactly like several files, and real projects use them
on purpose, for example one root per function in a file of unit-style tests.
That is why the rule is off by default. Turn it on if your team shares the
preference:

```js
// eslint.config.js
import twd from "twd-lint";

export default [
  twd.configs.recommended,
  {
    files: ["**/*.twd.test.{ts,tsx,js,jsx}"],
    rules: { "twd/single-top-level-describe": "warn" },
  },
];
```

## What it reports

Every top-level `describe(...)`, `describe.skip(...)` or `describe.only(...)`
after the first one in a file. "Top-level" means the call is a statement
directly in the file, not inside another `describe` or a function.

## Examples

```ts
// ❌ Incorrect
describe("Todo list", () => {
  it("shows the todos", async () => {});
});

describe("Create todo", () => {
  it("adds a todo", async () => {});
});
```

```ts
// ✅ Correct
describe("Todos", () => {
  describe("Todo list", () => {
    it("shows the todos", async () => {});
  });

  describe("Create todo", () => {
    it("adds a todo", async () => {});
  });
});
```

## No autofix

Nesting means moving whole blocks and choosing a name for the new root, which is
a decision for the author.

## When not to use it

When your files group tests by several top-level `describe`s on purpose. That
is why it is off by default.
