import { type PageEvent } from "@angular/material/paginator";
import { render } from "@testing-library/angular";
import { type UserEvent, userEvent } from "@testing-library/user-event";
import { type Mock } from "vitest";

import { PaginatorHuComponent } from "./paginator-hu.component";

describe("PaginatorHuComponent", () => {
  let onPageChanged: Mock<(event: PageEvent) => void>;
  let user: UserEvent;

  beforeAll(() => {
    onPageChanged = vi.fn<(event: PageEvent) => void>();
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  test("renders with the first page", async () => {
    const { container } = await renderPaginator({
      currentPage: 1,
      disabled: false,
      total: 93,
      pageChanged: onPageChanged,
    });

    expect(
      container.querySelector(".mat-mdc-paginator-page-size"),
    ).toHaveTextContent("Oldalméret:");
    expect(
      container.querySelector(".mat-mdc-paginator-page-size-value"),
    ).toHaveTextContent("10");

    expect(
      container.querySelector(".mat-mdc-paginator-range-label"),
    ).toHaveTextContent("1 / 10 oldal");

    const firstPageButton = container.querySelector(
      'button[aria-label="Első oldal"]',
    );

    expect(firstPageButton).toBeInTheDocument();
    expect(firstPageButton).toHaveAttribute("aria-disabled", "true");

    const previousPageButton = container.querySelector(
      'button[aria-label="Előző"]',
    );

    expect(previousPageButton).toBeInTheDocument();
    expect(previousPageButton).toHaveAttribute("aria-disabled", "true");

    const nextPageButton = container.querySelector(
      'button[aria-label="Következő"]',
    );

    expect(nextPageButton).toBeInTheDocument();
    expect(nextPageButton).not.toHaveAttribute("aria-disabled");

    const lastPageButton = container.querySelector(
      'button[aria-label="Utolsó oldal"]',
    );

    expect(lastPageButton).toBeInTheDocument();
    expect(lastPageButton).not.toHaveAttribute("aria-disabled");
  });

  test("renders in the middle", async () => {
    const { container } = await renderPaginator({
      currentPage: 3,
      disabled: false,
      total: 51,
      pageChanged: onPageChanged,
    });

    expect(
      container.querySelector(".mat-mdc-paginator-range-label"),
    ).toHaveTextContent("3 / 6 oldal");

    const firstPageButton = container.querySelector(
      'button[aria-label="Első oldal"]',
    );

    expect(firstPageButton).not.toHaveAttribute("aria-disabled");

    const previousPageButton = container.querySelector(
      'button[aria-label="Előző"]',
    );

    expect(previousPageButton).not.toHaveAttribute("aria-disabled");

    const nextPageButton = container.querySelector(
      'button[aria-label="Következő"]',
    );

    expect(nextPageButton).not.toHaveAttribute("aria-disabled");

    const lastPageButton = container.querySelector(
      'button[aria-label="Utolsó oldal"]',
    );

    expect(lastPageButton).not.toHaveAttribute("aria-disabled");
  });

  test("can be disabled", async () => {
    const { container } = await renderPaginator({
      currentPage: 3,
      disabled: true,
      total: 51,
      pageChanged: onPageChanged,
    });

    expect(
      container.querySelector(".mat-mdc-paginator-range-label"),
    ).toHaveTextContent("3 / 6 oldal");

    const firstPageButton = container.querySelector(
      'button[aria-label="Első oldal"]',
    );

    expect(firstPageButton).toHaveAttribute("aria-disabled", "true");

    const previousPageButton = container.querySelector(
      'button[aria-label="Előző"]',
    );

    expect(previousPageButton).toHaveAttribute("aria-disabled", "true");

    const nextPageButton = container.querySelector(
      'button[aria-label="Következő"]',
    );

    expect(nextPageButton).toHaveAttribute("aria-disabled", "true");

    const lastPageButton = container.querySelector(
      'button[aria-label="Utolsó oldal"]',
    );

    expect(lastPageButton).toHaveAttribute("aria-disabled", "true");
  });

  test("emits the correct pagination events", async () => {
    const { container } = await renderPaginator({
      currentPage: 4,
      disabled: false,
      total: 93,
      pageChanged: onPageChanged,
    });

    const firstPageButton = container.querySelector(
      'button[aria-label="Első oldal"]',
    );
    const previousPageButton = container.querySelector(
      'button[aria-label="Előző"]',
    );
    const nextPageButton = container.querySelector(
      'button[aria-label="Következő"]',
    );
    const lastPageButton = container.querySelector(
      'button[aria-label="Utolsó oldal"]',
    );

    await user.click(previousPageButton!);

    expect(onPageChanged).toHaveBeenLastCalledWith({
      length: 93,
      pageIndex: 2,
      pageSize: 10,
      previousPageIndex: 3,
    });

    await user.click(nextPageButton!);
    await user.click(nextPageButton!);

    expect(onPageChanged).toHaveBeenLastCalledWith({
      length: 93,
      pageIndex: 4,
      pageSize: 10,
      previousPageIndex: 3,
    });

    await user.click(lastPageButton!);

    expect(onPageChanged).toHaveBeenLastCalledWith({
      length: 93,
      pageIndex: 9,
      pageSize: 10,
      previousPageIndex: 4,
    });

    await user.click(firstPageButton!);

    expect(onPageChanged).toHaveBeenLastCalledWith({
      length: 93,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 9,
    });
  });
});

function renderPaginator({
  currentPage,
  disabled,
  total,
  pageChanged,
}: {
  currentPage: number;
  disabled: boolean;
  total: number;
  pageChanged: (event: PageEvent) => void;
}) {
  return render(PaginatorHuComponent, {
    inputs: {
      currentPage,
      disabled,
      total,
    },
    on: {
      pageChanged,
    },
  });
}
