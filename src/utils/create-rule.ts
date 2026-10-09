import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/BRIKEV/eslint-plugin-twd/blob/main/docs/rules/${name}.md`,
);
