# ontrike.com

Public marketing site for **Trike** — an AI-native game studio in a box.

Describe a game. A live world appears. Steer it in chat or in code. Ship a link strangers can play. Studio, CLI, and MCP share one API.

- Product: **Trike**
- Engine: **Amber**
- Editor: **Trike Studio**
- Domain: [ontrike.com](https://ontrike.com)

Brand tokens and marks live in [`BRAND.md`](./BRAND.md) and [`public/brand/`](./public/brand/).

## Local development

```bash
npm install
npm run dev
```

Vite serves the site at `http://localhost:5173`. The waitlist form `POST`s JSON to `/api/waitlist`. In `npm run dev`, Vite stubs that route so the UI can be exercised without Cloudflare.

```bash
npm run build
npm run preview
```

`preview` is static only — the waitlist endpoint is not stubbed there. To exercise the Pages Function locally:

```bash
npm run pages:dev
```

That builds to `dist/` and runs `wrangler pages dev dist`.

## Deploy (Cloudflare Pages)

This repo is a static Vite app plus a Pages Function for the waitlist.

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Root | `/` |
| Production domain | `ontrike.com` |

`wrangler.jsonc` sets `pages_build_output_dir` to `./dist` and `compatibility_date` to `2026-08-12`.

Connect the GitHub repo in the Cloudflare dashboard (Workers & Pages → Create → Pages) and attach the custom domain `ontrike.com`. Preview URLs come for free on each branch/PR.

Direct upload, if you ever need it:

```bash
npm run build
npx wrangler pages deploy dist --project-name=ontrike
```

## Waitlist

Client: [`src/waitlist.ts`](./src/waitlist.ts)  
Edge: [`functions/api/waitlist.ts`](./functions/api/waitlist.ts)

The function validates email (and ignores honeypot bots) then returns `{ ok: true }`. It does **not** persist yet — look for the `Placeholder` comment in the function and wire D1, KV, or a Queue when you’re ready. The form UI already has validation, error, and success states.

## Stack

- Vite + TypeScript (no UI framework)
- CSS variables mirroring the Resin palette in `BRAND.md`
- Cloudflare Pages (static `dist/` + `functions/`)
