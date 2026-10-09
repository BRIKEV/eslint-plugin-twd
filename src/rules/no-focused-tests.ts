import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

const TEST_FUNCTIONS = ["it", "describe"];

// `it.only` (Identifier) or `it["only"]` (Literal)
const isOnly = (property: TSESTree.Node) =>
  (property.type === AST_NODE_TYPES.Identifier && property.name === "only") ||
  (property.type === AST_NODE_TYPES.Literal && property.value === "only");

export default createRule({
  name: "no-focused-tests",
  meta: {
    type: "problem",
    docs: { description: "Disallow it.only and describe.only in TWD tests" },
    messages: {
      focusedTest:
        '.only silences every other test, locally and in CI. To run one test, use its play button in the TWD sidebar or `npx twd-cli run --test "name"`.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const { callee } = node;
        if (callee.type !== AST_NODE_TYPES.MemberExpression) return;
        if (callee.object.type !== AST_NODE_TYPES.Identifier) return;
        if (!TEST_FUNCTIONS.includes(callee.object.name)) return;
        if (!isOnly(callee.property)) return;

        context.report({ node: callee.property, messageId: "focusedTest" });
      },
    };
  },
});
