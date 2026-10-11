import { Linter } from "eslint";
import pkg from "../package.json";
import { describe, expect, it } from "vitest";
import plugin from "../src/index";

const { recommended } = plugin.configs;

// The config exactly as a project uses it: one line, nothing else
const lint = (code: string, filename: string) =>
  new Linter().verify(code, [recommended], filename);

describe("configs.recommended", () => {
  // Opt-in rules (Phase 3, `strict`) will be the exception to this
  it("turns on every rule as an error", () => {
    const ruleNames = Object.keys(plugin.rules ?? {}).map((name) => `twd/${name}`);
    expect(Object.keys(recommended.rules ?? {}).sort()).toEqual(ruleNames.sort());
    expect(Object.values(recommended.rules ?? {}).every((level) => level === "error")).toBe(true);
  });

  it("works on its own: registers the plugin and parses TypeScript", () => {
    const messages = lint(`const n: number = 1;\nit.only("a", async () => {});`, "src/a.twd.test.ts");
    expect(messages.map((m) => m.ruleId)).toEqual(["twd/no-focused-tests"]);
  });

  it.each(["a.twd.test.ts", "a.twd.test.tsx", "a.twd.test.js", "a.twd.test.jsx"])(
    "lints %s",
    (filename) => {
      expect(lint(`it.only("a", () => {});`, `src/${filename}`)).toHaveLength(1);
    },
  );

  it.each(["src/App.tsx", "src/a.test.ts", "src/a.spec.ts"])("never touches %s", (filename) => {
    // ESLint reports a single "no matching configuration" warning for files outside `files`
    const messages = lint(`it.only("a", () => {});`, filename);
    expect(messages.some((m) => m.ruleId?.startsWith("twd/"))).toBe(false);
  });

  it("parses JSX in .js test files (Create React App style)", () => {
    const code = `it.only("a", async () => { render(<App />); });`;
    expect(lint(code, "src/a.twd.test.js").map((m) => m.ruleId)).toEqual(["twd/no-focused-tests"]);
  });

  it("parses JSX in .tsx test files", () => {
    const code = `import { render } from "@testing-library/react";\nit.only("a", async () => { render(<App />); });`;
    expect(lint(code, "src/a.twd.test.tsx").map((m) => m.ruleId)).toEqual(["twd/no-focused-tests"]);
  });
});

describe("meta", () => {
  it("reports the package's name and version", () => {
    expect(plugin.meta).toEqual({ name: pkg.name, version: pkg.version });
  });
});
