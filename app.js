/* CHEMORA shared application layer */
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const KEY_THEME = "chemora-theme";

  // Storage may be unavailable in private/restricted browsing contexts.
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };
  if (storage.get(KEY_THEME) === "light") document.body.classList.add("light");

  // Active navigation.
  document.querySelectorAll(".main-nav a").forEach(a => {
    const href = a.getAttribute("href"); if (!href) return;
    try {
      const target = new URL(href, location.href).pathname.replace(/\/+$/, "");
      const current = location.pathname.replace(/\/+$/, "");
      if (target === current || (target.endsWith("index.html") && (current === "" || current.endsWith("/")))) a.classList.add("active");
      else a.classList.remove("active");
    } catch {}
  });

  // Add AI Assistant to the rail once.
  const nav = $(".main-nav");
  if (nav && !nav.querySelector("[data-ai-nav]")) {
    const ai = document.createElement("a");
    ai.href = "#"; ai.dataset.aiNav = "1"; ai.textContent = "AI Assistant";
    ai.addEventListener("click", e => { e.preventDefault(); window.ChemoraVoice?.open?.(); });
    nav.appendChild(ai);
  }

  // Compact top utility bar matching the reference design.
  if (!$(".cm-top-tools")) {
    const tools = document.createElement("div");
    tools.className = "cm-top-tools";
    tools.innerHTML = `
      <label class="cm-search"><span>⌕</span><input id="cmGlobalSearch" type="search" placeholder="Search chemicals, topics, experiments..." aria-label="Search CHEMORA"></label>
      <button class="cm-tool-btn" id="cmThemeBtn" aria-label="Toggle light appearance" aria-pressed="false">☼</button>
      <button class="cm-tool-btn" id="cmAssistantBtn" aria-label="Open AI assistant">✦</button>`;
    document.body.appendChild(tools);
    const input = $("#cmGlobalSearch");
    input?.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      const q = input.value.trim().toLowerCase(); if (!q) return;
      const local = document.querySelector('#searchInput, #chemicalSearch, #reactionSearch, #globalSearchInput');
      if (local) { local.value = q; local.dispatchEvent(new Event("input", {bubbles:true})); local.dispatchEvent(new Event("change", {bubbles:true})); local.focus(); }
      else {
        const path = location.pathname;
        // Strip the current page/section so search works from /, /index.html,
        // nested static pages, and deployments hosted under a sub-path.
        const sectionMatch = path.match(/^(.*?)(?:\/(?:challenge|experiments|know)(?:\/|$))/);
        let siteRoot;
        if (sectionMatch) {
          siteRoot = sectionMatch[1];
        } else {
          siteRoot = path.replace(/\/index\.html$/, "").replace(/\/account\.html$/, "").replace(/\/$/, "");
        }
        window.location.href = `${location.origin}${siteRoot}/know/know.html?search=${encodeURIComponent(q)}`;
      }
    });
    $("#cmThemeBtn")?.addEventListener("click", () => {
      const light = document.body.classList.toggle("light");
      const button = $("#cmThemeBtn");
      button?.setAttribute("aria-pressed", String(light));
      storage.set(KEY_THEME, light ? "light" : "dark");
    });
    $("#cmAssistantBtn")?.addEventListener("click", () => window.ChemoraVoice?.open?.());
  }


  // Progressive Web App: cache public learning pages for repeat/offline access.
  // Authentication pages and API responses are excluded by the worker.
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(new URL("/service-worker.js", location.origin).toString())
        .catch(() => { /* PWA support is optional; keep the site usable if registration fails. */ });
    }, { once: true });
  }

  // Keep theme/search state compatible with older modules.
  window.ChemoraUI = window.ChemoraUI || {};
  window.ChemoraUI.toast = (message, type="info") => {
    let box = document.querySelector(".chemora-toast");
    if (!box) { box=document.createElement("div"); box.className="chemora-toast"; document.body.appendChild(box); }
    box.textContent=message; box.dataset.type=type; box.classList.add("show"); clearTimeout(box._timer); box._timer=setTimeout(()=>box.classList.remove("show"),2200);
  };
  window.addEventListener("storage", e => { if (e.key && /^chemora/.test(e.key)) window.dispatchEvent(new CustomEvent("chemora:progress")); });
})();

// Subtle 3D pointer depth for reference-style glass cards.
(() => {
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reducedMotion.matches) return;
  const selectors = '.explore-card,.knowledge-card,.level-card,.exp,.stat-card,.bench,.shelf,.profile-head';
  document.querySelectorAll(selectors).forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.setProperty('--rx', `${(-y*3).toFixed(2)}deg`);
      card.style.setProperty('--ry', `${(x*4).toFixed(2)}deg`);
      card.classList.add('cm-3d-hover');
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx','0deg'); card.style.setProperty('--ry','0deg');
    });
  });
})();
