import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";

import { testQueryClient } from "../../../mocks/testQueryClient";
import { NewsArticleComponent } from "./news-article.component";

describe("NewsArticleComponent", () => {
  let component: NewsArticleComponent;
  let fixture: ComponentFixture<NewsArticleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsArticleComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(testQueryClient),
        provideRouter([{ path: "hirek", children: [] }]),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsArticleComponent);
    fixture.componentRef.setInput("id", "1");
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  test("should create", () => {
    expect(component).toBeDefined();
  });
});
