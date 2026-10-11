# twd/runner-imports

Require `describe`, `it`, the hooks and `expect` to come from TWD.

✅ In `recommended` · 🔧 Fixable with `--fix`

## Why

The TWD runner only knows about tests registered with its own `describe` and
`it` from `twd-js/runner`. A `describe` imported from Vitest registers the test
with Vitest instead: in the browser, TWD finds no tests in the file, or the
import fails. This is the most common mistake when a test is written by habit,
or by an AI model trained mostly on Vitest and Jest tests.

The two TWD modules are also easy to mix up. `twd-js` does not export the
runner functions, and `twd-js/runner` does not export `expect`.

## What it reports

| Name | Reported when imported from | Moved to |
|---|---|---|
| `describe`, `it`, `beforeEach`, `afterEach` | `vitest`, `@jest/globals`, `mocha`, `node:test`, `twd-js` | `twd-js/runner` |
| `expect` | `vitest`, `@jest/globals`, `mocha`, `node:test`, `chai`, `twd-js/runner` | `twd-js` |

Other names from those modules, such as `vi`, and `import type` imports are left
alone.

## Examples

```ts
// ❌ Incorrect
import { describe, it, expect } from "vitest";
import { expect } from "chai";
import { twd, describe, it } from "twd-js";
import { describe, it, expect } from "twd-js/runner";
```

```ts
// ✅ Correct
import { twd, expect } from "twd-js";
import { describe, it, beforeEach, afterEach } from "twd-js/runner";
```

## Autofix

Moves each name to the right module. It merges into an existing `twd-js` or
`twd-js/runner` import when there is one, and adds a new import otherwise. An
import left empty is removed; one with other names left, such as `vi`, keeps
them. Aliases (`it as test`), quote style and semicolons are kept.

```ts
// before
import { twd } from "twd-js";
import { describe, it, expect, vi } from "vitest";

// after --fix
import { twd, expect } from "twd-js";
import { vi } from "vitest";
import { describe, it } from "twd-js/runner";
```

## When not to use it

Keep it on. The plugin's configs only apply to `*.twd.test.*` files, so your
Vitest or Jest tests are never checked by this rule.
