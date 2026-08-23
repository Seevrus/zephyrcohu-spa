import { AG_GRID_LOCALE_HU } from "@ag-grid-community/locale";
import {
  type AutoSizeStrategy,
  ColumnAutoSizeModule,
  LocaleModule,
  type Module,
  PaginationModule,
  type PaginationPanel,
  RowAutoHeightModule,
} from "ag-grid-community";

export const adminGridModules: Module[] = [
  ColumnAutoSizeModule,
  LocaleModule,
  PaginationModule,
  RowAutoHeightModule,
];

export const adminGridAutoSizeStrategy: AutoSizeStrategy = {
  type: "fitGridWidth",
};

export const adminPaginationPanels: PaginationPanel[] = [
  { type: "pageSummary", suppressPageInput: true },
  "rowSummary",
  { type: "pageSize", paginationPageSize: 25 },
];

export const adminGridLocaleText = AG_GRID_LOCALE_HU;
