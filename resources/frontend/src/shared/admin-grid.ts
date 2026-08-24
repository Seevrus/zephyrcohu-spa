import { AG_GRID_LOCALE_HU } from "@ag-grid-community/locale";
import {
  CellStyleModule,
  type ColDef,
  ColumnAutoSizeModule,
  LocaleModule,
  type Module,
  PaginationModule,
  type PaginationPanel,
  RowAutoHeightModule,
} from "ag-grid-community";

export const adminGridModules: Module[] = [
  CellStyleModule,
  ColumnAutoSizeModule,
  LocaleModule,
  PaginationModule,
  RowAutoHeightModule,
];

export const adminGridDefaultColumnDefinition: ColDef = {
  cellClass: "ag-grid-admin-grid-cell",
  flex: 1,
  minWidth: 120,
};

export const adminPaginationPanels: PaginationPanel[] = [
  { type: "pageSummary", suppressPageInput: true },
  "rowSummary",
  { type: "pageSize", paginationPageSize: 25 },
];

export const adminGridLocaleText = AG_GRID_LOCALE_HU;
