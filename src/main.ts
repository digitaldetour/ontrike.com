import "./styles.css";
import { bindWaitlistForm } from "./waitlist";

const WORLDS = ["whale", "kitchen", "gravity", "candy"] as const;

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

function initWorlds(): void {
  const root = document.querySelector<HTMLElement>("[data-worlds]");
  if (!root) return;

  const chips = [...root.querySelectorAll<HTMLButtonElement>(".chip[data-world]")];
  const biomes = [...root.querySelectorAll<HTMLElement>(".biome")];
  const title = root.querySelector<HTMLElement>("[data-world-title]");
  let index = 0;
  let timer = 0;

  const show = (world: string) => {
    root.dataset.world = world;
    chips.forEach((chip) => {
      const on = chip.dataset.world === world;
      chip.classList.toggle("is-on", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
      if (on && title) {
        title.textContent = chip.textContent?.trim() ?? "";
      }
    });
    biomes.forEach((biome) => {
      biome.classList.toggle("is-on", biome.classList.contains(`biome-${world}`));
    });
    const next = WORLDS.indexOf(world as (typeof WORLDS)[number]);
    index = next === -1 ? 0 : next;
  };

  const stopCycle = () => {
    window.clearInterval(timer);
    timer = 0;
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      stopCycle();
      show(chip.dataset.world ?? "whale");
    });
  });

  const requested = new URLSearchParams(window.location.search).get("world");
  const start =
    requested && (WORLDS as readonly string[]).includes(requested)
      ? requested
      : (root.dataset.world ?? "whale");
  show(start);

  if (!prefersReducedMotion() && !requested) {
    timer = window.setInterval(() => {
      index = (index + 1) % WORLDS.length;
      show(WORLDS[index]);
    }, 4500);
  }
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
    const id = step.dataset.storyStep ?? "describe";
    stage.dataset.active = id;
    steps.forEach((node) => node.classList.toggle("is-active", node === step));
  };

  const fromHash = () => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const match = document.querySelector<HTMLElement>(`[data-story-step="${CSS.escape(hash)}"]`);
    if (match) activate(match);
  };

  fromHash();
  window.addEventListener("hashchange", fromHash);

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

function initTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>("[data-tab]");
  const panels = document.querySelectorAll<HTMLElement>("[data-panel]");
  if (!tabs.length) return;

  const select = (id: string) => {
    tabs.forEach((tab) => {
      const on = tab.dataset.tab === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== id;
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      select(tab.dataset.tab ?? "cli");
    });
  });
}

function initCopy(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.copy;
      const target = document.querySelector(`[data-copy-target="${id}"]`);
      if (!target) return;
      const text = target.textContent ?? "";
      try {
        await navigator.clipboard.writeText(text.trim() + "\n");
        const prior = button.textContent;
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = prior;
        }, 1400);
      } catch {
        button.textContent = "Copy failed";
      }
    });
  });
}

function initWaitlists(): void {
  document.querySelectorAll<HTMLFormElement>("[data-waitlist-form]").forEach(bindWaitlistForm);
}

initNav();
initWorlds();
initReveal();
initStory();
initTabs();
initCopy();
initWaitlists();
