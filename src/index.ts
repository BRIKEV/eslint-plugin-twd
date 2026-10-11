import tsParser from "@typescript-eslint/parser";
import type { ESLint, Linter } from "eslint";
import pkg from "../package.json";
import * as recommended from "./configs/recommended";
import noFocusedTests from "./rules/no-focused-tests";
import noMissingAwait from "./rules/no-missing-await";
import noRequestBody from "./rules/no-request-body";
import runnerImports from "./rules/runner-imports";

const plugin = {
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  rules: {
    "no-focused-tests": noFocusedTests,
    "runner-imports": runnerImports,
    "no-missing-await": noMissingAwait,
    "no-request-body": noRequestBody,
  },
  configs: {} as Record<string, Linter.Config>,
};

// A config refers to the plugin, so it is added once the plugin exists.
// It sets the parser too: a project whose ESLint only knows JavaScript can
// still lint .ts and .tsx TWD tests with this one line.
plugin.configs.recommended = {
  name: "twd/recommended",
  files: recommended.files,
  languageOptions: { parser: tsParser },
  plugins: { twd: plugin as unknown as ESLint.Plugin },
  rules: recommended.rules,
};

// typescript-eslint and ESLint describe rules with two different type
// families that do not line up. The plugin works at runtime; this cast gives
// consumers ESLint's own type so `plugins: { twd }` and
// `twd.configs.recommended` type-check for them.
export default plugin as unknown as ESLint.Plugin & {
  configs: { recommended: Linter.Config };
};
