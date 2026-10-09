import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import rule from "../../src/rules/single-top-level-describe";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("single-top-level-describe", rule, {
  valid: [
    // one root, the rest nested
    `
      describe("Todos", () => {
        describe("List", () => {});
        describe("Create", () => {});
      });
    `,
    // no describe at all
    `it("works", async () => {});`,
    // a describe inside a helper function is not top-level
    `
      describe("Todos", () => {});
      function sharedSuite() {
        describe("Shared", () => {});
      }
    `,
    // describe on some other object is not ours
    `
      describe("Todos", () => {});
      suite.describe("Other", () => {});
    `,
  ],
  invalid: [
    // the second root is reported, the first is left alone
    {
      code: `
describe("List", () => {});
describe("Create", () => {});
      `,
      errors: [{ messageId: "multipleTopLevelDescribes", line: 3, column: 1, endColumn: 9 }],
    },
    // every root after the first is reported
    {
      code: `
describe("A", () => {});
describe("B", () => {});
describe("C", () => {});
      `,
      errors: [
        { messageId: "multipleTopLevelDescribes", line: 3 },
        { messageId: "multipleTopLevelDescribes", line: 4 },
      ],
    },
    // .skip and .only are still roots; the underline covers `describe.skip`
    {
      code: `
describe("A", () => {});
describe.skip("B", () => {});
      `,
      errors: [{ messageId: "multipleTopLevelDescribes", line: 3, column: 1, endColumn: 14 }],
    },
    {
      code: `
describe.only("A", () => {});
describe("B", () => {});
      `,
      errors: [{ messageId: "multipleTopLevelDescribes", line: 3 }],
    },
  ],
});
