import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/BRIKEV/twd-lint/blob/main/docs/rules/${name}.md`,
);
