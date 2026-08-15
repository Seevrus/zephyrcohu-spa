import { themeQuartz } from "ag-grid-community";

export const zephyrGridTheme = themeQuartz.withParams({
  accentColor: "var(--mat-sys-primary)",
  backgroundColor: "var(--mat-sys-surface)",
  borderColor: "var(--mat-sys-outline-variant)",
  fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
  foregroundColor: "var(--mat-sys-on-surface)",
  headerBackgroundColor: "var(--mat-sys-primary-container)",
  headerTextColor: "var(--mat-sys-on-primary-container)",
  rowHoverColor:
    "color-mix(in srgb, var(--mat-sys-primary-container) 40%, transparent)",
  selectedRowBackgroundColor: "var(--mat-sys-secondary-container)",
  textColor: "var(--mat-sys-on-surface)",
});
