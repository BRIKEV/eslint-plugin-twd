# twd-lint example

A small Vite + React todo app with TWD tests, used as a playground for the
twd-lint plugin in the parent folder.

- `src/twd-tests/` — correct TWD tests. They run in the TWD sidebar and lint clean.
- `lint-playground/` — deliberately broken tests, one mistake per rule. Lint only.

## Use it

```bash
# in the parent folder: build the plugin (or keep it rebuilding)
npm run build        # or: npm run dev

# here
npm install
npm run dev          # the app with the TWD sidebar; press play to run the tests
npm run lint         # lints both folders; the playground errors are expected
```

The app has no backend. Without the tests' mocks, it shows "Could not load todos".
