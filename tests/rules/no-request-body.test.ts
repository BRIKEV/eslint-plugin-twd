import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import rule from "../../src/rules/no-request-body";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

const inTest = (body: string) => `it("t", async () => {\n${body}\n});`;

ruleTester.run("no-request-body", rule, {
  valid: [
    // the right way: request already is the body
    inTest(`const rule = await twd.waitForRequest("create");\nexpect(rule.request.title).to.equal("A");`),
    inTest(`const rule = await twd.waitForRequest("create");\nexpect(rule.request).to.deep.equal({ title: "A" });`),
    inTest(`const rules = await twd.waitForRequests(["a"]);\nexpect(rules[0].request.title).to.equal("A");`),
    // other properties of the rule are fine
    inTest(`const rule = await twd.waitForRequest("create");\nrule.response.body;`),
    // .request.body on anything that is not a waitForRequest result is left alone
    inTest(`const res = await fetch("/a");\nres.request.body;`),
    `app.use((ctx) => ctx.request.body);`,
    inTest(`const rule = getRule();\nrule.request.body;`),
    // scope: this `rule` is the parameter, not the waitForRequest result
    inTest(`const rule = await twd.waitForRequest("a");\nconst check = (rule) => rule.request.body;`),
    // only `.body` exactly
    inTest(`const rule = await twd.waitForRequest("a");\nrule.request.bodyText;`),
  ],
  invalid: [
    // no case has an autofix: a payload can have a real `body` field
    // the spec's example; the underline goes on `body`
    {
      code: inTest(`const rule = await twd.waitForRequest("create");\nexpect(rule.request.body.title).to.equal("A");`),
      errors: [{ messageId: "requestIsBody", data: { object: "rule.request" }, line: 3, column: 21, endColumn: 25 }],
    },
    // straight from the call
    {
      code: inTest(`(await twd.waitForRequest("a")).request.body.title;`),
      errors: [{ messageId: "requestIsBody" }],
    },
    // waitForRequests: an element of the array
    {
      code: inTest(`const rules = await twd.waitForRequests(["a", "b"]);\nrules[1].request.body;`),
      errors: [{ messageId: "requestIsBody", data: { object: "rules[1].request" } }],
    },
    {
      code: inTest(`(await twd.waitForRequests(["a"]))[0].request.body;`),
      errors: [{ messageId: "requestIsBody" }],
    },
    // waitForRequests, destructured
    {
      code: inTest(`const [users, posts] = await twd.waitForRequests(["users", "posts"]);\nposts.request.body;`),
      errors: [{ messageId: "requestIsBody" }],
    },
    // `request` destructured from the rule
    {
      code: inTest(`const { request } = await twd.waitForRequest("a");\nrequest.body.title;`),
      errors: [{ messageId: "requestIsBody", data: { object: "request" } }],
    },
    // optional chaining and computed access are the same mistake
    {
      code: inTest(`const rule = await twd.waitForRequest("a");\nrule.request?.body;`),
      errors: [{ messageId: "requestIsBody" }],
    },
    {
      code: inTest(`const rule = await twd.waitForRequest("a");\nrule.request["body"];`),
      errors: [{ messageId: "requestIsBody" }],
    },
    // every occurrence is reported
    {
      code: inTest(`const rule = await twd.waitForRequest("a");\nrule.request.body.a;\nrule.request.body.b;`),
      errors: [{ messageId: "requestIsBody", line: 3 }, { messageId: "requestIsBody", line: 4 }],
    },
  ],
});
