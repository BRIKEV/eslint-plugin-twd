import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

// `describe(...)`, `describe.skip(...)` or `describe.only(...)`
const isDescribe = (callee: TSESTree.Expression) =>
  (callee.type === AST_NODE_TYPES.Identifier && callee.name === "describe") ||
  (callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    callee.object.name === "describe");

// A statement that sits directly in the file, not inside a function or block
const isTopLevel = (node: TSESTree.CallExpression) =>
  node.parent.type === AST_NODE_TYPES.ExpressionStatement &&
  node.parent.parent.type === AST_NODE_TYPES.Program;

export default createRule({
  name: "single-top-level-describe",
  meta: {
    type: "problem",
    docs: { description: "Require a single top-level describe per TWD test file" },
    messages: {
      multipleTopLevelDescribes:
        "The TWD runner needs one top-level describe per file. Nest this describe inside the first one.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // create() runs once per file, so this count is per file
    let topLevelDescribes = 0;

    return {
      CallExpression(node) {
        if (!isDescribe(node.callee)) return;
        if (!isTopLevel(node)) return;

        topLevelDescribes++;
        if (topLevelDescribes === 1) return;

        context.report({ node: node.callee, messageId: "multipleTopLevelDescribes" });
      },
    };
  },
});
