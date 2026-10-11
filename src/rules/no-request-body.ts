import { AST_NODE_TYPES, ASTUtils, type TSESLint, type TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";
import { isCallTo } from "../utils/twd-calls";

type Scope = TSESLint.Scope.Scope;

// `await twd.waitForRequest(...)` / `await twd.waitForRequests(...)`
const isAwaited = (node: TSESTree.Node | null, method: string) =>
  node?.type === AST_NODE_TYPES.AwaitExpression && isCallTo(node.argument, "twd", method);

// The declarator that created the variable `identifier` refers to, if it is one
const declaratorOf = (identifier: TSESTree.Identifier, scope: Scope) => {
  const definition = ASTUtils.findVariable(scope, identifier)?.defs[0];
  if (definition?.node.type !== AST_NODE_TYPES.VariableDeclarator) return null;
  return { declarator: definition.node, name: definition.name };
};

const isNamed = (node: TSESTree.Node, name: string) =>
  (node.type === AST_NODE_TYPES.Identifier && node.name === name) ||
  (node.type === AST_NODE_TYPES.Literal && node.value === name);

// Is `node` a single rule returned by waitForRequest(s)?
const isRule = (node: TSESTree.Node, scope: Scope): boolean => {
  // (await twd.waitForRequest("a"))
  if (isAwaited(node, "waitForRequest")) return true;

  // rules[0] or (await twd.waitForRequests([...]))[0]
  if (node.type === AST_NODE_TYPES.MemberExpression && node.computed) {
    return isRuleList(node.object, scope);
  }

  if (node.type === AST_NODE_TYPES.Identifier) {
    const found = declaratorOf(node, scope);
    if (!found) return false;
    const { id, init } = found.declarator;
    // const rule = await twd.waitForRequest("a")
    if (id.type === AST_NODE_TYPES.Identifier) return isAwaited(init, "waitForRequest");
    // const [a, b] = await twd.waitForRequests(["a", "b"])
    if (id.type === AST_NODE_TYPES.ArrayPattern) return isAwaited(init, "waitForRequests");
  }
  return false;
};

// Is `node` the array returned by waitForRequests?
const isRuleList = (node: TSESTree.Node, scope: Scope) => {
  if (isAwaited(node, "waitForRequests")) return true;
  if (node.type !== AST_NODE_TYPES.Identifier) return false;
  const found = declaratorOf(node, scope);
  return (
    found?.declarator.id.type === AST_NODE_TYPES.Identifier &&
    isAwaited(found.declarator.init, "waitForRequests")
  );
};

// Is `node` a rule's request? `rule.request`, or `request` from `const { request } = await twd.waitForRequest(...)`
const isRuleRequest = (node: TSESTree.Node, scope: Scope) => {
  if (node.type === AST_NODE_TYPES.MemberExpression && !node.computed && isNamed(node.property, "request")) {
    return isRule(node.object, scope);
  }
  if (node.type === AST_NODE_TYPES.Identifier) {
    const found = declaratorOf(node, scope);
    if (found?.declarator.id.type !== AST_NODE_TYPES.ObjectPattern) return false;
    if (!isAwaited(found.declarator.init, "waitForRequest")) return false;
    // the `request` key whose value is this variable (`{ request }` or `{ request: req }`)
    return found.declarator.id.properties.some(
      (property) =>
        property.type === AST_NODE_TYPES.Property &&
        isNamed(property.key, "request") &&
        property.value === found.name,
    );
  }
  return false;
};

export default createRule({
  name: "no-request-body",
  meta: {
    type: "problem",
    docs: { description: "Disallow .request.body on a waitForRequest result" },
    messages: {
      requestIsBody:
        "`{{ object }}` already is the parsed request body, so `.body` is undefined. Read the fields from `{{ object }}` directly. If the payload really has a `body` field, disable this rule for the line.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    return {
      MemberExpression(node) {
        if (!isNamed(node.property, "body")) return;
        if (!isRuleRequest(node.object, sourceCode.getScope(node))) return;

        context.report({
          node: node.property,
          messageId: "requestIsBody",
          data: { object: sourceCode.getText(node.object) },
          // No autofix: a payload with a real `body` field ({ title, body }) is valid,
          // and silently rewriting it would break a correct test.
        });
      },
    };
  },
});
