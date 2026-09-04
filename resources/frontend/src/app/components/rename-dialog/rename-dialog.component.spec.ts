import { provideZonelessChangeDetection } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { render, screen } from "@testing-library/angular";
import { type UserEvent, userEvent } from "@testing-library/user-event";
import { beforeAll } from "vitest";

import {
  RenameDialogComponent,
  type RenameDialogData,
} from "./rename-dialog.component";

/**
 * Rendered as a plain component rather than through `MatDialog.open`, because
 * this dialog is about what the user types: inside a real overlay the CDK focus
 * trap moves focus to the dialog container while `user.type` is still running
 * (jsdom has no layout, so the trap's tabbable check finds no field to focus),
 * and the keystrokes after that are lost. Without the overlay there is no trap,
 * so typing behaves the way it does in a browser. The overlay wiring — that a
 * page opens this with the right data and acts on its result — is covered by
 * the pages that use it.
 */
describe("RenameDialogComponent", () => {
  let user: UserEvent;

  beforeAll(() => {
    user = userEvent.setup();
  });

  test("renders the title, label and initial value", async () => {
    await renderRenameDialog();

    expect(screen.getByText("Címke átnevezése")).toBeInTheDocument();

    expect(screen.getByLabelText("Címke")).toHaveValue("INTEGRA");
  });

  test("closes with the trimmed value when saved", async () => {
    const { close } = await renderRenameDialog();

    await user.clear(screen.getByLabelText("Címke"));
    await user.type(screen.getByLabelText("Címke"), "  Átnevezve  ");
    await user.click(screen.getByRole("button", { name: "Mentés" }));

    expect(close).toHaveBeenCalledWith("Átnevezve");
  });

  test("closes with the new value when the field is submitted with Enter", async () => {
    const { close } = await renderRenameDialog();

    await user.clear(screen.getByLabelText("Címke"));
    await user.type(screen.getByLabelText("Címke"), "Átnevezve{Enter}");

    expect(close).toHaveBeenCalledWith("Átnevezve");
  });

  test("closes with undefined when cancelled", async () => {
    const { close } = await renderRenameDialog();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    expect(close).toHaveBeenCalledWith();
  });

  test("disables save when the value is empty", async () => {
    await renderRenameDialog();

    await user.clear(screen.getByLabelText("Címke"));

    expect(screen.getByRole("button", { name: "Mentés" })).toBeDisabled();
  });

  test("keeps an empty value from being submitted with Enter", async () => {
    const { close } = await renderRenameDialog();

    await user.clear(screen.getByLabelText("Címke"));
    await user.type(screen.getByLabelText("Címke"), "{Enter}");

    expect(close).not.toHaveBeenCalled();
  });

  test("shows the provided error message", async () => {
    await renderRenameDialog({
      errorMessage: "Ilyen nevű címke már létezik.",
    });

    expect(
      screen.getByText("Ilyen nevű címke már létezik."),
    ).toBeInTheDocument();
  });

  test("uses the provided confirm and cancel labels", async () => {
    await renderRenameDialog({
      confirmLabel: "Átnevezés",
      cancelLabel: "Vissza",
    });

    expect(
      screen.getByRole("button", { name: "Átnevezés" }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Vissza" })).toBeInTheDocument();
  });
});

async function renderRenameDialog(data: Partial<RenameDialogData> = {}) {
  const close = vi.fn<(value?: string) => void>();

  await render(RenameDialogComponent, {
    providers: [
      provideZonelessChangeDetection(),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          title: "Címke átnevezése",
          label: "Címke",
          initialValue: "INTEGRA",
          ...data,
        } satisfies RenameDialogData,
      },
      { provide: MatDialogRef, useValue: { close } },
    ],
  });

  return { close };
}
