import { existsSync, readFileSync } from "node:fs";
import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import plugin from "../src/index";

// Every error links to its rule's page (meta.docs.url, set by createRule).
// These checks make sure the page behind that link exists and is listed.
const rules = Object.entries(plugin.rules ?? {});
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

// Every rule on, so the pages of opt-in rules are checked too
const allRulesConfig = {
  ...plugin.configs.recommended,
  rules: Object.fromEntries(rules.map(([name]) => [`twd/${name}`, "error" as const])),
};

describe.each(rules)("twd/%s", (name, rule) => {
  const page = new URL(`../docs/rules/${name}.md`, import.meta.url);

  it("links to its docs page", () => {
    expect(rule.meta?.docs?.url).toBe(
      `https://github.com/BRIKEV/twd-lint/blob/main/docs/rules/${name}.md`,
    );
  });

  it("has a docs page with the required sections", () => {
    expect(existsSync(page)).toBe(true);
    const text = readFileSync(page, "utf8");
    expect(text.startsWith(`# twd/${name}\n`)).toBe(true);
    for (const section of ["## Why", "## Examples", "## When not to use it"]) {
      expect(text).toContain(section);
    }
  });

  // Code blocks starting with `// ❌` must be reported by this rule, `// ✅` must not
  it("has examples that behave as documented", () => {
    const text = readFileSync(page, "utf8");
    const blocks = [...text.matchAll(/```ts\n([\s\S]*?)```/g)].map((match) => match[1]);
    const examples = blocks.filter((code) => /^\/\/ (❌|✅)/.test(code));
    expect(examples.length).toBeGreaterThanOrEqual(2);

    for (const code of examples) {
      const messages = new Linter().verify(code, [allRulesConfig], "a.twd.test.ts");
      expect(messages.filter((m) => m.ruleId === null)).toEqual([]); // parses
      const reported = messages.some((m) => m.ruleId === `twd/${name}`);
      expect(reported, code).toBe(code.startsWith("// ❌"));
    }
  });

  it("is linked from the README", () => {
    expect(readme).toContain(`[\`twd/${name}\`](docs/rules/${name}.md)`);
  });
});
