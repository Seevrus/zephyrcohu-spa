import { render, screen } from "@testing-library/angular";

import { ProfileUpdatedComponent } from "./profile-updated.component";

describe("ProfileUpdatedComponent", () => {
  test("renders the email message", async () => {
    await renderProfileUpdatedComponent({
      savedEmail: "test@test.com",
      isPasswordSaved: false,
      savedNewsletter: undefined,
    });

    expect(
      (await screen.findByTestId("zephyr-success-card-content")).innerHTML,
    ).toBe(
      `<p> Új email cím: <strong>test@test.com</strong>. Jelenleg még a korábbi email címe szerepel az adatbázisunkban. Új email címére elküldtük az aktiváláshoz szükséges emailt, mellyel bármikor aktiválhatja az új e-mail címét. <strong>Fontos:</strong> Amennyiben nem kapta meg, kérjük ellenőrizze levélfiókjának Spam (levélszemét) mappáját, mert egyes levelezőrendszerek levélszemétnek minősíthetik a honlap rendszeréből küldött üzeneteket! </p><!--container--><!--container--><!--container--><!--container-->`,
    );
  });

  test("renders the password updated message", async () => {
    await renderProfileUpdatedComponent({
      savedEmail: undefined,
      isPasswordSaved: true,
      savedNewsletter: undefined,
    });

    expect(
      (await screen.findByTestId("zephyr-success-card-content")).innerHTML,
    ).toBe(
      `<!--container--><p> Sikeresen megváltoztatta jelszavát! A következő bejelentkezéskor már ezt az új jelszót kell használnia. </p><!--container--><!--container--><!--container-->`,
    );
  });

  test("renders the newsletter subscribed message", async () => {
    await renderProfileUpdatedComponent({
      savedEmail: undefined,
      isPasswordSaved: false,
      savedNewsletter: true,
    });

    expect(
      (await screen.findByTestId("zephyr-success-card-content")).innerHTML,
    ).toBe(
      `<!--container--><!--container--><p>Sikeresen feliratkozott hírlevelünkre.</p><!--container--><!--container-->`,
    );
  });

  test("renders the newsletter unsubscribed message", async () => {
    await renderProfileUpdatedComponent({
      savedEmail: undefined,
      isPasswordSaved: false,
      savedNewsletter: false,
    });

    expect(
      (await screen.findByTestId("zephyr-success-card-content")).innerHTML,
    ).toBe(
      `<!--container--><!--container--><!--container--><p>Sikeresen leiratkozott hírlevelünkről.</p><!--container-->`,
    );
  });

  test("renders multiple messages", async () => {
    await renderProfileUpdatedComponent({
      savedEmail: "test@test.com",
      isPasswordSaved: true,
      savedNewsletter: false,
    });

    expect(
      (await screen.findByTestId("zephyr-success-card-content")).innerHTML,
    ).toBe(
      `<p> Új email cím: <strong>test@test.com</strong>. Jelenleg még a korábbi email címe szerepel az adatbázisunkban. Új email címére elküldtük az aktiváláshoz szükséges emailt, mellyel bármikor aktiválhatja az új e-mail címét. <strong>Fontos:</strong> Amennyiben nem kapta meg, kérjük ellenőrizze levélfiókjának Spam (levélszemét) mappáját, mert egyes levelezőrendszerek levélszemétnek minősíthetik a honlap rendszeréből küldött üzeneteket! </p><!--container--><p> Sikeresen megváltoztatta jelszavát! A következő bejelentkezéskor már ezt az új jelszót kell használnia. </p><!--container--><!--container--><p>Sikeresen leiratkozott hírlevelünkről.</p><!--container-->`,
    );
  });
});

function renderProfileUpdatedComponent(inputs: {
  savedEmail: string | undefined;
  isPasswordSaved: boolean;
  savedNewsletter: boolean | undefined;
}) {
  return render(ProfileUpdatedComponent, {
    inputs,
  });
}
