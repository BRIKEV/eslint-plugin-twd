import type { ESLint } from "eslint";
import noFocusedTests from "./rules/no-focused-tests";
import singleTopLevelDescribe from "./rules/single-top-level-describe";

const plugin = {
  meta: {
    name: "eslint-plugin-twd",
    version: "0.0.0",
  },
  rules: {
    "no-focused-tests": noFocusedTests,
    "single-top-level-describe": singleTopLevelDescribe,
  },
  configs: {},
};

// typescript-eslint and ESLint describe rules with two different type
// families that do not line up. The plugin works at runtime; this cast gives
// consumers ESLint's own type so `plugins: { twd }` type-checks for them.
export default plugin as unknown as ESLint.Plugin;
