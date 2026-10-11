import { readFileSync } from "node:fs";
import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import plugin from "../src/index";

// Keeps example/ honest: its correct tests stay clean, and its playground keeps
// showing every rule. Uses the source, so it needs no build.
const lint = (path: string) =>
  new Linter().verify(
    readFileSync(new URL(`../example/${path}`, import.meta.url), "utf8"),
    [plugin.configs.recommended],
    path,
  );

describe("example app", () => {
  it("has correct TWD tests that lint clean", () => {
    expect(lint("src/twd-tests/todos.twd.test.ts")).toEqual([]);
  });

  it("has a playground that triggers every rule", () => {
    const messages = lint("lint-playground/mistakes.twd.test.ts");
    expect(messages.every((m) => m.ruleId !== null)).toBe(true); // no parse errors
    const reported = new Set(messages.map((m) => m.ruleId));
    const allRules = Object.keys(plugin.rules ?? {}).map((name) => `twd/${name}`);
    expect([...reported].sort()).toEqual(allRules.sort());
  });
});
