const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistBody = {
  email?: unknown;
  website?: unknown;
};

async function readEmail(request: Request): Promise<{ email: string; honeypot: string }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as WaitlistBody;
    return {
      email: typeof body.email === "string" ? body.email : "",
      honeypot: typeof body.website === "string" ? body.website : "",
    };
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    return {
      email: String(form.get("email") ?? ""),
      honeypot: String(form.get("website") ?? ""),
    };
  }

  return { email: "", honeypot: "" };
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { Allow: "POST, OPTIONS" },
    });
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  let parsed: { email: string; honeypot: string };
  try {
    parsed = await readEmail(request);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  if (parsed.honeypot.trim().length > 0) {
    return json({ ok: true });
  }

  const email = parsed.email.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: "invalid_email" }, 400);
  }

  // Placeholder: persist `email` to D1 / KV / Queue when waitlist storage is wired.
  console.log(
    JSON.stringify({
      event: "waitlist_signup",
      at: new Date().toISOString(),
    }),
  );

  return json({ ok: true });
}
