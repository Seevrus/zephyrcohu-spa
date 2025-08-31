/** @jest-config-loader esbuild-register */

/* eslint-disable import/no-default-export, import/no-unused-modules */

import { type Config } from "jest";
import angularPresets from "jest-preset-angular/presets";

export default {
  ...angularPresets.createCjsPreset(),
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testTimeout: 30000,
} satisfies Config;
