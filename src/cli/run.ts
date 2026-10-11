import { existsSync, statSync } from "node:fs";
import { posix, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { ESLint } from "eslint";
import pkg from "../../package.json";
import plugin from "../index";

const USAGE = `Usage: twd-lint [paths...] [options]

Lints TWD test files (*.twd.test.{ts,tsx,js,jsx}) with the twd-lint rules.
Needs no ESLint setup, and ignores the project's own ESLint config.

Arguments:
  paths              Files or folders to lint (default: the current folder)

Options:
  --fix              Apply the safe fixes, then report what is left
  --format <name>    Output format: stylish (default) or json
  -h, --help         Show this help
  -v, --version      Show the version

Exit codes: 0 no problems, 1 problems found, 2 usage error or nothing to lint
`;

// Build and dependency folders that never hold tests worth linting
// (node_modules and .git are always ignored by ESLint)
const IGNORES = [
  "**/dist/",
  "**/build/",
  "**/coverage/",
  "**/.next/",
  "**/.nuxt/",
  "**/.output/",
  "**/.svelte-kit/",
];

const TEST_FILES = "**/*.twd.test.{ts,tsx,js,jsx}";

// A folder becomes a glob of the TWD tests in it. Given a bare folder, ESLint
// would also lint every .js, .mjs and .cjs file in it, whatever the config says.
const toPatterns = (paths: string[], cwd: string) =>
  paths.map((path) =>
    statSync(resolve(cwd, path)).isDirectory()
      ? posix.join(path.split(sep).join("/"), TEST_FILES)
      : path,
  );

// The CLI loads only twd rules, so an eslint-disable comment for any other rule
// (from the project's own ESLint setup) comes back as "Definition for rule ...
// was not found". Those are not the test's problems: drop them and recount.
const keepTwdMessages = (result: ESLint.LintResult): ESLint.LintResult => {
  const messages = result.messages.filter((m) => m.ruleId === null || m.ruleId.startsWith("twd/"));
  const count = (severity: number, fixable = false) =>
    messages.filter((m) => m.severity === severity && (!fixable || m.fix)).length;
  return {
    ...result,
    messages,
    errorCount: count(2),
    warningCount: count(1),
    fixableErrorCount: count(2, true),
    fixableWarningCount: count(1, true),
  };
};

export interface Io {
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

/** Runs the CLI and returns its exit code. */
export const run = async (args: string[], io: Io): Promise<number> => {
  let options;
  try {
    options = parseArgs({
      args,
      allowPositionals: true,
      options: {
        fix: { type: "boolean", default: false },
        format: { type: "string", default: "stylish" },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
    });
  } catch (error) {
    io.stderr(`twd-lint: ${(error as Error).message}\n\n${USAGE}`);
    return 2;
  }

  const { values, positionals } = options;
  if (values.help) {
    io.stdout(USAGE);
    return 0;
  }
  if (values.version) {
    io.stdout(`${pkg.version}\n`);
    return 0;
  }
  if (!["stylish", "json"].includes(values.format)) {
    io.stderr(`twd-lint: unknown format "${values.format}". Use stylish or json.\n`);
    return 2;
  }

  const paths = positionals.length > 0 ? positionals : ["."];
  const missing = paths.filter((path) => !existsSync(resolve(io.cwd, path)));
  if (missing.length > 0) {
    io.stderr(`twd-lint: no such file or folder: ${missing.join(", ")}\n`);
    return 2;
  }

  const eslint = new ESLint({
    cwd: io.cwd,
    // Only our config: the project's eslint.config.js, if any, is not loaded
    overrideConfigFile: true,
    overrideConfig: [
      { ignores: IGNORES },
      plugin.configs.recommended,
      // A directive for a rule the CLI does not run is not "unused"
      { linterOptions: { reportUnusedDisableDirectives: "off" } },
    ],
    fix: values.fix,
    errorOnUnmatchedPattern: false,
  });

  const results = (await eslint.lintFiles(toPatterns(paths, io.cwd))).map(keepTwdMessages);
  // A file given by name that is not a TWD test comes back with an "ignored" warning
  const isIgnored = (result: ESLint.LintResult) =>
    result.messages.some((m) => m.ruleId === null && m.severity === 1 && /ignored/i.test(m.message));
  const linted = results.filter((result) => !isIgnored(result));
  if (linted.length === 0) {
    io.stderr(`twd-lint: No TWD test files (*.twd.test.{ts,tsx,js,jsx}) found in ${paths.join(", ")}\n`);
    return 2;
  }

  if (values.fix) await ESLint.outputFixes(linted);

  const formatter = await eslint.loadFormatter(values.format);
  const output = await formatter.format(linted);
  if (output) io.stdout(output.endsWith("\n") ? output : `${output}\n`);

  return linted.some((result) => result.errorCount > 0) ? 1 : 0;
};
