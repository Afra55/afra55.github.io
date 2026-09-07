(() => {
  "use strict";

  const BUILD = window.TOOLS_BUILD || "2026.09.07-114300";
  const mount = () => document.getElementById("workspace-panels");

  const htmlCache = new Map();
  const cssLoaded = new Set();
  const mounted = new Set();
  const inflight = new Map();

  function isForceFreshLoad() {
    try {
      return new URLSearchParams(location.search).has("_fresh");
    } catch (_) {
      return false;
    }
  }

  function fetchInit(extra = {}) {
    return isForceFreshLoad() ? { cache: "no-store", ...extra } : { cache: "default", ...extra };
  }

  function withVersion(src) {
    const url = new URL(src, document.baseURI || window.location.href);
    if (!url.searchParams.has("v")) url.searchParams.set("v", BUILD);
    return url.pathname + url.search;
  }

  async function fetchText(url) {
    const res = await fetch(withVersion(url), fetchInit());
    if (!res.ok) throw new Error(`加载失败：${url} (${res.status})`);
    return res.text();
  }

  function loadPanelHtml(toolId) {
    const id = String(toolId || "").trim();
    if (!id) throw new Error("panel id required");
    if (!isForceFreshLoad() && htmlCache.has(id)) return htmlCache.get(id);
    if (inflight.has(`html:${id}`)) return inflight.get(`html:${id}`);
    const promise = fetchText(`./panels/${id}.html`)
      .then((html) => {
        htmlCache.set(id, html);
        return html;
      })
      .finally(() => inflight.delete(`html:${id}`));
    inflight.set(`html:${id}`, promise);
    return promise;
  }

  function injectStylesheet(id, href) {
    if ([...document.querySelectorAll("link[data-panel-css]")].some(
      (l) => l.dataset.panelCss === id || l.href === href || l.getAttribute("href") === href
    )) {
      cssLoaded.add(id);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.panelCss = id;
    document.head.appendChild(link);
    cssLoaded.add(id);
  }

  function ensurePanelCss(toolId) {
    const id = String(toolId || "").trim();
    if (!id || cssLoaded.has(id)) return;
    if (/earn$/.test(id)) {
      injectStylesheet("kidsflash-shared", withVersion("./styles/panels/kidsflash.css"));
    }
    injectStylesheet(id, withVersion(`./styles/panels/${id}.css`));
  }

  function mountHtml(id, html) {
    const root = mount();
    if (!root) throw new Error("#workspace-panels missing");
    if (document.getElementById(id)) {
      mounted.add(id);
      return document.getElementById(id);
    }
    const wrap = document.createElement("div");
    wrap.innerHTML = html.trim();
    const panel = wrap.firstElementChild;
    if (!panel || panel.id !== id) throw new Error(`panel ${id} markup invalid`);
    root.appendChild(panel);
    mounted.add(id);
    try { window.DevToolsExtraBind?.bind?.(id); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent("devtools:panel-mounted", { detail: { id } })); } catch (_) {}
    return panel;
  }

  async function ensure(toolId) {
    const id = String(toolId || "").trim();
    if (!id) return null;
    ensurePanelCss(id);
    if (mounted.has(id)) {
      try { window.DevToolsExtraBind?.bind?.(id); } catch (_) {}
      try { window.dispatchEvent(new CustomEvent("devtools:panel-mounted", { detail: { id } })); } catch (_) {}
      return document.getElementById(id);
    }
    const html = await loadPanelHtml(id);
    return mountHtml(id, html);
  }

  const bootPromise = (async () => {
    const id = document.documentElement.dataset.bootPanel || "timestamp";
    try {
      await ensure(id);
    } catch (err) {
      console.warn("boot panel failed", id, err);
    }
  })();

  window.DevToolsPanelLoader = { ensure, bootPromise, withVersion };
})();
