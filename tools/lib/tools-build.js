(() => {
  "use strict";
  /** 全站构建版本（北京时间后缀）。每次合入功能/修复必须递增此号，并运行 node tools/bump-version.cjs 同步 ?v=。 */
  const BUILD = "2026.09.06-075000";
  window.TOOLS_BUILD = BUILD;
  window.TOOLS_VERSION = BUILD;

  function paintVersion() {
    const el = document.getElementById("site-tools-version");
    if (!el) return;
    el.textContent = `v${BUILD}`;
    el.title = `工具页逻辑版本 ${BUILD}（更新后应看到此号变化）`;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", paintVersion, { once: true });
  } else {
    paintVersion();
  }

  const SEEN_KEY = "devtools-seen-build-v1";
  try {
    const prev = localStorage.getItem(SEEN_KEY);
    localStorage.setItem(SEEN_KEY, BUILD);
    if (prev && prev !== BUILD) {
      window.__devtoolsBuildUpgraded = { from: prev, to: BUILD };
    }
  } catch (_) {}

  try {
    const synth = window.speechSynthesis;
    if (synth && !synth.__devtoolsSpeakPatched) {
      synth.__devtoolsSpeakPatched = true;
      const origSpeak = synth.speak.bind(synth);
      const origCancel = synth.cancel.bind(synth);
      const resume = () => {
        try {
          if (synth.paused) synth.resume();
        } catch (_) {}
      };
      synth.cancel = function patchedCancel() {
        try {
          origCancel();
        } catch (_) {}
        resume();
      };
      synth.speak = function patchedSpeak(utterance) {
        if (!utterance) return;
        resume();
        try {
          origSpeak(utterance);
        } catch (_) {}
      };
    }
  } catch (_) {}

  // iOS PWA：不透明状态栏 + 顶部/抽屉让出刘海。不改桌面。
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
      ".nav-bar,.nav-bar.is-collapsed{" +
      "padding-top:env(safe-area-inset-top,0px)!important;" +
      "padding-left:0.85rem!important;padding-right:0.85rem!important;}" +
      ".nav-drawer-head{padding-top:0.35rem;}}}";
    document.head.appendChild(st);
  }
})();
