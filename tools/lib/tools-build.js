(() => {
  "use strict";
  const BUILD = "2026.09.07-113700";
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

  function addCss(href) {
    if (document.querySelector(`link[href*="${href.split("?")[0]}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }

  function addScript(src) {
    return new Promise((resolve) => {
      const file = src.split("?")[0];
      if (document.querySelector(`script[src*="${file}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
  }

  function ensureBridgeAssets() {
    addCss("./styles/bridge-shell.css?v=" + encodeURIComponent(BUILD));
    const q = "?v=" + encodeURIComponent(BUILD);
    addScript("./lib/bridge-token.js" + q)
      .then(() => addScript("./lib/unified-bridge-bundle.js" + q))
      .then(() => addScript("./lib/bridge-shell.js" + q));
  }
  ensureBridgeAssets();

  function ensureAdbDialog() {
    if (document.getElementById("adb-getprop-dlg")) return;
    const dlg = document.createElement("dialog");
    dlg.id = "adb-getprop-dlg";
    dlg.className = "memo-dialog adb-getprop-dlg";
    dlg.setAttribute("aria-label", "系统属性 getprop");
    dlg.innerHTML =
      '<div class="memo-dialog-body adb-getprop-dlg-body">' +
      '<div class="label-row"><h2 class="subhead">系统属性</h2><span class="hint tight" id="adb-getprop-meta"></span></div>' +
      '<div class="field-row adb-getprop-toolbar">' +
      '<input id="adb-getprop-search" class="mono" type="search" placeholder="搜索 key 或 value…" autocomplete="off" spellcheck="false" />' +
      '<button type="button" class="ghost-btn" id="adb-getprop-reload">刷新</button></div>' +
      '<div class="channel-meta adb-info adb-getprop-list" id="adb-getprop-list" hidden></div>' +
      '<p class="hint tight" id="adb-getprop-empty" hidden>无匹配项</p>' +
      '<div class="btn-row tool-actions"><button type="button" class="primary-btn" id="adb-getprop-close">关闭</button></div></div>';
    document.body.appendChild(dlg);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureAdbDialog, { once: true });
  } else ensureAdbDialog();

  try {
    if (!document.querySelector("script[data-kidsflash-nav]")) {
      const s = document.createElement("script");
      s.src = "./lib/kids-flash-nav.js?v=" + encodeURIComponent(BUILD);
      s.async = true;
      s.dataset.kidsflashNav = "1";
      document.head.appendChild(s);
    }
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
})();
