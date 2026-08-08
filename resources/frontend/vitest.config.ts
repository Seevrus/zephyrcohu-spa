import { defineConfig } from "vitest/config";

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    hookTimeout: 30000,
    setupFiles: ["vitest.setup.ts"],
    testTimeout: 30000,
  },
});
