import "./styles.css";
import { bindWaitlistForm } from "./waitlist";

const PROMPT =
  "a dusk platformer. the moon is a puzzle. jump to tilt gravity.";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initNav(): void {
  const header = document.getElementById("site-header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initPrompt(): void {
  const line = document.getElementById("prompt-line");
  const actor = document.querySelector<HTMLElement>("[data-hero-stage] .stage-actor");
  if (!line) return;

  if (prefersReducedMotion()) {
    line.textContent = PROMPT;
    actor?.classList.add("is-in");
    return;
  }

  line.replaceChildren();
  const text = document.createElement("span");
  const cursor = document.createElement("span");
  cursor.className = "prompt-cursor";
  cursor.setAttribute("aria-hidden", "true");
  line.append(text, cursor);

  let index = 0;
  const tick = () => {
    index += 1;
    text.textContent = PROMPT.slice(0, index);
    if (index === 18) {
      actor?.classList.add("is-in");
    }
    if (index < PROMPT.length) {
      window.setTimeout(tick, index > 24 ? 26 : 40);
    } else {
      cursor.classList.add("is-done");
      actor?.classList.add("is-in");
    }
  };

  window.setTimeout(tick, 280);
}

function initReveal(): void {
  const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (prefersReducedMotion()) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
  );

  nodes.forEach((node) => io.observe(node));
}

function initStory(): void {
  const steps = document.querySelectorAll<HTMLElement>("[data-story-step]");
  const stage = document.querySelector<HTMLElement>("[data-story-stage]");
  if (!steps.length || !stage) return;

  const activate = (step: HTMLElement) => {
    const id = step.dataset.storyStep ?? "door";
    stage.dataset.active = id;
    steps.forEach((node) => node.classList.toggle("is-active", node === step));
  };

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) {
        activate(visible.target as HTMLElement);
      }
    },
    { threshold: [0.35, 0.55, 0.75], rootMargin: "-18% 0px -28% 0px" },
  );

  steps.forEach((step) => io.observe(step));
}

function initDials(): void {
  const gravity = document.querySelector<HTMLInputElement>("#dial-gravity");
  const moon = document.querySelector<HTMLInputElement>("#dial-moon");
  const jump = document.querySelector<HTMLInputElement>("#dial-jump");
  const moonEl = document.querySelector<HTMLElement>("[data-dial-moon]");
  const actor = document.querySelector<HTMLElement>("[data-dial-actor]");
  const gravityRead = document.querySelector('[data-dial-readout="gravity"]');
  const moonRead = document.querySelector('[data-dial-readout="moon"]');
  const jumpRead = document.querySelector('[data-dial-readout="jump"]');

  const paint = () => {
    const g = Number(gravity?.value ?? 120) / 100;
    const m = Number(moon?.value ?? 80) / 100;
    const j = Number(jump?.value ?? 40) / 10;
    if (gravityRead) gravityRead.textContent = g.toFixed(2);
    if (moonRead) moonRead.textContent = m.toFixed(2);
    if (jumpRead) jumpRead.textContent = j.toFixed(1);
    if (moonEl) {
      const size = 2.2 + m * 1.6;
      moonEl.style.width = `${size}rem`;
      moonEl.style.height = `${size}rem`;
    }
    if (actor) {
      actor.style.setProperty("bottom", `${4.2 + (j - 4) * 0.35}rem`);
      actor.style.animationDuration = `${Math.max(1.4, 2.8 / g)}s`;
      actor.classList.add("is-in");
    }
  };

  gravity?.addEventListener("input", paint);
  moon?.addEventListener("input", paint);
  jump?.addEventListener("input", paint);
  paint();
}

function initHotReload(): void {
  const state = document.querySelector("[data-swap-state]");
  const ms = document.querySelector("[data-swap-ms]");
  const flash = document.querySelector<HTMLElement>("[data-swap-flash]");
  const line = document.querySelector("[data-hot-line]");
  if (!state || !ms || !flash || !line) return;

  let swap = 47;
  const gravities = ["1.15", "1.22", "1.08", "1.18"];

  const tick = () => {
    swap = swap >= 90 ? 12 : swap + 1;
    const duration = 640 + ((swap * 37) % 562);
    state.textContent = `swap ${swap}/90 · ${duration}ms`;
    ms.textContent = `${duration}ms`;
    line.textContent = `  world.gravity = ${gravities[swap % gravities.length]};`;
    flash.hidden = false;
    window.setTimeout(() => {
      flash.hidden = true;
    }, 420);
  };

  const mock = document.querySelector('[data-mock="reload"]');
  if (!mock || prefersReducedMotion()) return;

  let timer: ReturnType<typeof window.setInterval> | undefined;
  const io = new IntersectionObserver((entries) => {
    const on = entries.some((entry) => entry.isIntersecting);
    if (on && timer === undefined) {
      timer = window.setInterval(tick, 2400);
    } else if (!on && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  });
  io.observe(mock);
}

function initWaitlists(): void {
  document.querySelectorAll<HTMLFormElement>("[data-waitlist-form]").forEach(bindWaitlistForm);
}

initNav();
initPrompt();
initReveal();
initStory();
initDials();
initHotReload();
initWaitlists();
