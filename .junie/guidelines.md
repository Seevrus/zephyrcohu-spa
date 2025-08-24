# Project Guidelines

This document summarizes the conventions, organization, and testing practices used in this repository. The project is split into two main parts:

- Laravel API (root of the repo)
- Single Page Application (SPA) in resources\frontend (Angular)

Note: Do not analyze or modify vendor or node_modules.


## 1) Coding Conventions

### 1.1 PHP / Laravel
- Language and framework
  - PHP: ^8.2
  - Laravel: ^12.x
  - Autoload: PSR-4 (App\\ => app\\, Tests\\ => tests\\)
- Code style and formatter
  - Laravel Pint is used with the "laravel" preset and custom rules (see pint.json):
    - same-line opening braces for classes, functions, anonymous classes/functions, and control structures
    - control structure continuation on the same line
    - indentation_type enforced
    - "elseif" fixer disabled (prefer `else if` style where applicable)
  - Pint is configured to exclude resources\\frontend (do not run Pint on the SPA).
  - Typical commands:
    - Composer script: `composer pint`
    - Direct: `vendor\bin\pint`
- Structure and naming
  - PSR-4 namespaces under App\\.
  - Controllers in App\\Http\\Controllers (e.g., UserController) using thin-controller approach.
  - Form Request validation in App\\Http\\Requests (e.g., ConfirmEmailRequest, CreateUserRequest, LoginRequest).
  - API Resources in App\\Http\\Resources (e.g., UserResource, ErrorResource) to normalize JSON responses.
  - Mailables in App\\Mail (e.g., UserRegistered).
  - Domain models in App\\Models (e.g., User, UserNew, etc.).
  - Class names: StudlyCaps (PascalCase). Methods and variables: camelCase.
- Routing and middleware
  - API routes are defined in routes\\api.php (e.g., /api/users/*) using grouped routes and controller routing.
  - Authentication: Laravel Sanctum; protected routes with `auth:sanctum` middleware.
- Error handling and responses
  - Prefer returning API Resources for success and structured error payloads (ErrorResource) with appropriate HTTP status.
  - Use Gates/Policies for authorization checks (e.g., `Gate::inspect(...)`).

### 1.2 TypeScript / Angular (SPA)
- Framework and tooling
  - Angular 19; managed with Angular CLI.
  - Package manager: pnpm (packageManager set to pnpm@9.x)
- Linting and formatting
  - ESLint 9 with angular-eslint, and additional plugins (import, promise, sonarjs, unicorn, simple-import-sort).
  - Prettier 3 for formatting. Keep ESLint and Prettier in sync; use eslint-config-prettier to avoid rule conflicts.
  - Scripts:
    - Lint: `pnpm -C resources\frontend lint`
    - Prettier check: `pnpm -C resources\frontend run format:check`
    - Prettier write: `pnpm -C resources\frontend run format:write`
- Naming and file layout
  - Components: PascalCase class names; files typically `*.component.ts`.
  - Services: `*.service.ts` with `@Injectable()` classes named `SomethingService`.
  - Modules: `*.module.ts` named `SomethingModule`.
  - Tests: colocated `*.spec.ts` files for unit tests.


## 2) Code Organization and Package Structure

### 2.1 Laravel API (server)
- app\\
  - Http\\Controllers\\: API controllers (e.g., UserController)
  - Http\\Requests\\: Request validation (FormRequests)
  - Http\\Resources\\: API resources for consistent response shapes
  - Models\\: Eloquent models
  - Mail\\: Mailables sent by the API
  - Providers\\, Policies\\, etc.: standard Laravel locations
- routes\\
  - api.php: API endpoints (e.g., `Route::controller(UserController::class)->prefix('users')...`)
  - web.php: not primary for SPA (SPA assets live under resources\\frontend)
- config\\, database\\, bootstrap\\, storage\\: standard Laravel directories
- public\\: web root for the Laravel app
- tests\\: backend tests (Feature and Unit)

### 2.2 SPA (client)
- resources\\frontend\\
  - Angular workspace managed by Angular CLI
  - src\\app\\: application modules, components, services
  - Unit tests colocated as `*.spec.ts`
  - Tooling configured via package.json (ng, eslint, prettier, karma/jasmine)


## 3) Testing Guidelines

### 3.1 Backend (Laravel)
- Frameworks: PHPUnit with Pest available (dev dependency). Existing tests under tests\\Feature use Pest-style `describe`/`test`.
- Test suites (phpunit.xml):
  - Unit: tests under tests\\Unit with suffix `Test.php`
  - Feature: tests under tests\\Feature with suffix `Test.php`
- Environment:
  - phpunit.xml sets testing env vars (e.g., `APP_ENV=testing`, array drivers, `QUEUE_CONNECTION=sync`, and a dedicated `DB_DATABASE`). Ensure your local testing database is configured accordingly before running tests.
- Running tests (PowerShell on Windows):
  - All backend tests (Pest/PhpUnit via Artisan): `php artisan test`
  - Pest directly: `vendor\bin\pest`
  - PHPUnit directly: `vendor\bin\phpunit`
- Conventions:
  - Place HTTP/route tests under tests\\Feature; unit-level logic under tests\\Unit.
  - Name files with `*Test.php`. Prefer Pest style for new tests to match existing examples.
  - Keep tests isolated and deterministic; seed or reset DB state per test as needed (helpers like reset* functions are used in existing tests).

### 3.2 Frontend (Angular)
- Unit tests: Karma + Jasmine via Angular CLI.
- Running tests:
  - Single run: `pnpm -C resources\frontend test`
  - Watch mode (dev): `pnpm -C resources\frontend ng test`
- Lint and format checks should be part of local pre-commit workflow:
  - `pnpm -C resources\frontend lint`
  - `pnpm -C resources\frontend run format:check`


## 4) Developer Workflow Quick Reference (Windows)
- Format backend code: `composer pint`
- Run backend tests: `php artisan test` (or `vendor\bin\pest`)
- Start SPA dev server: `pnpm -C resources\frontend dev`
- Lint SPA: `pnpm -C resources\frontend lint`
- Format SPA: `pnpm -C resources\frontend run format:write`


## 5) Notes
- Pint is configured to exclude resources\\frontend; use ESLint/Prettier for the SPA instead.
- Avoid checking vendor and node_modules into VCS and do not analyze them.
- The SPA is the UI layer (Angular) and the Laravel project exposes the API (e.g., users registration, login, session management with Sanctum).
