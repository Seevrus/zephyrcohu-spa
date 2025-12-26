import "@testing-library/jest-dom";

/**
 * ISSUE: https://github.com/angular/material2/issues/7101
 * Workaround for JSDOM missing transform property
 */
vi.spyOn(document.body.style, "transform", "get");

HTMLCanvasElement.prototype.getContext = vi.fn();
