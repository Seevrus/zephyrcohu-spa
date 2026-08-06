---
name: angular-unit-tester
description: "Writes unit tests for Angular components, services, and directives using Vitest and Angular Testing Library, following the project's established patterns."
---

# Angular Unit Tester

This skill helps create Angular unit tests using Vitest and Angular Testing Library, following the conventions of this project.

## Core Principles

- **Testing Framework:** Use Vitest (`describe`, `test`, `expect`).
- **Rendering and DOM Interaction:** Use `@testing-library/angular` (`render`, `screen`) for component tests.
- **User Events:** Use `@testing-library/user-event` for simulating user interactions.
- **HTTP Client:** Use `provideHttpClient(withFetch())` for enabling fetch.
- **HTTP Mocking:** Use `HttpTestingController` from `@angular/common/http/testing` to mock HTTP requests and responses.
- **Async Operations:** Use `waitFor` for async operations.
- **Component Rendering**: Use the `render` function from `@testing-library/angular`.

## File Structure

- Test files must be located next to the file they are testing.
- Test files must have the `.spec.ts` extension.

## Writing Tests

### 1. Rendering Components

There are two main ways to render a component:

**a) By Component Class (for pages and complex components):**

Use a helper function to render the component with the necessary providers. This keeps tests clean and avoids repetition.

```typescript
async function renderLoginComponent() {
  const renderResult = await render(LoginComponent, {
    initialRoute: "/bejelentkezes",
    providers: [
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([
        {
          path: "bejelentkezes",
          component: LoginComponent,
          title: "Bejelentkezés",
        },
      ]),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
```

**b) By Template (for presentational components):**

For simpler components, especially those that rely on content projection or have multiple `@Input`s, rendering a template string can be more straightforward.

```typescript
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
```

### 2. Providers and `imports`

The `render` function's second argument is a configuration object where you can provide dependencies.

- **`providers`**: Use this for services, HTTP client configuration, and routing.
  - `provideHttpClient(withFetch())`: Always include when the component or its children make HTTP requests.
  - `provideHttpClientTesting()`: Always include when you need to mock and verify HTTP requests.
  - `provideTanStackQuery(testQueryClient)`: Include when testing components that use TanStack Query.
  - `provideRouter([...])`: Include when testing components that have `routerLink` or use the `Router` service.
- **`imports`**: Use this for standalone components, directives, or pipes that are used in the template of the component under test. This is common when rendering a template string.

### 3. Mocking HTTP Calls

Use `HttpTestingController` to mock HTTP requests and flush responses.

**a) Basic HTTP Mocking:**

```typescript
test("should fetch data", async () => {
  const { httpTesting } = await renderMyComponent();

  const request = await waitFor(() =>
    httpTesting.expectOne("/api/data")
  );
  request.flush({ message: "Success" });

  // ... assertions
});
```

**b) Mocking Error Responses:**

You can flush error responses with specific statuses and bodies. Use helper functions to create consistent error objects.

```typescript
// In a mock helper file
export function createLoginErrorResponse(errorCode: string) {
  return {
    errors: [{ code: errorCode }],
  };
}

// In the test
test("should show an error on bad credentials", async () => {
    const { fixture, httpTesting } = await renderLoginComponent();
    // ... fill form and submit

    const request = await waitFor(() => httpTesting.expectOne(loginRequest));

    request.flush(createLoginErrorResponse("BAD_CREDENTIALS"), {
      status: 401,
      statusText: "Unauthorized",
    });

    await expect(
      screen.findByTestId("bad-credentials-error"),
    ).resolves.toBeInTheDocument();
});
```

**c) Verifying Requests:**

Always call `httpTesting.verify()` at the end of a test to ensure that there are no outstanding requests.

### 4. Testing Services

To test a service, create a simple test host component that injects and uses the service.

```typescript
@Component({
  selector: "app-fixture",
  template: `
    <div data-testid="error-message">
      {{ myService.errorMessage() }}
    </div>
  `
})
class TestComponent {
  readonly myService = inject(MyService);
}

describe("MyService", () => {
  beforeEach(async () => {
    await render(TestComponent, {
      providers: [
        MyService,
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        provideTanStackQuery(testQueryClient),
      ],
    });
  });

  test("should set error message on failure", async () => {
    // ... trigger service method and mock http call
    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent("An error occurred");
    });
  });
});
```

### 5. Mocking Navigation

Use `vi.spyOn` from Vitest to spy on the `Router.navigate` method.

```typescript
test("should navigate on success", async () => {
    const { httpTesting } = await renderLoginComponent();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    // ... fill form, submit, and mock successful http response

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/"]);
    });

    navigateSpy.mockRestore();
});
```
