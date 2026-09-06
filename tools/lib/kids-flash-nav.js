(() => {
  "use strict";
  if (window.__kidsflashNavV2) return;
  window.__kidsflashNavV2 = true;

  if (!document.getElementById("kidsflash-nav-v2-css")) {
    const st = document.createElement("style");
    st.id = "kidsflash-nav-v2-css";
    st.textContent =
      ".kidsflash-nav-speak,.kidsflash-nav-speak .primary-btn,.kidsflash-next-main{" +
      "width:100%!important;min-height:2.7rem!important;}" +
      ".kidsflash-nav-random{display:none!important;}" +
      ".kidsflash-nav-step [id$='-next']{" +
      "background:color-mix(in srgb,var(--accent,#2ec4b6) 24%,transparent)!important;" +
      "border-color:color-mix(in srgb,var(--accent,#2ec4b6) 60%,var(--line,#3a4458))!important;" +
      "font-weight:700!important;}";
    document.head.appendChild(st);
  }

  function speakFromTitles(root) {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const zh = String(root.querySelector(".kidsflash-zh")?.textContent || "").trim();
    const en = String(root.querySelector(".kidsflash-en")?.textContent || "").trim();
    const skip = /^—$|^–$|^-$|^加载|^Loading/;
    try { if (synth.paused) synth.resume(); } catch (_) {}
    const say = (text, lang) => {
      if (!text || skip.test(text)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = lang.indexOf("zh") === 0 ? 0.92 : 0.95;
      try { synth.speak(u); } catch (_) {}
    };
    if (zh) say(zh, "zh-CN");
    if (en) say(en, "en-US");
  }

  function patchRoot(root) {
    if (!root || root.dataset.navV2 === "1") return;
    if (root.dataset.kidsflashBound !== "1") return;
    root.dataset.navV2 = "1";
    const speak = root.querySelector('[id$="-speak"]');
    const next = root.querySelector('[id$="-next"]');
    const prev = root.querySelector('[id$="-prev"]');
    const random = root.querySelector('[id$="-random"]');
    const randRow = root.querySelector(".kidsflash-nav-random");
    if (randRow) {
      randRow.hidden = true;
      randRow.style.display = "none";
    }
    if (prev) prev.textContent = "上一个";
    if (speak) {
      const origNext = next;
      const s2 = speak.cloneNode(true);
      s2.textContent = "下一个";
      s2.classList.remove("kidsflash-speak-btn");
      s2.classList.add("kidsflash-next-main");
      speak.replaceWith(s2);
      s2.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        origNext?.click();
        speakFromTitles(root);
      });
    }
    if (next) {
      const n2 = next.cloneNode(true);
      n2.textContent = "随机";
      next.replaceWith(n2);
      n2.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        random?.click();
      });
    }
  }

  function scan() {
    document.querySelectorAll(".kidsflash-immerse").forEach(patchRoot);
  }

  window.addEventListener("devtools:panel-mounted", () => setTimeout(scan, 0));
  window.addEventListener("devtools:route", () => setTimeout(scan, 0));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
  [0, 200, 600, 1500, 3000].forEach((ms) => setTimeout(scan, ms));
})();
