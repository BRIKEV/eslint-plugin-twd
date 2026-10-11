import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import pkg from "../package.json";
import { run } from "../src/cli/run";

const CLEAN = `import { twd } from "twd-js";
import { describe, it } from "twd-js/runner";

describe("Todos", () => {
  it("loads", async () => {
    await twd.visit("/");
  });
});
`;

const BROKEN = `import { twd } from "twd-js";
import { describe, it } from "vitest";

describe("Todos", () => {
  it.only("loads", async () => {
    twd.visit("/");
  });
});
`;

let project: string;

// A throwaway project folder with the given files
const createProject = (files: Record<string, string>) => {
  project = mkdtempSync(join(tmpdir(), "twd-lint-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(project, path)), { recursive: true });
    writeFileSync(join(project, path), content);
  }
};

// Runs the CLI in the project and captures what it prints
const twdLint = async (...args: string[]) => {
  let stdout = "";
  let stderr = "";
  const code = await run(args, {
    cwd: project,
    stdout: (text) => (stdout += text),
    stderr: (text) => (stderr += text),
  });
  return { code, stdout, stderr };
};

afterEach(() => {
  if (project) rmSync(project, { recursive: true, force: true });
});

describe("twd-lint", () => {
  it("exits 0 and prints nothing when the tests are clean", async () => {
    createProject({ "src/twd-tests/todos.twd.test.ts": CLEAN });
    const { code, stdout } = await twdLint();
    expect(code).toBe(0);
    expect(stdout).toBe("");
  });

  it("exits 1 and lists the problems when a test has mistakes", async () => {
    createProject({ "src/twd-tests/todos.twd.test.ts": BROKEN });
    const { code, stdout } = await twdLint();
    expect(code).toBe(1);
    expect(stdout).toContain("todos.twd.test.ts");
    expect(stdout).toContain("twd/runner-imports");
    expect(stdout).toContain("twd/no-focused-tests");
    expect(stdout).toContain("twd/no-missing-await");
  });

  it("only lints TWD test files, never app code or node_modules", async () => {
    createProject({
      "src/twd-tests/todos.twd.test.ts": CLEAN,
      "src/App.tsx": `it.only("not a TWD test", () => {});`,
      "src/math.test.ts": `it.only("a Vitest test", () => {});`,
      "node_modules/pkg/a.twd.test.ts": BROKEN,
      "dist/a.twd.test.js": BROKEN,
    });
    expect((await twdLint()).code).toBe(0);
  });

  it("lints .tsx, .js and .jsx test files too", async () => {
    createProject({
      "a.twd.test.tsx": `it.only("a", async () => { render(<App />); });`,
      "b.twd.test.js": `it.only("b", async () => {});`,
      "c.twd.test.jsx": `it.only("c", async () => {});`,
    });
    const { code, stdout } = await twdLint();
    expect(code).toBe(1);
    expect(stdout.match(/twd\/no-focused-tests/g)).toHaveLength(3);
  });

  it("lints only the paths it is given", async () => {
    createProject({
      "src/twd-tests/clean.twd.test.ts": CLEAN,
      "other/broken.twd.test.ts": BROKEN,
    });
    expect((await twdLint("src/twd-tests")).code).toBe(0);
    expect((await twdLint("src/twd-tests/clean.twd.test.ts")).code).toBe(0);
    expect((await twdLint("other")).code).toBe(1);
  });

  it("ignores the project's own ESLint config", async () => {
    createProject({
      "eslint.config.js": `throw new Error("the project's config must not be loaded");`,
      "a.twd.test.ts": CLEAN,
    });
    expect((await twdLint()).code).toBe(0);
  });

  it("--fix applies the safe fixes and reports what is left", async () => {
    createProject({ "a.twd.test.ts": BROKEN });
    const { code, stdout } = await twdLint("--fix");
    const fixed = readFileSync(join(project, "a.twd.test.ts"), "utf8");

    expect(fixed).toContain(`import { describe, it } from "twd-js/runner";`);
    expect(fixed).toContain(`await twd.visit("/");`);
    // .only has no autofix, so it is still reported
    expect(code).toBe(1);
    expect(stdout).toContain("twd/no-focused-tests");
    expect(stdout).not.toContain("twd/no-missing-await");
  });

  it("--format json prints machine-readable results", async () => {
    createProject({ "a.twd.test.ts": BROKEN });
    const { code, stdout } = await twdLint("--format", "json");
    const results = JSON.parse(stdout);
    expect(code).toBe(1);
    expect(results[0].filePath).toBe(join(project, "a.twd.test.ts"));
    expect(results[0].messages.map((m: { ruleId: string }) => m.ruleId)).toContain(
      "twd/no-missing-await",
    );
  });

  it("exits 2 when there are no TWD test files to lint", async () => {
    createProject({ "src/App.tsx": "export {};" });
    const { code, stderr } = await twdLint();
    expect(code).toBe(2);
    expect(stderr).toContain("No TWD test files");
  });

  it("exits 2 when a given path does not exist", async () => {
    createProject({ "a.twd.test.ts": CLEAN });
    const { code, stderr } = await twdLint("missing/folder");
    expect(code).toBe(2);
    expect(stderr).toContain("missing/folder");
  });

  it("exits 2 on an unknown option", async () => {
    createProject({ "a.twd.test.ts": CLEAN });
    const { code, stderr } = await twdLint("--nope");
    expect(code).toBe(2);
    expect(stderr).toContain("--nope");
    expect(stderr).toContain("Usage");
  });

  it("--help prints the usage", async () => {
    createProject({});
    const { code, stdout } = await twdLint("--help");
    expect(code).toBe(0);
    expect(stdout).toContain("Usage: twd-lint");
    expect(stdout).toContain("--fix");
  });

  it("--version prints the package version", async () => {
    createProject({});
    const { code, stdout } = await twdLint("--version");
    expect(code).toBe(0);
    expect(stdout.trim()).toBe(pkg.version);
  });
});
