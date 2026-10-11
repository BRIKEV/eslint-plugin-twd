import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts", // the ESLint plugin
    cli: "src/cli/index.ts", // the twd-lint command
  },
  format: ["esm"],
  dts: { entry: { index: "src/index.ts" } },
  clean: true,
});
