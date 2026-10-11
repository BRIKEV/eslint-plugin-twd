import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import rule from "../../src/rules/no-missing-await";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

// Wrap a snippet in an async test, the way it sits in a real TWD file
const inTest = (body: string) => `it("t", async () => {\n${body}\n});`;

ruleTester.run("no-missing-await", rule, {
  valid: [
    // awaited
    inTest(`await twd.visit("/");`),
    inTest(`await userEvent.click(button);`),
    inTest(`const el = await screenDom.findByRole("button");`),
    inTest(`await twd.url().should("contain.url", "/todos");`),

    // returned, explicitly or as an arrow body
    `async function open() { return twd.visit("/"); }`,
    `const open = () => twd.visit("/");`,

    // handled as a promise
    inTest(`await Promise.all([twd.waitForRequest("a"), twd.waitForRequest("b")]);`),
    inTest(`await Promise.allSettled([twd.waitForRequest("a")]);`),
    inTest(`twd.visit("/").then(() => {});`),
    inTest(`twd.visit("/").catch(() => {});`),
    // `void` is an explicit "I mean not to wait"
    inTest(`void twd.visit("/");`),

    // stored in a variable that is used later
    inTest(`const p = twd.waitForRequest("a");\nawait userEvent.click(save);\nawait p;`),
    inTest(`const p = twd.waitForRequest("a");\nawait Promise.all([p]);`),

    // passed to something else: we cannot know what it does with it, so we stay quiet
    inTest(`await waitForBoth(twd.waitForRequest("a"));`),

    // synchronous TWD APIs are never reported
    inTest(`twd.should(el, "be.visible");`),
    inTest(`twd.setInputValue(input, "a");`),
    inTest(`twd.mockComponent("Chart", FakeChart);`),
    inTest(`twd.clearRequestMockRules();`),
    inTest(`twd.clearComponentMocks();`),
    inTest(`twd.getRequestCount("a");`),
    inTest(`twd.getRequestCounts();`),
    inTest(`twd.getRequestMockRules();`),
    inTest(`twd.url();`),
    inTest(`screenDom.getByText("Save");`),
    inTest(`screenDom.queryByText("Save");`),
    inTest(`screenDom.getAllByRole("listitem");`),
    inTest(`screenDom.queryAllByRole("listitem");`),
    inTest(`userEvent.setup();`),

    // userEvent.setup() results, awaited
    inTest(`const user = userEvent.setup();\nawait user.click(button);`),
    inTest(`await userEvent.setup().type(input, "a");`),

    // a `user` that is not a userEvent.setup() result is not ours
    inTest(`const user = { click() {} };\nuser.click();`),
    // scope matters: this `user` is the function parameter, not the setup() result
    `const user = userEvent.setup();\nfunction helper(user) { user.click(); }`,

    // same names on other objects are not ours
    inTest(`router.visit("/");`),
    inTest(`page.waitFor(() => true);`),
  ],
  invalid: [
    // the basics, with autofix inside an async function
    {
      code: inTest(`twd.visit("/");`),
      output: inTest(`await twd.visit("/");`),
      errors: [{ messageId: "missingAwait", data: { name: "twd.visit" }, line: 2, column: 1, endColumn: 15 }],
    },
    {
      code: inTest(`userEvent.click(button);`),
      output: inTest(`await userEvent.click(button);`),
      errors: [{ messageId: "missingAwait", data: { name: "userEvent.click" } }],
    },
    {
      code: inTest(`screenDom.findByRole("button");`),
      output: inTest(`await screenDom.findByRole("button");`),
      errors: [{ messageId: "missingAwait", data: { name: "screenDom.findByRole" } }],
    },
    {
      code: inTest(`screenDomGlobal.findAllByText("a");`),
      output: inTest(`await screenDomGlobal.findAllByText("a");`),
      errors: [{ messageId: "missingAwait" }],
    },
    {
      code: inTest(`screen.findByText("a");`),
      output: inTest(`await screen.findByText("a");`),
      errors: [{ messageId: "missingAwait" }],
    },
    {
      code: inTest(`twd.url().should("contain.url", "/todos");`),
      output: inTest(`await twd.url().should("contain.url", "/todos");`),
      errors: [{ messageId: "missingAwait", data: { name: "twd.url().should" } }],
    },

    // every async twd method from the spec
    ...[
      `twd.get("button")`,
      `twd.getAll("li")`,
      `twd.mockRequest("a", { method: "GET", url: "/a", response: {} })`,
      `twd.waitForRequest("a")`,
      `twd.waitForRequests(["a", "b"])`,
      `twd.waitFor(() => true)`,
      `twd.wait(100)`,
      `twd.notExists(".spinner")`,
      `twd.initRequestMocking()`,
      `twd.matchLayout(el, "home")`,
    ].map((call) => ({
      code: inTest(`${call};`),
      output: inTest(`await ${call};`),
      errors: [{ messageId: "missingAwait" as const }],
    })),

    // userEvent.setup() results are async too
    {
      code: inTest(`const user = userEvent.setup();\nuser.type(input, "a");`),
      output: inTest(`const user = userEvent.setup();\nawait user.type(input, "a");`),
      errors: [{ messageId: "missingAwait", data: { name: "user.type" } }],
    },
    {
      code: inTest(`userEvent.setup().click(button);`),
      output: inTest(`await userEvent.setup().click(button);`),
      errors: [{ messageId: "missingAwait", data: { name: "userEvent.setup().click" } }],
    },

    // one report per missing await
    {
      code: inTest(`twd.visit("/");\nuserEvent.click(button);`),
      output: inTest(`await twd.visit("/");\nawait userEvent.click(button);`),
      errors: [{ messageId: "missingAwait", line: 2 }, { messageId: "missingAwait", line: 3 }],
    },

    // a condition in front does not handle the promise
    {
      code: inTest(`isMobile && userEvent.click(menu);`),
      output: inTest(`isMobile && await userEvent.click(menu);`),
      errors: [{ messageId: "missingAwait" }],
    },

    // not inside an async function: report, but no fix (`await` would be a syntax error)
    {
      code: `it("t", () => {\ntwd.visit("/");\n});`,
      output: null,
      errors: [{ messageId: "missingAwait" }],
    },
    {
      code: `function open() { twd.visit("/"); }`,
      output: null,
      errors: [{ messageId: "missingAwait" }],
    },

    // stored in a variable that is never used: report, no fix
    {
      code: inTest(`const p = twd.waitForRequest("a");`),
      output: null,
      errors: [{ messageId: "promiseNeverUsed", data: { name: "twd.waitForRequest", variable: "p" } }],
    },
  ],
});
