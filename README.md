# AstroMitra Admin — React Frontend

A React (Vite) admin dashboard for the AstroMitra backend's `/api/admin/*`
API. This is a completely standalone project — **nothing in the
`astromitra-kundli-api` backend was touched or needs to change** for this
to work, since the backend already has CORS enabled by default.

## Run it

```bash
npm install
npm run dev
```
Opens at `http://localhost:5173`. Requires Node.js ≥ 18.

For a production build:
```bash
npm run build      # outputs static files to dist/
npm run preview    # serve that build locally to sanity-check it
```
`dist/` is plain static HTML/CSS/JS — host it anywhere (Netlify, S3,
nginx, etc).

## Configure the backend URL

On the login screen, click **"Backend connection settings"** and enter
your backend's URL (default assumed: `http://localhost:3000`). This is
saved in the browser's `localStorage`, so you only set it once per
browser/device.

## Log in

Use the admin email/password configured in the backend's `.env`
(`ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`). This frontend does not create,
invite, or manage admin accounts — there is exactly one admin account,
configured entirely on the backend.

## Project structure

```
src/
  main.jsx              React entry point
  App.jsx                Router setup (react-router-dom) + provider tree
  api.js                 fetch() wrapper: base URL, auth header, error shape
  AuthContext.jsx         login/logout/session state
  ToastContext.jsx        success/error toast notifications
  styles.css              design system (CSS variables, components) — plain
                          CSS, no CSS-in-JS/framework
  components/
    Layout.jsx             sidebar + topbar + content wrapper
    Sidebar.jsx             nav links, active-state highlighting, logout
    Modal.jsx               reusable modal (used for detail/create/delete)
    ProtectedRoute.jsx      redirects to /login if not authenticated
  pages/
    Login.jsx               sign-in form + chart-wheel visual
    Dashboard.jsx           stat cards + 7-day usage bar chart
    Kundlis.jsx             search/list/detail/activate/deactivate/delete
    AiKeys.jsx               add/edit/remove Gemini & Groq keys, rotation health
    AiSettings.jsx           edit the live system prompt / instructions
```

No CSS framework, no component library — plain CSS with a small set of
reusable classes (`.card`, `.btn`, `.badge`, `.table-wrap`, etc.) shared
across pages via `styles.css`.

## What's here

| Page | What it does |
|---|---|
| Login | Sign in |
| Dashboard | Stat cards (total/today Kundlis, chat questions, AI requests, success rate) + a 7-day usage bar chart |
| Kundli records | Search/list Kundli records, view full detail (chart JSON + credit status), activate/deactivate, delete |
| AI provider keys | Add/edit/remove Gemini & Groq API keys (masked — raw keys are never returned by the backend after creation), see each key's rotation health (active/cooling-down/inactive, success/failure counts) |
| AI prompt settings | Edit the system prompt and Vedic-astrology interpretation instructions used by `/api/chat/ask` — changes are live immediately, no backend restart |

## Notes

- The JWT session token is stored in `localStorage`; logging out clears
  it. It expires per the backend's `ADMIN_JWT_EXPIRES_IN` setting (default
  12h) — any `401` response bounces you back to the login screen.
- This talks directly to the backend from the browser via `fetch()` in
  default `cors` mode. The backend's `Access-Control-Allow-Origin: *`
  permits this from any origin; its `Cross-Origin-Resource-Policy:
  same-origin` header (set by `helmet`) does **not** affect this, since
  CORP only applies to `no-cors`-mode requests (e.g. `<img>`/`<script>`
  tags), not standard `fetch()` calls — verified against MDN's Fetch spec
  documentation, not assumed.
- No API key, password, or JWT secret is ever visible in this frontend's
  code or network responses beyond the session token itself and masked key
  previews (e.g. `AIza****7890`) — matching the backend's own
  never-expose-raw-keys design.
- If you deploy the backend somewhere with `CORS_ORIGIN` restricted to a
  specific domain (rather than the default `*`), make sure it includes
  wherever you host this frontend, or the browser will block requests.
