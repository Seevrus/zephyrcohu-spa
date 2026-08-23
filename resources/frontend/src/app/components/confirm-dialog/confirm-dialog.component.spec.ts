import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { screen } from "@testing-library/angular";
import { type UserEvent, userEvent } from "@testing-library/user-event";
import { firstValueFrom } from "rxjs";
import { beforeAll } from "vitest";

import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
} from "./confirm-dialog.component";

describe("ConfirmDialogComponent", () => {
  let user: UserEvent;

  beforeAll(() => {
    user = userEvent.setup();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  test("renders the title, message and warning", async () => {
    openDialog({
      title: "Hír törlése",
      message: "Biztosan törölni szeretnéd a(z) „Cím” című hírt?",
      warning: "A hírhez tartozó linkek is törlődnek.",
    });

    await expect(screen.findByText("Hír törlése")).resolves.toBeInTheDocument();

    expect(
      screen.getByText("Biztosan törölni szeretnéd a(z) „Cím” című hírt?"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("A hírhez tartozó linkek is törlődnek."),
    ).toBeInTheDocument();
  });

  test("has an accessible name from the title", async () => {
    openDialog({ title: "Hír törlése", message: "Biztosan?" });

    await expect(
      screen.findByRole("dialog", { name: "Hír törlése" }),
    ).resolves.toBeInTheDocument();
  });

  test("closes with true when the confirm button is clicked", async () => {
    const dialogRef = openDialog({
      title: "Hír törlése",
      message: "Biztosan?",
    });

    await user.click(await screen.findByRole("button", { name: "Törlés" }));

    await expect(firstValueFrom(dialogRef.afterClosed())).resolves.toBe(true);
  });

  test("closes with false when the cancel button is clicked", async () => {
    const dialogRef = openDialog({
      title: "Hír törlése",
      message: "Biztosan?",
    });

    await user.click(await screen.findByRole("button", { name: "Mégsem" }));

    await expect(firstValueFrom(dialogRef.afterClosed())).resolves.toBe(false);
  });

  test("uses the provided confirm and cancel labels", async () => {
    openDialog({
      title: "Hír törlése",
      message: "Biztosan?",
      confirmLabel: "Végleges törlés",
      cancelLabel: "Vissza",
    });

    await expect(
      screen.findByRole("button", { name: "Végleges törlés" }),
    ).resolves.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Vissza" })).toBeInTheDocument();
  });
});

function openDialog(data: ConfirmDialogData) {
  const dialog = TestBed.inject(MatDialog);
  return dialog.open(ConfirmDialogComponent, { data });
}
