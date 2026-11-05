import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

/**
 * @testing-library/jest-dom still augments the pre-v5 single-parameter `Assertion<T>`.
 * Vitest 5 expects custom matchers to be declared on `Matchers<R, T>`.
 */
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars, @typescript-eslint/consistent-type-definitions
  interface Matchers<R = any, T = any> extends TestingLibraryMatchers<any, R> {}
}
