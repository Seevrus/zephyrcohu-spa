import { defineConfig } from "vitest/config";

// eslint-disable-next-line import/no-default-export, import/no-unused-modules
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["vitest.setup.ts"],
  },
});
