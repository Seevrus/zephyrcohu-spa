// @ts-check

import eslint from "@eslint/js";
import angular from "angular-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import promisePlugin from "eslint-plugin-promise";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.builtin,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      sourceType: "module",
    },
    settings: {
      "import/extensions": [".js", ".ts"],
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: ["tsconfig.app.json", "tsconfig.json", "tsconfig.spec.json"],
        },
      },
    },
  },
  eslintConfigPrettier,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    plugins: {
      unicorn,
    },
    rules: {
      "unicorn/filename-case": [
        "error",
        {
          cases: {
            camelCase: true,
            kebabCase: true,
            pascalCase: true,
          },
        },
      ],
      "unicorn/no-array-callback-reference": "off",
      "unicorn/no-array-for-each": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/no-await-expression-member": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/no-null": "off",
      "unicorn/no-useless-switch-case": "off",
      "unicorn/no-useless-undefined": [
        "error",
        {
          checkArguments: false,
        },
      ],
      "unicorn/prevent-abbreviations": [
        "error",
        {
          replacements: {
            args: false,
            curr: false,
            env: false,
            idx: false,
            opts: false,
            params: false,
            prev: false,
            prod: false,
            prop: false,
            props: false,
            ref: false,
          },
        },
      ],
    },
  },
  {
    files: ["**/*.ts"],
    extends: [
      ...angular.configs.tsRecommended,
      eslint.configs.recommended,
      importPlugin.flatConfigs.recommended,
      promisePlugin.configs["flat/recommended"],
      sonarjs.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "@typescript-eslint/consistent-type-exports": [
        "error",
        {
          fixMixedExportsWithInlineTypeSpecifier: true,
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "inline-type-imports",
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "arrow-body-style": ["error", "as-needed"],
      "default-param-last": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-default-export": "error",
      "import/no-duplicates": "error",
      "import/no-unused-modules": ["warn", { unusedExports: true }],
      "max-params": "error",
      "no-console": "warn",
      "no-debugger": "error",
      "no-nested-ternary": "error",
      "no-unneeded-ternary": "error",
      "prefer-arrow-callback": "error",
      "promise/always-return": "off",
      "promise/catch-or-return": "off",
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-redundant-jump": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  {
    ignores: [".angular", "node_modules/"],
  },
);
