# Contributing to eslint-plugin-twd

Thanks for your interest in eslint-plugin-twd, the ESLint plugin that catches
[TWD](https://github.com/BRIKEV/twd) test mistakes before they reach the
browser.

## Contributions

eslint-plugin-twd welcomes contributions from everyone.

Contributions should be made as GitHub pull requests. Each pull request is
reviewed by a core contributor [@kevinccbsg](https://github.com/kevinccbsg) and
either merged or given feedback for the changes needed.

The most valuable contributions are reports of **false positives** (a rule
reports correct code) and **false negatives** (a rule misses a real mistake),
with the code that shows it. A rule that fires on correct code gets switched
off, and then it protects nothing.

## Getting started

```bash
git clone https://github.com/YOUR_USERNAME/eslint-plugin-twd.git
cd eslint-plugin-twd
npm install
```

| Command | What it does |
|---|---|
| `npm test` | Runs every test once |
| `npm run test:watch` | Runs the tests on every save |
| `npm run typecheck` | Type-checks `src/` and `tests/` |
| `npm run build` | Builds `dist/` |
| `npm run dev` | Rebuilds `dist/` on every save |

### Project layout

```
src/
├── index.ts            # the plugin: { meta, rules, configs }
├── configs/            # recommended
├── rules/              # one rule per file
└── utils/              # shared helpers (createRule, "is this an async TWD call?")
tests/
├── rules/<rule>.test.ts  # RuleTester cases per rule
├── configs.test.ts       # recommended, used the way projects use it
└── example.test.ts       # keeps example/ in sync with the rules
example/                  # Vite + React app with TWD tests (see below)
```

### Trying a rule in the editor

`example/` is a small app whose ESLint config loads the plugin from `../dist`:

```bash
npm run dev            # in the root: keep dist/ up to date
cd example
npm install
npm run lint           # or open the files in your editor with the ESLint extension
```

- `example/src/twd-tests/` holds correct tests. They must lint clean.
- `example/lint-playground/` holds one deliberate mistake per rule.

## Writing or changing a rule

1. **Open an issue first** for a new rule, so we can agree it is worth having.
2. **Tests first.** Write the `RuleTester` cases in `tests/rules/<rule>.test.ts`
   before the rule: valid code that must not be reported, invalid code with the
   expected `messageId`, and the `output` for every autofix.
3. **Zero false positives.** When in doubt, do not report. Prefer missing a rare
   mistake to flagging correct code.
4. **Autofix only when the fix is certain** and never changes what the test
   does. Otherwise report without a fix.
5. **Write messages that say what to do**, not only what is wrong. People and AI
   agents both act on them.
6. Register the rule in `src/index.ts` and `src/configs/recommended.ts`, add a
   mistake for it to `example/lint-playground/`, and add it to the README's
   rules table. The tests fail until all of these are done.

## Submitting changes

Before opening a pull request:

- `npm run typecheck`, `npm test` and `npm run build` pass
- `example/` still lints clean: `cd example && npx eslint src`
- Documentation is updated if the change affects users

### Pull request checklist

- [CI](https://github.com/BRIKEV/eslint-plugin-twd/actions) passes.
- **Tests are required.** Pull requests without tests will not be reviewed. See
  the [pull request template](.github/pull_request_template.md).
- Keep commits small, with each commit passing the tests on its own.
- Use [Conventional Commits](https://www.conventionalcommits.org/) messages
  (`feat:`, `fix:`, `docs:`, `chore:`, …).

### Reporting issues

Check the [existing issues](https://github.com/BRIKEV/eslint-plugin-twd/issues)
first. For bugs (a false positive, a missed mistake, a broken autofix or a
crash), use the bug report template and include the smallest test file that
shows it.

## AI-generated contributions

AI tools (Claude Code, Cursor, GitHub Copilot, …) are welcome, with these rules:

1. **Issue first.** AI-generated rules or changes are accepted only if they come
   from an issue **approved by a code owner** before work starts.
2. **Tests are mandatory.** PRs without tests are rejected regardless of code
   quality.
3. **Manual check.** Try the change in `example/` before submitting.
4. **Transparency.** If the contribution was substantially AI-generated, say so
   in the PR description, so reviewers know where to look harder.

## Conduct

We follow the [Code of Conduct](CODE_OF_CONDUCT.md).

All code in this repository is under the [MIT License](LICENSE).
