# twd/single-top-level-describe

Require a single top-level `describe` per TWD test file.

✅ In `recommended`

## Why

A TWD test file has one root `describe`. Multiple top-level `describe`s break
the test runner, so further groups belong nested inside the root one.

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

Keep it on.
