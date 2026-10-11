# twd/no-missing-await

Require async TWD calls to be awaited.

✅ In `recommended` · 🔧 Fixable with `--fix` (inside `async` functions)

## Why

Most TWD commands return a promise. Without `await`, the test does not wait:
it moves to the next line while the page is still loading, the click has not
happened yet, or the element has not been found. The test then fails somewhere
else, or worse, passes without checking anything. A forgotten `await` on the
last line of a test, such as `twd.url().should(...)`, means the assertion never
counts.

## What it reports

A call to one of these, left as a statement on its own:

| Object | Async methods |
|---|---|
| `twd` | `visit`, `get`, `getAll`, `mockRequest`, `waitForRequest`, `waitForRequests`, `waitFor`, `wait`, `notExists`, `initRequestMocking`, `matchLayout` |
| `twd.url()` | `should` |
| `userEvent`, and the result of `userEvent.setup()` | every method except `setup` |
| `screenDom`, `screenDomGlobal`, Testing Library's `screen` | `findBy*`, `findAllBy*` |

It also reports a promise stored in a variable that is never used:
`const p = twd.waitForRequest("a")` with no later `p`.

Never reported, because they are synchronous: `twd.should`,
`twd.setInputValue`, `twd.mockComponent`, `twd.clearRequestMockRules`,
`twd.clearComponentMocks`, `twd.getRequestCount(s)`, `twd.getRequestMockRules`,
`twd.url()`, and the `getBy*` / `queryBy*` / `getAllBy*` / `queryAllBy*` queries.

## Examples

```ts
// ❌ Incorrect
twd.visit("/todos");
userEvent.click(button);
screenDom.findByText("Learn TWD");
twd.url().should("contain.url", "/todos");

const user = userEvent.setup();
user.type(input, "Buy milk");

const rule = twd.waitForRequest("createTodo"); // never awaited or used
```

```ts
// ✅ Correct
await twd.visit("/todos");
await userEvent.click(button);
const todo = await screenDom.findByText("Learn TWD");
await twd.url().should("contain.url", "/todos");

const user = userEvent.setup();
await user.type(input, "Buy milk");

// a promise handled any other way is fine
await Promise.all([twd.waitForRequest("a"), twd.waitForRequest("b")]);
const pending = twd.waitForRequest("save");
await userEvent.click(save);
await pending;
return twd.visit("/");

// synchronous APIs need no await
twd.should(todo, "be.visible");
```

## Autofix

Inserts `await` before the call, only when it is inside an `async` function.
Elsewhere `await` would be a syntax error, so the rule reports without a fix;
make the function `async` first. A promise stored in an unused variable is
reported without a fix too.

## When not to use it

Keep it on. To start a call without waiting on purpose, which is rare in a
test, write `void twd.visit("/")`: the rule treats `void` as an explicit choice.
