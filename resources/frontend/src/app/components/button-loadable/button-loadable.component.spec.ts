import { render, screen } from "@testing-library/angular";

import { ButtonLoadableComponent } from "./button-loadable.component";

describe("ButtonLoadableComponent", () => {
  test("should have the correct content", async () => {
    await renderLoadableButton();

    expect(screen.getByTestId("button-loadable")).toHaveTextContent("Click Me");
  });

  test("should have a disabled state", async () => {
    await renderLoadableButton({ disabled: true });

    expect(screen.getByTestId("button-loadable")).toBeDisabled();
  });

  test("should have a loading state", async () => {
    await renderLoadableButton({ loading: true });

    expect(screen.getByTestId("button-loadable-progress")).toBeInTheDocument();
  });
});

async function renderLoadableButton({
  loading = false,
  disabled = false,
}: { loading?: boolean; disabled?: boolean } = {}) {
  return render(
    `<app-button-loadable [disabled]="${disabled}" [loading]="${loading}">Click Me</app-button-loadable>`,
    {
      imports: [ButtonLoadableComponent],
    },
  );
}
