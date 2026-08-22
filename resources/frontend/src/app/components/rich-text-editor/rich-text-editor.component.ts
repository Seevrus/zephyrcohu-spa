import { Component } from "@angular/core";
import { EditorComponent, TINYMCE_SCRIPT_SRC } from "@tinymce/tinymce-angular";

@Component({
  selector: "app-rich-text-editor",
  imports: [EditorComponent],
  providers: [
    { provide: TINYMCE_SCRIPT_SRC, useValue: "/assets/tinymce/tinymce.min.js" },
  ],
  templateUrl: "./rich-text-editor.component.html",
})
export class RichTextEditorComponent {
  protected readonly init: EditorComponent["init"] = {
    promotion: false,
    language: "hu_HU",
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "image",
      "charmap",
      "preview",
      "anchor",
      "searchreplace",
      "visualblocks",
      "code",
      "insertdatetime",
      "media",
      "table",
    ],
    newline_behavior: "linebreak",
    menubar: "edit insert view format table tools",
    toolbar_mode: "wrap",
    toolbar: [
      {
        name: "history",
        items: ["undo", "redo"],
      },
      {
        name: "font",
        items: ["fontfamily", "fontsize"],
      },
      {
        name: "alignment",
        items: ["alignleft", "aligncenter", "alignright", "alignjustify"],
      },
      {
        name: "separation",
        items: ["hr"],
      },
      {
        name: "formatting",
        items: [
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "subscript",
          "superscript",
        ],
      },
      {
        name: "colors",
        items: ["forecolor", "backcolor"],
      },
      {
        name: "lists",
        items: ["bullist", "numlist"],
      },
      {
        name: "tables",
        items: ["table"],
      },
      {
        name: "embed",
        items: ["link", "unlink", "image"],
      },
      {
        name: "charmap",
        items: ["charmap"],
      },
      {
        name: "reformat",
        items: ["removeformat"],
      },
      {
        name: "advancedview",
        items: ["preview", "code"],
      },
    ],
    contextmenu: "cut copy paste | link image inserttable",
    statusbar: false,
    content_css: "default",
    font_family_formats: `Roboto=Roboto,sans-serif; Helvetica="Helvetica Neue",Helvetica,Arial,sans-serif`,
    content_style:
      "@import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');",
  };
}
