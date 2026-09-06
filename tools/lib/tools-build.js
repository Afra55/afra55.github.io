(() => {
  "use strict";
  const BUILD = "2026.09.06-091200";
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

  if (!document.getElementById("devtools-shell-guard-css")) {
    const st = document.createElement("style");
    st.id = "devtools-shell-guard-css";
    st.textContent =
      "#theme-dlg[hidden] .theme-presets,#theme-dlg[hidden] #theme-presets{display:none!important;}" +
      ".kidsflash-nav-speak,.kidsflash-nav-speak .primary-btn,.kidsflash-next-main{width:100%!important;min-height:2.7rem!important;}" +
      ".kidsflash-nav-random{display:none!important;}" +
      ".kidsflash-nav-step [id$='-next']{background:color-mix(in srgb,var(--accent,#2ec4b6) 28%,transparent)!important;border-color:color-mix(in srgb,var(--accent,#2ec4b6) 65%,var(--line,#3a4458))!important;font-weight:700!important;}";
    document.head.appendChild(st);
  }

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

  window.setTimeout(() => {
    try { window.DevToolsBoot?.finish?.(); } catch (_) {}
  }, 8000);
})();
