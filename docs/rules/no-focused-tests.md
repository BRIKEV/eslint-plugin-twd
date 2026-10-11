# twd/no-focused-tests

Disallow `it.only` and `describe.only`.

✅ In `recommended`

## Why

`.only` makes the runner skip every other test, locally and in CI. It is handy
while working on one test and easy to forget: the suite then goes green while
almost nothing ran.

TWD has better ways to run a single test:

- in the browser, press the play button next to the test in the TWD sidebar;
- headless, run `npx twd-cli run --test "test name"`.

## What it reports

`it.only(...)` and `describe.only(...)`, including the `it["only"](...)` form.
`.skip` is not reported.

## Examples

```ts
// ❌ Incorrect
it.only("adds a todo", async () => {});
describe.only("Todos", () => {});
```

```ts
// ✅ Correct
it("adds a todo", async () => {});
describe("Todos", () => {});
it.skip("not ready yet", async () => {});
```

## No autofix

Removing `.only` changes which tests run, and the author should see that
happen. In the editor, the error underlines `only`, so it is a quick delete.

## When not to use it

Keep it on.
