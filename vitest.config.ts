import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only our own tests; example/ has *.twd.test.ts files that are TWD tests, not Vitest ones
    include: ["tests/**/*.test.ts"],
  },
});
