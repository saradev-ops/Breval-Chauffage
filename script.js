// Année du footer
document.getElementById("year").textContent = new Date().getFullYear();

// Header : bordure au scroll
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Menu mobile
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  toggle.setAttribute("aria-label", open ? "Ouvrir le menu" : "Fermer le menu");
  nav.classList.toggle("is-open", !open);
});
nav.addEventListener("click", (e) => {
  if (e.target.matches("a")) {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  }
});

// Thermostat : la température monte doucement jusqu'à la consigne
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const tempEl = document.getElementById("temp");
if (!reduceMotion) {
  let t = 17.0;
  const target = 20.5;
  const tick = () => {
    t = Math.min(target, t + 0.1);
    tempEl.textContent = t.toFixed(1).replace(".", ",");
    if (t < target) setTimeout(tick, 70);
  };
  tick();
}

// Filtres des réalisations
const filters = document.querySelectorAll(".filter");
const projects = document.querySelectorAll(".project");
filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.dataset.filter;
    filters.forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    projects.forEach((p) => {
      const show = cat === "all" || p.dataset.cat === cat;
      p.hidden = !show;
      p.classList.remove("is-entering");
      if (show) { void p.offsetWidth; p.classList.add("is-entering"); }
    });
  });
});

// Apparition au scroll
const revealTargets = document.querySelectorAll(".section-head, .service, .project, .steps li, .contact-grid > *");
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((el) => { el.classList.add("reveal"); io.observe(el); });
}

// Formulaire de contact
const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");

const rules = {
  nom: (v) => v.trim().length >= 2 || "Indiquez votre nom.",
  tel: (v) => /^(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}$/.test(v.trim()) || "Indiquez un numéro à 10 chiffres, ex. 06 12 34 56 78.",
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Indiquez une adresse e-mail valide, ex. nom@domaine.fr.",
  message: (v) => v.trim().length >= 10 || "Décrivez votre besoin en quelques mots (10 caractères minimum).",
};

function validateField(id) {
  const input = document.getElementById(id);
  const result = rules[id](input.value);
  const error = document.getElementById(`${id}-error`);
  const ok = result === true;
  input.setAttribute("aria-invalid", String(!ok));
  if (ok) input.removeAttribute("aria-describedby");
  else input.setAttribute("aria-describedby", error.id);
  error.textContent = ok ? "" : result;
  return ok;
}

Object.keys(rules).forEach((id) => {
  const input = document.getElementById(id);
  input.addEventListener("blur", () => { if (input.value) validateField(id); });
  input.addEventListener("input", () => {
    if (input.getAttribute("aria-invalid") === "true") validateField(id);
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.className = "form-status";
  status.textContent = "";

  const invalid = Object.keys(rules).filter((id) => !validateField(id));
  if (invalid.length) {
    document.getElementById(invalid[0]).focus();
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Envoi en cours…";

  try {
    const endpoint = form.dataset.endpoint;
    if (endpoint) {
      const res = await fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(res.status);
    } else {
      await new Promise((r) => setTimeout(r, 700)); // mode démo
    }
    form.reset();
    status.classList.add("is-success");
    status.textContent = "Demande envoyée. On vous rappelle dans la journée ouvrée.";
  } catch {
    status.classList.add("is-error");
    status.textContent = "L'envoi a échoué. Réessayez, ou appelez le 04 78 00 00 00.";
  } finally {
    button.disabled = false;
    button.textContent = "Envoyer ma demande";
  }
});
