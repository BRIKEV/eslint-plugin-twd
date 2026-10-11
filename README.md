# twd-lint

ESLint rules that catch [TWD](https://github.com/BRIKEV/twd) test mistakes while
you write them, in the editor and in CI, instead of in a failing browser run.

TWD tests run in the browser. A forgotten `await` or a wrong import is only
found after starting the dev server, running the suite and reading the failure.
That is slow for a person and expensive for an AI agent, which spends a full run
to learn it forgot an `await`. Most of these mistakes are visible in the source,
so a linter can underline them as you type, and fix many of them for you.

## Install

```bash
npm install --save-dev eslint twd-lint
```

Requires ESLint 9 or 10 (flat config) and Node 20 or later.

## Usage

Add the recommended config to your `eslint.config.js`:

```js
import twd from 'twd-lint'

export default [
  // ...your own config
  twd.configs.recommended,
]
```

That is all. `recommended`:

- applies to `**/*.twd.test.{ts,tsx,js,jsx}` only, so it never touches app code
  or your Vitest/Jest tests;
- brings its own TypeScript parser for those files, so it works in JavaScript
  projects and in projects without TypeScript set up in ESLint;
- turns on every rule below as an error.

To pick rules yourself instead:

```js
import twd from 'twd-lint'

export default [
  {
    files: ['**/*.twd.test.ts'],
    plugins: { twd },
    rules: {
      'twd/no-missing-await': 'error',
    },
  },
]
```

## Rules

🔧 fixable with `eslint --fix`

| Rule | What it reports | 🔧 |
|---|---|---|
| [`twd/no-missing-await`](docs/rules/no-missing-await.md) | An async TWD call (`twd.visit`, `userEvent.click`, `screenDom.findBy*`, …) that is not awaited | 🔧 |
| [`twd/runner-imports`](docs/rules/runner-imports.md) | `describe`/`it`/hooks/`expect` imported from Vitest, Jest, Mocha, `node:test` or `chai`, or from the wrong TWD module | 🔧 |
| [`twd/no-request-body`](docs/rules/no-request-body.md) | `rule.request.body` on a `waitForRequest` result: `rule.request` already is the body | |
| [`twd/single-top-level-describe`](docs/rules/single-top-level-describe.md) | More than one top-level `describe` in a file | |
| [`twd/no-focused-tests`](docs/rules/no-focused-tests.md) | `it.only` / `describe.only` left behind | |

The autofix for `no-missing-await` is applied only inside an `async` function,
where adding `await` is always valid.

### Examples

```ts
// ❌ reported
import { describe, it, expect } from 'vitest'          // runner-imports
import { twd, screenDom } from 'twd-js'

describe('Todos', () => {
  it.only('creates a todo', async () => {               // no-focused-tests
    twd.visit('/todos')                                 // no-missing-await
    const rule = await twd.waitForRequest('create')
    expect(rule.request.body.title).to.equal('A')       // no-request-body
  })
})
describe('Other', () => {})                             // single-top-level-describe
```

```ts
// ✅ clean
import { twd, expect, screenDom } from 'twd-js'
import { describe, it } from 'twd-js/runner'

describe('Todos', () => {
  it('creates a todo', async () => {
    await twd.visit('/todos')
    const rule = await twd.waitForRequest('create')
    expect(rule.request.title).to.equal('A')
  })

  describe('Other', () => {})
})
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The repo includes an
[example app](example/) with correct TWD tests and a
[lint playground](example/lint-playground/) with one mistake per rule, for
trying rules in the editor.

## License

[MIT](LICENSE) © BRIKEV
