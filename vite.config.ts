import { defineConfig, type Plugin } from "vite";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function waitlistPlaceholder(): Plugin {
  return {
    name: "waitlist-placeholder",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path !== "/api/waitlist") {
          next();
          return;
        }

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Allow", "POST");
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "method_not_allowed" }));
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });
        req.on("end", () => {
          res.setHeader("Content-Type", "application/json");
          try {
            const raw = Buffer.concat(chunks).toString("utf8");
            const body = raw ? (JSON.parse(raw) as { email?: unknown; website?: unknown }) : {};
            if (typeof body.website === "string" && body.website.length > 0) {
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
            if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: "invalid_email" }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, placeholder: true }));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: "invalid_json" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [waitlistPlaceholder()],
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    cssMinify: true,
  },
});
