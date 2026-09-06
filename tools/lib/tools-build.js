(() => {
  "use strict";
  const BUILD = "2026.09.06-084200";
  window.TOOLS_BUILD = BUILD;
  window.TOOLS_VERSION = BUILD;

  function paintVersion() {
    const el = document.getElementById("site-tools-version");
    if (!el) return;
    el.textContent = `v${BUILD}`;
    el.title = `工具页逻辑版本 ${BUILD}`;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", paintVersion, { once: true });
  } else paintVersion();

  try { localStorage.setItem("devtools-seen-build-v1", BUILD); } catch (_) {}

  try {
    const synth = window.speechSynthesis;
    if (synth && !synth.__devtoolsSpeakPatched) {
      synth.__devtoolsSpeakPatched = true;
      const origSpeak = synth.speak.bind(synth);
      const origCancel = synth.cancel.bind(synth);
      synth.cancel = function () {
        try { origCancel(); } catch (_) {}
        try { if (synth.paused) synth.resume(); } catch (_) {}
      };
      synth.speak = function (utterance) {
        if (!utterance) return;
        try { if (synth.paused) synth.resume(); } catch (_) {}
        try { origSpeak(utterance); } catch (_) {}
      };
    }
  } catch (_) {}

  try {
    if (!document.querySelector("script[data-kidsflash-nav]")) {
      const s = document.createElement("script");
      s.src = "./lib/kids-flash-nav.js?v=" + encodeURIComponent(BUILD);
      s.async = true;
      s.dataset.kidsflashNav = "1";
      document.head.appendChild(s);
    }
  } catch (_) {}

  function recoverTruncatedIndex() {
    if (window.__devtoolsIndexRecover) return;
    const hasShell = document.getElementById("workspace-panels") && document.querySelector("script[src*='panel-loader']");
    if (hasShell) return;
    window.__devtoolsIndexRecover = true;
    const urls = [
      "./index.html?_fresh=" + encodeURIComponent(BUILD),
      "https://cdn.jsdelivr.net/gh/Afra55/Afra55.github.io@42a234664a0b5bac6e54bbc3eb4c8c5aff3811b5/tools/index.html",
    ];
    const tryUrl = (i) => {
      if (i >= urls.length) {
        try { window.DevToolsBoot?.finish?.(); } catch (_) {}
        return;
      }
      fetch(urls[i], { cache: "no-store" })
        .then((r) => (r.ok ? r.text() : Promise.reject()))
        .then((html) => {
          if (!html || html.indexOf("workspace-panels") < 0 || html.indexOf("<placeholder") >= 0) {
            throw new Error("bad index");
          }
          const next = html.split("2026.09.05-133404").join(BUILD).split("2026.09.06-083100").join(BUILD);
          document.open();
          document.write(next);
          document.close();
        })
        .catch(() => tryUrl(i + 1));
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => tryUrl(0), { once: true });
    } else tryUrl(0);
  }
  recoverTruncatedIndex();

  window.setTimeout(() => {
    try { window.DevToolsBoot?.finish?.(); } catch (_) {}
  }, 8000);
})();
