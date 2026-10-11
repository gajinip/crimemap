import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["unit/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json-summary"],
      include: ["../src/utils/**/*.ts"],
    },
  },
});