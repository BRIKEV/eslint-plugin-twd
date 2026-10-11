import { AST_NODE_TYPES, ASTUtils, type TSESLint, type TSESTree } from "@typescript-eslint/utils";

// From twd-js src/twd.ts: the methods typed as returning a Promise
const TWD_ASYNC_METHODS = new Set([
  "visit",
  "get",
  "getAll",
  "mockRequest",
  "waitForRequest",
  "waitForRequests",
  "waitFor",
  "wait",
  "notExists",
  "initRequestMocking",
  "matchLayout",
]);

// Testing Library style query objects; only their findBy* / findAllBy* queries are async
const SCREEN_OBJECTS = new Set(["screenDom", "screenDomGlobal", "screen"]);
const isFindQuery = (method: string) => /^find(All)?By/.test(method);

// `object.method(...)`, non-computed, or null
const memberCall = (node: TSESTree.CallExpression) => {
  const { callee } = node;
  if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.computed) return null;
  if (callee.property.type !== AST_NODE_TYPES.Identifier) return null;
  return { object: callee.object, method: callee.property.name };
};

/** `object.method()` with exactly these names */
export const isCallTo = (node: TSESTree.Node, object: string, method: string) => {
  if (node.type !== AST_NODE_TYPES.CallExpression) return false;
  const call = memberCall(node);
  return (
    call !== null &&
    call.object.type === AST_NODE_TYPES.Identifier &&
    call.object.name === object &&
    call.method === method
  );
};

const isUserEventSetup = (node: TSESTree.Node) => isCallTo(node, "userEvent", "setup");

// Is `name` a variable initialised with `userEvent.setup()`? Uses scope analysis,
// so a parameter or another variable with the same name does not count.
const isSetupResult = (identifier: TSESTree.Identifier, scope: TSESLint.Scope.Scope) => {
  const variable = ASTUtils.findVariable(scope, identifier);
  const definition = variable?.defs[0];
  if (definition?.node.type !== AST_NODE_TYPES.VariableDeclarator) return false;
  const { init } = definition.node;
  return init !== null && isUserEventSetup(init);
};

/** Is this call one of the async TWD / Testing Library APIs? */
export const isAsyncTwdCall = (node: TSESTree.CallExpression, scope: TSESLint.Scope.Scope) => {
  const call = memberCall(node);
  if (!call) return false;
  const { object, method } = call;

  if (object.type === AST_NODE_TYPES.Identifier) {
    if (object.name === "twd") return TWD_ASYNC_METHODS.has(method);
    if (object.name === "userEvent") return method !== "setup";
    if (SCREEN_OBJECTS.has(object.name)) return isFindQuery(method);
    return isSetupResult(object, scope);
  }

  // twd.url().should(...)
  if (isCallTo(object, "twd", "url")) return method === "should";
  // userEvent.setup().click(...)
  if (isUserEventSetup(object)) return true;

  return false;
};
