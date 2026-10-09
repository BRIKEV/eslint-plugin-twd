import { it, expect } from "vitest";
import { Linter } from "eslint";
import tsParser from "@typescript-eslint/parser";
import plugin from "../src/index";

it("reports it.only through a real ESLint run", () => {
  const linter = new Linter();
  const messages = linter.verify(`it.only("a", async () => {});`, [
    {
      languageOptions: { parser: tsParser },
      plugins: { twd: plugin },
      rules: { "twd/no-focused-tests": "error" },
    },
  ]);
  expect(messages).toHaveLength(1);
  expect(messages[0].ruleId).toBe("twd/no-focused-tests");
});