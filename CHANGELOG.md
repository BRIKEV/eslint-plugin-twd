## <small>0.1.1 (2026-10-11)</small>

* fix(cli): lint only TWD test files in folders ([e3fbf02](https://github.com/BRIKEV/twd-lint/commit/e3fbf02))
* ci: publish with npm Trusted Publishing instead of an NPM_TOKEN ([ccb5a99](https://github.com/BRIKEV/twd-lint/commit/ccb5a99))
* chore: apply npm pkg fix ([fc37651](https://github.com/BRIKEV/twd-lint/commit/fc37651))

**Why `npx twd-lint` could fail on a project whose tests were fine.** Given a
folder, ESLint lints every `.js`, `.mjs` and `.cjs` file in it by default,
whatever the config's `files` say. The CLI passed folders straight to ESLint,
so it also parsed ordinary app files: a `.js` file with JSX came back as a
parsing error, and an `eslint-disable` comment for one of the project's own
rules came back as "Definition for rule ... was not found". Either one made
the command exit 1. Running it over the BRIKEV repos showed the size of it: 400
files linted where 107 were TWD tests. Folders now become a glob of their
`*.twd.test.*` files, so ESLint never sees anything else, and directives for
rules the CLI does not load are no longer reported, which also covers a TWD
test that disables, say, `@typescript-eslint/no-explicit-any`. The ESLint
plugin was not affected: in a project's own ESLint config, those files are
linted by that config, not by twd-lint.

**Publishing now takes two steps.** The release workflow authenticates with npm
Trusted Publishing (a short-lived GitHub OIDC token, no `NPM_TOKEN`) and runs
`npm stage publish`, which uploads the tarball and defers proof-of-presence. A
green workflow means the version is staged, not live: it goes live on approval
in npm's UI or with `npm stage approve`. Nothing changes for anyone installing
the package.

## <small>0.1.0 (2026-10-11)</small>

First release: catch TWD test mistakes in the editor and in CI, instead of in a
failing browser run.

* feat: `npx twd-lint`, a command that needs no setup and ignores the project's
  own ESLint config, so it gives the same result whatever linter the project
  uses. Supports paths, `--fix` and `--format json`, with exit codes 0 (clean),
  1 (problems) and 2 (usage error or nothing to lint)
* feat: an ESLint plugin (ESLint 9 or 10, flat config) with
  `twd.configs.recommended`, which applies to `**/*.twd.test.{ts,tsx,js,jsx}`
  only and brings its own TypeScript parser
* feat: `twd/no-missing-await`, an async TWD call left without `await`
  (`twd.visit`, `userEvent.click`, `screenDom.findBy*`, `twd.url().should`,
  `userEvent.setup()` results). Autofix inside `async` functions
* feat: `twd/runner-imports`, `describe`/`it`/hooks/`expect` imported from
  Vitest, Jest, Mocha, `node:test`, `chai`, or the wrong TWD module. Autofix
* feat: `twd/no-request-body`, `rule.request.body` on a `waitForRequest` result,
  where `rule.request` already is the body. No autofix: a payload can have a
  real `body` field
* feat: `twd/single-top-level-describe`, more than one top-level `describe` in
  a file
* feat: `twd/no-focused-tests`, `it.only` / `describe.only` left behind
* docs: a page per rule in [docs/rules](https://github.com/BRIKEV/twd-lint/tree/main/docs/rules),
  linked from every error message
