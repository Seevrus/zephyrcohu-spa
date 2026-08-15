import { ComponentFixture, TestBed } from "@angular/core/testing";

import { IntegraDocumentLinkCellRendererComponent } from "./integra-document-link-cell-renderer.component";

describe("IntegraDocumentLinkCellRendererComponent", () => {
  let component: IntegraDocumentLinkCellRendererComponent;
  let fixture: ComponentFixture<IntegraDocumentLinkCellRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegraDocumentLinkCellRendererComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IntegraDocumentLinkCellRendererComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
