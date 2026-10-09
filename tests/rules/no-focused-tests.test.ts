import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import rule from "../../src/rules/no-focused-tests";

// RuleTester needs to know which test framework it's running inside
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("no-focused-tests", rule, {
  valid: [
    // add code strings that must NOT be reported
    `
    import { twd, userEvent, screenDom } from "twd-js";
    import { describe, it } from "twd-js/runner";

    describe("Hello World Page", () => {
      it("should display the welcome title and counter button", async () => {
        await twd.visit("/");
      });
    });
    `,
    // .skip is fine: it hides one test, it does not silence the rest
    `it.skip("later", async () => {});`,
    `describe.skip("later", () => {});`,
    // "only" on some other object is not ours
    `items.only(1);`,
    `const only = () => {}; only();`,
    // text inside a string is not code — this is why we use the AST, not a regex
    `it("does not use it.only", async () => {});`,
  ],
  invalid: [
    // { code: "...", errors: [{ messageId: "focusedTest" }] },
    {
      code: `
        import { twd, userEvent, screenDom } from "twd-js";
        import { describe, it } from "twd-js/runner";

        describe("Hello World Page", () => {
          it.only("should display the welcome title and counter button", async () => {
            await twd.visit("/");
          });
        });
      `,
      errors: [{ messageId: "focusedTest" }],
    },
    {
      code: `
        import { twd, userEvent, screenDom } from "twd-js";
        import { describe, it } from "twd-js/runner";

        describe.only("Hello World Page", () => {
          it("should display the welcome title and counter button", async () => {
            await twd.visit("/");
          });
        });
      `,
      errors: [{ messageId: "focusedTest" }],
    },
    // every .only is reported, not just the first
    {
      code: `
        describe.only("A", () => {
          it.only("a", async () => {});
        });
      `,
      errors: [{ messageId: "focusedTest" }, { messageId: "focusedTest" }],
    },
    // computed access is the same thing written differently
    {
      code: `it["only"]("a", async () => {});`,
      errors: [{ messageId: "focusedTest" }],
    },
    // the underline goes on "only", not on the whole call
    {
      code: `it.only("a", async () => {});`,
      errors: [{ messageId: "focusedTest", line: 1, column: 4, endColumn: 8 }],
    },
  ],
});
