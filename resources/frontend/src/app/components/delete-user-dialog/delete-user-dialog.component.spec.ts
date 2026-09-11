import { provideZonelessChangeDetection } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { render, screen } from "@testing-library/angular";
import { type UserEvent, userEvent } from "@testing-library/user-event";
import { beforeAll } from "vitest";

import { type DeleteAdminUserRequest } from "../../../types/admin-users";
import {
  DeleteUserDialogComponent,
  type DeleteUserDialogData,
} from "./delete-user-dialog.component";

/**
 * Rendered as a plain component rather than through `MatDialog.open`, for the
 * same reason `RenameDialogComponent` is: inside a real overlay the CDK focus
 * trap steals focus while `user.type` is still running, and the keystrokes
 * after that are lost. The overlay wiring is covered by the users grid.
 */
describe("DeleteUserDialogComponent", () => {
  let user: UserEvent;

  beforeAll(() => {
    user = userEvent.setup();
  });

  test("names the user in the warning and prefills the subject", async () => {
    await renderDeleteUserDialog();

    expect(
      screen.getByText(
        "A(z) „user001@example.com” felhasználó és minden hozzá tartozó adat véglegesen törlődik.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Tárgy")).toHaveValue(
      "Regisztrációja törlésre került",
    );
  });

  test("hides the reason field until Egyéb is selected", async () => {
    await renderDeleteUserDialog();

    expect(screen.queryByLabelText("Indoklás")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Egyéb" }));

    expect(screen.getByLabelText("Indoklás")).toBeInTheDocument();
  });

  test("blocks the deletion while the reason is required but empty", async () => {
    await renderDeleteUserDialog();

    await user.click(screen.getByRole("radio", { name: "Egyéb" }));

    expect(confirmButton()).toBeDisabled();

    await user.type(
      screen.getByLabelText("Indoklás"),
      "ismétlődő regisztráció",
    );

    expect(confirmButton()).toBeEnabled();
  });

  test("closes with a request carrying no custom reason when the user asked for it", async () => {
    const { close } = await renderDeleteUserDialog();

    await user.click(confirmButton());

    expect(close).toHaveBeenCalledWith({
      subject: "Regisztrációja törlésre került",
      reason: "asked",
      customReason: null,
    } satisfies DeleteAdminUserRequest);
  });

  test("closes with the trimmed custom reason and the edited subject", async () => {
    const { close } = await renderDeleteUserDialog();

    await user.clear(screen.getByLabelText("Tárgy"));
    await user.type(screen.getByLabelText("Tárgy"), "Fiók megszüntetve");

    await user.click(screen.getByRole("radio", { name: "Egyéb" }));
    await user.type(
      screen.getByLabelText("Indoklás"),
      "  ismétlődő regisztráció  ",
    );

    await user.click(confirmButton());

    expect(close).toHaveBeenCalledWith({
      subject: "Fiók megszüntetve",
      reason: "custom",
      customReason: "ismétlődő regisztráció",
    } satisfies DeleteAdminUserRequest);
  });

  test("closes with no value when cancelled", async () => {
    const { close } = await renderDeleteUserDialog();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    expect(close).toHaveBeenCalledWith();
  });

  test("blocks the deletion while the subject is empty", async () => {
    await renderDeleteUserDialog();

    await user.clear(screen.getByLabelText("Tárgy"));

    expect(confirmButton()).toBeDisabled();
  });
});

function confirmButton() {
  return screen.getByRole("button", { name: "Igen, törlés" });
}

async function renderDeleteUserDialog() {
  const close = vi.fn<(request?: DeleteAdminUserRequest) => void>();

  await render(DeleteUserDialogComponent, {
    providers: [
      provideZonelessChangeDetection(),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          email: "user001@example.com",
        } satisfies DeleteUserDialogData,
      },
      { provide: MatDialogRef, useValue: { close } },
    ],
  });

  return { close };
}
