
/**
 * Süleyman Ay — Interaction Runtime 76–100
 * Real runtime implementation for adaptive interactions.
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(pointer: coarse)");
  const fine = window.matchMedia("(pointer: fine)");

  const perfScore = (() => {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const mobile = coarse.matches;
    let score = Math.min(100, cores * 12 + memory * 10);
    if (mobile) score -= 10;
    return Math.max(20, score);
  })();

  const level = perfScore >= 75 ? 4 : perfScore >= 55 ? 3 : perfScore >= 35 ? 2 : 1;

  root.dataset.motionLevel = reduceMotion.matches ? "0" : String(level);
  root.dataset.pointerMode = coarse.matches ? "touch" : "mouse";

  // 76–79: adaptive touch/card interaction
  const cards = document.querySelectorAll("[data-card], .post-card, .article-card, .blog-card");
  cards.forEach(card => {
    let raf = 0;
    const reset = () => {
      card.style.transform = "";
      card.style.removeProperty("--mx");
      card.style.removeProperty("--my");
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
    };

    if (fine.matches && !reduceMotion.matches && level >= 2) {
      card.addEventListener("pointermove", e => {
        if (e.pointerType !== "mouse") return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          const max = level >= 4 ? 7 : level >= 3 ? 4 : 2;
          card.style.setProperty("--mx", x.toFixed(3));
          card.style.setProperty("--my", y.toFixed(3));
          card.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
          card.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
          card.style.transform =
            `perspective(900px) rotateX(${-y * max}deg) rotateY(${x * max}deg) translateZ(${level >= 3 ? 4 : 2}px)`;
        });
      });
      card.addEventListener("pointerleave", reset);
    }

    if (coarse.matches && !reduceMotion.matches && level >= 2) {
      card.addEventListener("pointermove", e => {
        if (e.pointerType !== "touch") return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const max = level >= 4 ? 5 : level >= 3 ? 3 : 1.5;
        card.style.transform = `perspective(900px) rotateX(${-y * max}deg) rotateY(${x * max}deg)`;
      }, {passive: true});
      card.addEventListener("pointerup", () => {
        card.style.transition = "transform 420ms cubic-bezier(.2,1.4,.3,1)";
        setTimeout(() => { reset(); card.style.transition = ""; }, 420);
      });
    }
  });

  // 80, 83, 84: adaptive internal-link transitions and link micro-interactions
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.hash) return;
    if (reduceMotion.matches) return;
    const target = document.querySelector(url.hash || "");
    if (target && url.hash) {
      e.preventDefault();
      const behavior = level >= 4 ? "smooth" : "smooth";
      target.scrollIntoView({behavior, block: "start"});
      history.pushState(null, "", url.hash);
    }
  });

  // 81: secure external links
  document.querySelectorAll('a[href^="http"]').forEach(a => {
    try {
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) {
        a.target = "_blank";
        const rel = new Set((a.rel || "").split(/\s+/).filter(Boolean));
        rel.add("noopener"); rel.add("noreferrer");
        a.rel = [...rel].join(" ");
        a.classList.add("external-link");
      }
    } catch (_) {}
  });

  // 85–87: adaptive button press/hover
  document.querySelectorAll("button, [role='button'], .button, .btn").forEach(btn => {
    if (reduceMotion.matches) return;
    btn.addEventListener("pointerdown", () => {
      const scale = level >= 4 ? 0.965 : level >= 3 ? 0.975 : 0.985;
      btn.style.transform = `scale(${scale})`;
    });
    const release = () => {
      btn.style.transition = "transform 260ms cubic-bezier(.2,1.4,.3,1)";
      btn.style.transform = "";
      setTimeout(() => btn.style.transition = "", 280);
    };
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("pointerleave", release);
  });

  // 88–94: real save state + adaptive toast
  const toastHost = (() => {
    const el = document.createElement("div");
    el.id = "sa-toast-host";
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    document.body.appendChild(el);
    return el;
  })();

  const hapticAllowed = (() => {
    if (!("vibrate" in navigator)) return false;
    const siteOff = localStorage.getItem("sa-haptic") === "off";
    if (siteOff) return false;
    return !reduceMotion.matches || localStorage.getItem("sa-haptic-force") === "on";
  })();

  const haptic = type => {
    if (!hapticAllowed) return;
    const patterns = {success: [8], info: [5], undo: [5, 35, 8]};
    try { navigator.vibrate(patterns[type] || [5]); } catch (_) {}
  };

  window.SAToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `sa-toast sa-toast-${type}`;
    toast.innerHTML = `<span class="sa-toast-message"></span><button class="sa-toast-close" type="button" aria-label="Kapat">×</button><span class="sa-toast-progress"></span>`;
    toast.querySelector(".sa-toast-message").textContent = message;

    const candidates = ["top-right", "bottom-right", "bottom-center", "top-left"];
    const placement = coarse.matches ? "bottom-center" : candidates[Math.min(level - 1, candidates.length - 1)];
    toast.dataset.placement = placement;
    toastHost.appendChild(toast);

    const close = () => {
      toast.classList.add("is-closing");
      setTimeout(() => toast.remove(), level >= 3 ? 260 : 180);
    };
    toast.querySelector(".sa-toast-close").addEventListener("click", close);

    haptic(type === "success" ? "success" : type === "undo" ? "undo" : "info");
    const timer = setTimeout(close, 3000);
    toast.addEventListener("pointerenter", () => clearTimeout(timer), {once: true});
    toast.addEventListener("pointerup", e => {
      if (coarse.matches && Math.abs(e.clientX) > 30) close();
    }, {passive: true});
  };

  document.querySelectorAll("[data-save], .save-button, [aria-label*='Kaydet']").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.save || btn.closest("[data-post-id]")?.dataset.postId || location.pathname;
      const saved = JSON.parse(localStorage.getItem("sa-saved") || "[]");
      const index = saved.indexOf(key);
      if (index === -1) {
        saved.push(key);
        localStorage.setItem("sa-saved", JSON.stringify(saved));
        btn.setAttribute("aria-pressed", "true");
        btn.classList.add("is-saved");
        window.SAToast?.("Kaydedildi", "success");
      } else {
        saved.splice(index, 1);
        localStorage.setItem("sa-saved", JSON.stringify(saved));
        btn.setAttribute("aria-pressed", "false");
        btn.classList.remove("is-saved");
        window.SAToast?.("Kayıt kaldırıldı", "undo");
      }
    });
  });

  // 96–100: site haptic preference API
  window.SAHaptic = {
    set(enabled) {
      localStorage.setItem("sa-haptic", enabled ? "on" : "off");
    },
    get() {
      return localStorage.getItem("sa-haptic") !== "off";
    },
    pulse(type = "info") {
      haptic(type);
    }
  };
})();
