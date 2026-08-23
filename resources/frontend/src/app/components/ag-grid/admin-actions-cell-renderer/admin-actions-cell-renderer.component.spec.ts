import { provideZonelessChangeDetection } from "@angular/core";
import { render, screen } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import {
  type AdminActionParameters,
  AdminActionsCellRendererComponent,
  type AdminRowAction,
} from "./admin-actions-cell-renderer.component";

type TestRow = { id: number; title: string };

describe("AdminActionsCellRendererComponent", () => {
  test("renders only the requested actions, in order", async () => {
    await renderCellRenderer({
      actions: ["edit", "delete"],
      onAction: vi.fn<(action: AdminRowAction, row: TestRow) => void>(),
    });

    const buttons = screen.getAllByRole("button");

    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAccessibleName("Szerkesztés: Test title");
    expect(buttons[1]).toHaveAccessibleName("Törlés: Test title");
  });

  test("every button has an aria-label including the row's identity", async () => {
    await renderCellRenderer({
      actions: ["info", "edit", "email", "delete"],
      rowLabel: (row) => row.title,
      onAction: vi.fn<(action: AdminRowAction, row: TestRow) => void>(),
    });

    expect(
      screen.getByRole("button", { name: "Részletek: Test title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Szerkesztés: Test title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Email küldése: Test title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Törlés: Test title" }),
    ).toBeInTheDocument();
  });

  test("calls onAction with the action and the row when clicked", async () => {
    const onAction = vi.fn<(action: AdminRowAction, row: TestRow) => void>();
    await renderCellRenderer({ actions: ["edit"], onAction });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Szerkesztés/ }));

    expect(onAction).toHaveBeenCalledWith("edit", {
      id: 1,
      title: "Test title",
    });
  });
});

async function renderCellRenderer(params: {
  actions: readonly AdminRowAction[];
  onAction: (action: AdminRowAction, row: TestRow) => void;
  rowLabel?: (row: TestRow) => string;
}) {
  const testRow: TestRow = { id: 1, title: "Test title" };

  const renderResult = await render(AdminActionsCellRendererComponent, {
    providers: [provideZonelessChangeDetection()],
  });

  const componentInstance = renderResult.fixture
    .componentInstance as AdminActionsCellRendererComponent<TestRow>;

  componentInstance.agInit({
    data: testRow,
    rowLabel: (row: TestRow) => row.title,
    ...params,
  } as unknown as AdminActionParameters<TestRow>);
  renderResult.fixture.detectChanges();
  await renderResult.fixture.whenStable();

  return renderResult;
}
