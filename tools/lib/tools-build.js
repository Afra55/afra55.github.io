(() => {
  "use strict";
  const BUILD = "2026.09.06-081700";
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

  try {
    localStorage.setItem("devtools-seen-build-v1", BUILD);
  } catch (_) {}

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
    const bar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (bar) bar.setAttribute("content", "black");
  } catch (_) {}
  if (!document.getElementById("devtools-ios-safe")) {
    const st = document.createElement("style");
    st.id = "devtools-ios-safe";
    st.textContent =
      "@supports (padding-top: env(safe-area-inset-top)){" +
      "@media (max-width: 900px){" +
      "body{padding-top:env(safe-area-inset-top,0px);}" +
      ".site-header{padding-top:0.85rem;}" +
      ".nav-bar,.nav-bar.is-collapsed{padding-top:env(safe-area-inset-top,0px)!important;padding-left:0.85rem!important;padding-right:0.85rem!important;}" +
      ".nav-drawer-head{padding-top:0.35rem;}}}";
    document.head.appendChild(st);
  }

  try {
    if (!document.querySelector("script[data-kidsflash-nav]")) {
      const s = document.createElement("script");
      s.src = "./lib/kids-flash-nav.js?v=" + encodeURIComponent(BUILD);
      s.async = true;
      s.dataset.kidsflashNav = "1";
      document.head.appendChild(s);
    }
  } catch (_) {}
})();
