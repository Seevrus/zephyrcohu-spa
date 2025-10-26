import { render, screen } from "@testing-library/angular";

import { RegisterAlreadyExistsComponent } from "./register-already-exists.component";

describe("Register - User already exists Component", () => {
  test("should render the component", async () => {
    await renderRegisterAlreadyExistsComponent();

    expect(
      (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
    ).toEqual(
      `<p>Ezzel az e-mail címmel korábban már regisztráltak honlapunkon.</p><p> Bejelentkezéshez kérjük <a routerlink="/bejelentkezes" class="zephyr-link on-error" href="/bejelentkezes">kattintson ide</a>. </p><p> Amennyiben elfelejtette a jelszavát, TODO: <a href="index.php?content=pwdrecover" class="zephyr-link on-error">ide kattintva tud új jelszót létrehozni</a>. </p><p> Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link on-error" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p>`,
    );
  });
});

function renderRegisterAlreadyExistsComponent() {
  return render(RegisterAlreadyExistsComponent);
}
