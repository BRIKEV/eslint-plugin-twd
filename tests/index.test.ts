import { describe, expect, it } from "vitest";
import plugin from "../src/index";

describe("eslint-plugin-twd", () => {
  it("should be defined", () => {
    expect(plugin).toBeDefined();
  });
});
