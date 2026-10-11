# twd/no-request-body

Disallow `.request.body` on a `waitForRequest` result.

✅ In `recommended`

## Why

`twd.waitForRequest()` resolves to the mock rule that matched, and its
`request` property already is the parsed request body: an object for JSON, an
object of fields for form data, a string for text. There is no `.body` inside
it. `rule.request.body` is `undefined`, so `rule.request.body.title` throws, and
`expect(rule.request.body).to.deep.equal(...)` fails with a confusing message.

TypeScript does not catch it, because `request` is typed as `any`.

## What it reports

`.body` read from the `request` of a rule that comes from `twd.waitForRequest()`
or `twd.waitForRequests()`:

- a variable: `const rule = await twd.waitForRequest("a")`
- the call itself: `(await twd.waitForRequest("a")).request.body`
- an element of `waitForRequests`: `rules[0].request.body`, or a destructured
  `const [users, posts] = await twd.waitForRequests([...])`
- a destructured request: `const { request } = await twd.waitForRequest("a")`

`.request.body` on anything else, such as a `fetch` response or a server
framework's `ctx.request.body`, is left alone.

## Examples

```ts
// ❌ Incorrect
const rule = await twd.waitForRequest("createTodo");
expect(rule.request.body.title).to.equal("Buy milk");

const rules = await twd.waitForRequests(["createTodo"]);
expect(rules[0].request.body).to.deep.equal({ title: "Buy milk" });
```

```ts
// ✅ Correct
const rule = await twd.waitForRequest("createTodo");
expect(rule.request.title).to.equal("Buy milk");
expect(rule.request).to.deep.equal({ title: "Buy milk" });
```

## No autofix

Removing `.body` is usually right, but not always: if your app sends a payload
that really has a `body` field, such as `{ title, body }` for a blog post,
`rule.request.body` is correct. An automatic fix would silently break that
test, so the rule only reports.

## When not to use it

When the payload really has a `body` field, disable the rule for that line:

```ts
// eslint-disable-next-line twd/no-request-body -- the post payload has a body field
expect(rule.request.body).to.equal("Hello world");
```
