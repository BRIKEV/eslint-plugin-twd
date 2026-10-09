import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import rule from "../../src/rules/runner-imports";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("runner-imports", rule, {
  valid: [
    // the correct TWD imports
    `
import { twd, expect } from "twd-js";
import { describe, it, beforeEach, afterEach } from "twd-js/runner";
    `,
    // names that are not runner functions stay where they are
    `import { vi } from "vitest";`,
    `import { assert } from "chai";`,
    // type-only imports do not exist at runtime
    `import type { Mock } from "vitest";`,
    `import { type Mock } from "vitest";`,
    // a namespace import is not a named runner import
    `import * as chai from "chai";`,
  ],
  invalid: [
    // the common case: everything from vitest, split into the two TWD modules
    {
      code: `import { describe, it, expect } from "vitest";`,
      output: `import { describe, it } from "twd-js/runner";\nimport { expect } from "twd-js";`,
      errors: [
        { messageId: "wrongSource", data: { name: "describe", source: "vitest", target: "twd-js/runner" }, column: 10 },
        { messageId: "wrongSource", data: { name: "it", source: "vitest", target: "twd-js/runner" }, column: 20 },
        { messageId: "wrongSource", data: { name: "expect", source: "vitest", target: "twd-js" }, column: 24 },
      ],
    },
    // merge into the TWD imports that are already there, and drop the empty vitest import
    {
      code: `import { twd } from "twd-js";
import { describe, it } from "twd-js/runner";
import { expect, beforeEach } from "vitest";
`,
      output: `import { twd, expect } from "twd-js";
import { describe, it, beforeEach } from "twd-js/runner";
`,
      errors: [{ messageId: "wrongSource" }, { messageId: "wrongSource" }],
    },
    // other vitest names are kept
    {
      code: `import { describe, vi } from "vitest";`,
      output: `import { vi } from "vitest";\nimport { describe } from "twd-js/runner";`,
      errors: [{ messageId: "wrongSource" }],
    },
    // an alias is kept as it is
    {
      code: `import { it as test } from "vitest";`,
      output: `import { it as test } from "twd-js/runner";`,
      errors: [{ messageId: "wrongSource" }],
    },
    // the author's quote style and missing semicolon are kept
    {
      code: `import { it } from 'vitest'`,
      output: `import { it } from 'twd-js/runner'`,
      errors: [{ messageId: "wrongSource" }],
    },
    // expect straight from chai
    {
      code: `import { expect } from "chai";`,
      output: `import { expect } from "twd-js";`,
      errors: [{ messageId: "wrongSource", data: { name: "expect", source: "chai", target: "twd-js" } }],
    },
    // the other test frameworks
    {
      code: `import { describe, it } from "mocha";`,
      output: `import { describe, it } from "twd-js/runner";`,
      errors: [{ messageId: "wrongSource" }, { messageId: "wrongSource" }],
    },
    {
      code: `import { describe, it } from "node:test";`,
      output: `import { describe, it } from "twd-js/runner";`,
      errors: [{ messageId: "wrongSource" }, { messageId: "wrongSource" }],
    },
    {
      code: `import { describe, expect } from "@jest/globals";`,
      output: `import { describe } from "twd-js/runner";\nimport { expect } from "twd-js";`,
      errors: [{ messageId: "wrongSource" }, { messageId: "wrongSource" }],
    },
    // two wrong sources end up in one new import, not two
    {
      code: `import { describe } from "vitest";
import { it } from "mocha";
`,
      output: `import { describe, it } from "twd-js/runner";
`,
      errors: [{ messageId: "wrongSource" }, { messageId: "wrongSource" }],
    },
  ],
});
