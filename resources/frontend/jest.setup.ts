import "@testing-library/jest-dom";

import zoneless from "jest-preset-angular/setup-env/zoneless/index.js";

Object.defineProperty(document, "doctype", {
  value: "<!DOCTYPE html>",
});

Object.defineProperty(window, "getComputedStyle", {
  value: () => ({
    display: "none",
    appearance: ["-webkit-appearance"],
  }),
});

/**
 * ISSUE: https://github.com/angular/material2/issues/7101
 * Workaround for JSDOM missing transform property
 */
Object.defineProperty(document.body.style, "transform", {
  value: () => ({
    enumerable: true,
    configurable: true,
  }),
});

HTMLCanvasElement.prototype.getContext = jest.fn();

zoneless.setupZonelessTestEnv();
