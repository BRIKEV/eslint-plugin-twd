import type { ESLint } from "eslint";
import noFocusedTests from "./rules/no-focused-tests";
import noMissingAwait from "./rules/no-missing-await";
import noRequestBody from "./rules/no-request-body";
import runnerImports from "./rules/runner-imports";
import singleTopLevelDescribe from "./rules/single-top-level-describe";

const plugin = {
  meta: {
    name: "eslint-plugin-twd",
    version: "0.0.0",
  },
  rules: {
    "no-focused-tests": noFocusedTests,
    "single-top-level-describe": singleTopLevelDescribe,
    "runner-imports": runnerImports,
    "no-missing-await": noMissingAwait,
    "no-request-body": noRequestBody,
  },
  configs: {},
};

// typescript-eslint and ESLint describe rules with two different type
// families that do not line up. The plugin works at runtime; this cast gives
// consumers ESLint's own type so `plugins: { twd }` type-checks for them.
export default plugin as unknown as ESLint.Plugin;
