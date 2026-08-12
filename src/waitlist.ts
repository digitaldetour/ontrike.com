const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length > 0 && email.length <= 254 && EMAIL_RE.test(email);
}

export type WaitlistResult =
  | { ok: true }
  | { ok: false; error: "invalid_email" | "network" | "server" };

const WAITLIST_ENDPOINT = "/api/waitlist";

export async function submitWaitlist(email: string, honeypot: string): Promise<WaitlistResult> {
  if (honeypot.trim().length > 0) {
    return { ok: true };
  }

  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    return { ok: false, error: "invalid_email" };
  }

  try {
    const response = await fetch(WAITLIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: trimmed, website: honeypot }),
    });

    if (response.ok) {
      return { ok: true };
    }

    if (response.status === 400) {
      return { ok: false, error: "invalid_email" };
    }

    return { ok: false, error: "server" };
  } catch {
    return { ok: false, error: "network" };
  }
}

export function bindWaitlistForm(form: HTMLFormElement): void {
  const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');
  const honeypot = form.querySelector<HTMLInputElement>('input[name="website"]');
  const errorEl = form.querySelector<HTMLElement>("[data-waitlist-error]");
  const hintEl = form.querySelector<HTMLElement>("[data-waitlist-hint]");
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const successEl = form.parentElement?.querySelector<HTMLElement>("[data-waitlist-success]");

  if (!emailInput || !honeypot || !errorEl || !submitBtn || !successEl) {
    return;
  }

  const showError = (message: string) => {
    errorEl.hidden = false;
    errorEl.textContent = message;
    emailInput.setAttribute("aria-invalid", "true");
    emailInput.setAttribute("aria-describedby", errorEl.id);
  };

  const clearError = () => {
    errorEl.hidden = true;
    errorEl.textContent = "";
    emailInput.removeAttribute("aria-invalid");
    if (hintEl) {
      emailInput.setAttribute("aria-describedby", hintEl.id);
    } else {
      emailInput.removeAttribute("aria-describedby");
    }
  };

  emailInput.addEventListener("input", () => {
    if (!errorEl.hidden) clearError();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const email = emailInput.value;
    if (!isValidEmail(email)) {
      showError("Enter a valid email — something we can actually write to.");
      emailInput.focus();
      return;
    }

    submitBtn.disabled = true;
    const readyLabel = submitBtn.textContent;
    submitBtn.textContent = "Joining…";

    const result = await submitWaitlist(email, honeypot.value);

    if (result.ok) {
      form.hidden = true;
      successEl.hidden = false;
      successEl.focus();
      return;
    }

    submitBtn.disabled = false;
    submitBtn.textContent = readyLabel ?? "Join the waitlist";

    if (result.error === "invalid_email") {
      showError("Enter a valid email — something we can actually write to.");
      emailInput.focus();
      return;
    }

    showError("Couldn’t reach the list just now. Try again in a moment.");
  });
}
