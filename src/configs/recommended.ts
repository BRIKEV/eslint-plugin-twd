import type { Linter } from "eslint";

// TWD test files only, so the plugin never touches app code
export const files = ["**/*.twd.test.{ts,tsx,js,jsx}"];

export const rules: Linter.RulesRecord = {
  "twd/no-focused-tests": "error",
  "twd/runner-imports": "error",
  "twd/no-missing-await": "error",
  "twd/no-request-body": "error",
};
