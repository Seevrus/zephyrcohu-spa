import "@testing-library/jest-dom";

import { provideGlobalGridOptions } from "ag-grid-community";

/**
 * ISSUE: https://github.com/angular/material2/issues/7101
 * Workaround for JSDOM missing transform property
 */
vi.spyOn(document.body.style, "transform", "get");

HTMLCanvasElement.prototype.getContext = vi.fn();

/**
 * ag-grid >= 36.3 renders no rows or cells in jsdom, because the viewport has
 * no layout (0px). Disabling virtualisation makes every row and column render.
 */
provideGlobalGridOptions({
  suppressColumnVirtualisation: true,
  suppressRowVirtualisation: true,
});
