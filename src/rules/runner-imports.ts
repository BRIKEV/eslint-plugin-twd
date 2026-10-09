import { AST_NODE_TYPES, type TSESLint, type TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

const RUNNER_MODULE = "twd-js/runner";
const TWD_MODULE = "twd-js";

const RUNNER_FUNCTIONS = new Set(["describe", "it", "beforeEach", "afterEach"]);
const TEST_FRAMEWORKS = new Set(["vitest", "@jest/globals", "mocha", "node:test"]);

// Where a name imported from `source` should come from instead, or null if it is fine
const targetFor = (source: string, name: string) => {
  if (RUNNER_FUNCTIONS.has(name) && TEST_FRAMEWORKS.has(source)) return RUNNER_MODULE;
  if (name === "expect" && (TEST_FRAMEWORKS.has(source) || source === "chai")) return TWD_MODULE;
  return null;
};

// `import { it }` has an Identifier, `import { "it" as x }` a string Literal
const importedName = (specifier: TSESTree.ImportSpecifier) =>
  specifier.imported.type === AST_NODE_TYPES.Identifier
    ? specifier.imported.name
    : String(specifier.imported.value);

const namedSpecifiers = (node: TSESTree.ImportDeclaration) =>
  node.specifiers.filter(
    (s): s is TSESTree.ImportSpecifier => s.type === AST_NODE_TYPES.ImportSpecifier,
  );

interface Move {
  specifier: TSESTree.ImportSpecifier;
  declaration: TSESTree.ImportDeclaration;
  target: string;
}

export default createRule({
  name: "runner-imports",
  meta: {
    type: "problem",
    docs: { description: "Require describe, it, hooks and expect to come from twd-js" },
    fixable: "code",
    messages: {
      wrongSource:
        '`{{ name }}` comes from "{{ target }}" in TWD tests, not "{{ source }}". The TWD runner does not see tests registered with another framework.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;
    const moves: Move[] = [];
    // The existing `import { ... } from "twd-js"` / "twd-js/runner", if any
    const existingTargets = new Map<string, TSESTree.ImportDeclaration>();

    const rebuildImport = (
      declaration: TSESTree.ImportDeclaration,
      kept: TSESTree.ImportClause[],
    ) => {
      const parts: string[] = [];
      const named: string[] = [];
      for (const specifier of kept) {
        if (specifier.type === AST_NODE_TYPES.ImportSpecifier) named.push(sourceCode.getText(specifier));
        else parts.push(sourceCode.getText(specifier));
      }
      if (named.length > 0) parts.push(`{ ${named.join(", ")} }`);
      const semicolon = sourceCode.getText(declaration).endsWith(";") ? ";" : "";
      return `import ${parts.join(", ")} from ${declaration.source.raw}${semicolon}`;
    };

    const buildFix = (fixer: TSESLint.RuleFixer) => {
      const fixes: TSESLint.RuleFix[] = [];
      const movedSpecifiers = new Set(moves.map((m) => m.specifier));
      const firstDeclaration = moves[0].declaration;
      const quote = firstDeclaration.source.raw[0];
      const semicolon = sourceCode.getText(firstDeclaration).endsWith(";") ? ";" : "";

      // Specifier text per target module, without duplicates
      const textsByTarget = new Map<string, string[]>();
      for (const { specifier, target } of moves) {
        const texts = textsByTarget.get(target) ?? [];
        const text = sourceCode.getText(specifier);
        if (!texts.includes(text)) texts.push(text);
        textsByTarget.set(target, texts);
      }

      // Merge into existing TWD imports; the rest become new import lines
      const newImports: string[] = [];
      for (const [target, texts] of textsByTarget) {
        const existing = existingTargets.get(target);
        if (existing) {
          const present = namedSpecifiers(existing);
          const missing = texts.filter((t) => !present.some((s) => sourceCode.getText(s) === t));
          if (missing.length > 0) {
            fixes.push(fixer.insertTextAfter(present[present.length - 1], `, ${missing.join(", ")}`));
          }
        } else {
          newImports.push(`import { ${texts.join(", ")} } from ${quote}${target}${quote}${semicolon}`);
        }
      }

      // Rewrite each offending import with what is left of it; the new imports go where the first one was
      const declarations = [...new Set(moves.map((m) => m.declaration))];
      for (const declaration of declarations) {
        const kept = declaration.specifiers.filter(
          (s) => !movedSpecifiers.has(s as TSESTree.ImportSpecifier),
        );
        const lines: string[] = [];
        if (kept.length > 0) lines.push(rebuildImport(declaration, kept));
        if (declaration === firstDeclaration) lines.push(...newImports);

        if (lines.length > 0) {
          fixes.push(fixer.replaceText(declaration, lines.join("\n")));
        } else {
          // Remove the whole line, not just the statement
          const end = declaration.range[1];
          const removeNewline = sourceCode.text[end] === "\n" ? 1 : 0;
          fixes.push(fixer.removeRange([declaration.range[0], end + removeNewline]));
        }
      }

      return fixes;
    };

    return {
      ImportDeclaration(node) {
        if (node.importKind === "type") return;
        const source = node.source.value;

        if ((source === RUNNER_MODULE || source === TWD_MODULE) && !existingTargets.has(source)) {
          if (namedSpecifiers(node).length > 0) existingTargets.set(source, node);
          return;
        }

        for (const specifier of namedSpecifiers(node)) {
          if (specifier.importKind === "type") continue;
          const target = targetFor(source, importedName(specifier));
          if (target) moves.push({ specifier, declaration: node, target });
        }
      },

      // Report once the whole file is read, so the fix can merge into an import that comes later
      "Program:exit"() {
        for (const { specifier, declaration, target } of moves) {
          context.report({
            node: specifier,
            messageId: "wrongSource",
            data: { name: importedName(specifier), source: declaration.source.value, target },
            // Every report carries the same file-wide fix; ESLint applies it once
            fix: buildFix,
          });
        }
      },
    };
  },
});
