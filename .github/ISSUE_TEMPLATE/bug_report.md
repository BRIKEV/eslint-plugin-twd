---
name: Bug Report
about: A rule reports correct code, misses a mistake, breaks code with --fix, or crashes
title: '[BUG] '
labels: bug
assignees: ''
---

## What kind of bug

- [ ] **False positive**: a rule reports code that is correct
- [ ] **False negative**: a rule misses a real mistake
- [ ] **Bad autofix**: `--fix` produces wrong or broken code
- [ ] **Crash**: ESLint errors out

**Rule**: [e.g. `twd/no-missing-await`]

## Code

The smallest TWD test file that shows the problem:

```ts
import { twd, screenDom } from "twd-js";
import { describe, it } from "twd-js/runner";

describe("Repro", () => {
  it("shows the problem", async () => {
    // ...
  });
});
```

File name: [e.g. `src/twd-tests/todos.twd.test.ts`]

## Expected

What the linter should report (or not), or what `--fix` should produce.

## Actual

What it reports instead. Paste the ESLint output:

```
```

## ESLint config

Your `eslint.config.js`, or the part that loads this plugin:

```js
```

## Versions

- **eslint-plugin-twd**: [e.g. 0.1.0]
- **eslint**: [e.g. 10.12.0]
- **Node**: [e.g. 22.11.0]
- **twd-js**: [e.g. 1.10.1]
- **Editor** (if the problem is only in the editor): [e.g. Cursor + ESLint extension]

## Additional Context

Anything else: does it happen only in `.tsx` files, only with `--fix`, only in
the editor?
