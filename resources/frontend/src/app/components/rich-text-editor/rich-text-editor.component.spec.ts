import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from "@angular/core";
import { form } from "@angular/forms/signals";
import { render, screen } from "@testing-library/angular";

import { RichTextEditorComponent } from "./rich-text-editor.component";

@Component({
  selector: "app-rich-text-editor-host",
  imports: [RichTextEditorComponent],
  template: `<app-rich-text-editor [field]="contentForm.content" />`,
})
class RichTextEditorHostComponent {
  private readonly contentModel = signal({ content: "" });
  protected readonly contentForm = form(this.contentModel);
}

describe("RichTextEditorComponent", () => {
  test("renders without throwing when bound to a signal form field", async () => {
    await render(RichTextEditorHostComponent, {
      providers: [provideZonelessChangeDetection()],
    });

    expect(screen.getByTestId("rich-text-editor")).toBeInTheDocument();
  });
});
