---
name: Feature Request
about: Suggest a new rule or a change to an existing one
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## The mistake

What TWD test mistake should be caught? How does it fail today (wrong result,
error in the browser, flaky test)?

## Examples

Code the rule should report:

```ts
```

Correct code it must **not** report, including close cases:

```ts
```

## Can it be detected for certain?

A rule must have zero false positives on real tests. Can this mistake be seen
in the source code alone, without running the test or knowing what the app
does? If it depends on intent, explain how the rule would tell the cases apart.

## Autofix

- [ ] The fix is certain and never changes what the test does: it can be an autofix
- [ ] The fix needs a human decision: report only
- [ ] Not sure

## Recommended?

Should it be on in `recommended` for every project, or opt-in?

## Additional Context

Links to failing runs, TWD docs, or similar rules in other plugins.
