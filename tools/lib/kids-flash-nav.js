(() => {
  "use strict";
  if (window.__kidsflashNavV2) return;
  window.__kidsflashNavV2 = true;

  function speakFromTitles(root) {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const zh = String(root.querySelector(".kidsflash-zh")?.textContent || "").trim();
    const en = String(root.querySelector(".kidsflash-en")?.textContent || "").trim();
    const skip = /^—$|^–$|^-$|^加载|^Loading/;
    try {
      if (synth.paused) synth.resume();
    } catch (_) {}
    const say = (text, lang) => {
      if (!text || skip.test(text)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = lang.indexOf("zh") === 0 ? 0.92 : 0.95;
      try {
        synth.speak(u);
      } catch (_) {}
    };
    if (zh) say(zh, "zh-CN");
    if (en) say(en, "en-US");
  }

  function patchRoot(root) {
    if (!root || root.dataset.navV2 === "1") return;
    root.dataset.navV2 = "1";
    const speak = root.querySelector('[id$="-speak"]');
    const next = root.querySelector('[id$="-next"]');
    const prev = root.querySelector('[id$="-prev"]');
    const random = root.querySelector('[id$="-random"]');
    const randRow = root.querySelector(".kidsflash-nav-random");
    if (randRow) randRow.hidden = true;
    if (prev) prev.textContent = "上一个";
    if (speak) {
      const origNext = next;
      const s2 = speak.cloneNode(true);
      s2.textContent = "下一个";
      s2.classList.remove("kidsflash-speak-btn");
      s2.classList.add("kidsflash-next-main");
      s2.title = "下一张并朗读";
      s2.setAttribute("aria-label", "下一个并朗读");
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
      n2.title = "随机一张";
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

  window.addEventListener("devtools:panel-mounted", scan);
  window.addEventListener("devtools:route", scan);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
  else scan();
  window.setTimeout(scan, 300);
  window.setTimeout(scan, 1200);
})();
