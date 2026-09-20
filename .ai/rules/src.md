---
paths:
  - 'bootstrap/app.php,angular.json,resources/frontend/src/index.html'
---

# Src

## CSP is owned by Angular's autoCsp, not Laravel — keep AddCspHeaders scoped to api only
`angular.json`'s `security.autoCsp: true` bakes a self-sufficient, hash-based CSP `<meta>` tag into the built `zephyr.html` for its own inline bootstrap script/critical-CSS style tags. Since the SPA shell is served as a static prebuilt file (`file_get_contents(public_path('zephyr.html'))` in `routes/web.php`), it can't carry a per-request nonce.

Spatie's `AddCspHeaders` (bootstrap/app.php) sends a nonce-based CSP *header*. A header CSP and a meta CSP are enforced as an intersection by the browser — the header's nonce (which nothing in the static HTML has) ends up blocking exactly the inline tags Angular's own meta policy was designed to allow, breaking styling/scripts app-wide.

Fix in place: `$middleware->api(append: [AddCspHeaders::class])` — scope Laravel's CSP header to `api/*` only, never to the `web` group / SPA route. Don't re-add it globally. See `tests/Feature/CspHeadersTest.php`.
