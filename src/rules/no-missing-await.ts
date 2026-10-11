import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";
import { isAsyncTwdCall } from "../utils/twd-calls";

// Climb past nodes that pass the promise through unchanged
// (`a && call()`, `c ? call() : x`, `call()!`, `call() as T`, `user?.click()`)
const outerExpression = (node: TSESTree.Node) => {
  let child = node;
  let parent = node.parent!;
  while (
    parent.type === AST_NODE_TYPES.ChainExpression ||
    parent.type === AST_NODE_TYPES.TSNonNullExpression ||
    parent.type === AST_NODE_TYPES.TSAsExpression ||
    (parent.type === AST_NODE_TYPES.LogicalExpression && parent.right === child) ||
    (parent.type === AST_NODE_TYPES.ConditionalExpression && parent.test !== child)
  ) {
    child = parent;
    parent = parent.parent!;
  }
  return { child, parent };
};

const isInsideAsyncFunction = (node: TSESTree.Node) => {
  for (let current = node.parent; current; current = current.parent) {
    if (
      current.type === AST_NODE_TYPES.FunctionDeclaration ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.ArrowFunctionExpression
    ) {
      return current.async;
    }
  }
  return false;
};

export default createRule({
  name: "no-missing-await",
  meta: {
    type: "problem",
    docs: { description: "Require async TWD calls to be awaited" },
    fixable: "code",
    messages: {
      missingAwait:
        "`{{ name }}()` returns a promise. Add `await`, or the test moves on before it finishes.",
      promiseNeverUsed:
        "The promise from `{{ name }}()` is stored in `{{ variable }}` but never used. Await it, or the test moves on before it finishes.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    return {
      CallExpression(node) {
        if (!isAsyncTwdCall(node, sourceCode.getScope(node))) return;
        const name = sourceCode.getText(node.callee);
        const { child, parent } = outerExpression(node);

        // A statement on its own: nothing waits for it. Anything else (await, return,
        // .then, Promise.all, void, an argument) handles the promise or might.
        if (parent.type === AST_NODE_TYPES.ExpressionStatement) {
          context.report({
            node,
            messageId: "missingAwait",
            data: { name },
            fix: isInsideAsyncFunction(node)
              ? (fixer) => fixer.insertTextBefore(node, "await ")
              : null,
          });
          return;
        }

        // `const p = twd.waitForRequest(...)` is fine as long as `p` is read later
        if (
          parent.type === AST_NODE_TYPES.VariableDeclarator &&
          parent.init === child &&
          parent.id.type === AST_NODE_TYPES.Identifier
        ) {
          const [variable] = sourceCode.getDeclaredVariables(parent);
          if (variable.references.some((reference) => reference.isRead())) return;
          context.report({
            node,
            messageId: "promiseNeverUsed",
            data: { name, variable: parent.id.name },
          });
        }
      },
    };
  },
});
