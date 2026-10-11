## Description

A summary of the change and the issue it relates to, with the motivation.

Fixes # (issue)

## Type of Change

Delete the options that do not apply:

- [ ] New rule
- [ ] False positive fix (a rule reported correct code)
- [ ] False negative fix (a rule missed a real mistake)
- [ ] Autofix change
- [ ] Config change (`recommended`)
- [ ] Breaking change (a rule reports more, or a config enables more, than before)
- [ ] Documentation update
- [ ] Refactoring, no behavior change

## Testing

- [ ] I added `RuleTester` cases that fail without this change
- [ ] Every autofix has an `output` in the tests
- [ ] `npm run typecheck`, `npm test` and `npm run build` pass
- [ ] `example/` still lints clean (`cd example && npx eslint src`)

**Note**: Pull requests without tests will not be reviewed.

### Test Details

The valid and invalid cases you added or changed, and why:


## New rule checklist

Only for a new rule. Delete otherwise.

- [ ] Registered in `src/index.ts` and `src/configs/recommended.ts`
- [ ] A mistake for it in `example/lint-playground/`
- [ ] A docs page in `docs/rules/<rule>.md`, linked from the README's rules table
- [ ] The message says what to do, not only what is wrong
- [ ] It has no autofix, or the fix is certain and never changes what the test does

## Documentation

- [ ] I updated the README or docs where users are affected
