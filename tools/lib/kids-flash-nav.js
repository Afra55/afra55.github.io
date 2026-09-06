(() => {
  "use strict";
  if (window.__kidsflashNavV2) return;
  window.__kidsflashNavV2 = true;

  if (!document.getElementById("kidsflash-nav-v2-css")) {
    const st = document.createElement("style");
    st.id = "kidsflash-nav-v2-css";
    st.textContent =
      ".kidsflash-nav-speak,.kidsflash-nav-speak .primary-btn,.kidsflash-next-main{" +
      "width:100%!important;flex:1 1 auto!important;min-height:2.7rem!important;}" +
      ".kidsflash-nav-random{display:none!important;}" +
      ".kidsflash-nav-step [id$='-next']{" +
      "background:color-mix(in srgb,var(--accent,#2ec4b6) 24%,transparent)!important;" +
      "border-color:color-mix(in srgb,var(--accent,#2ec4b6) 60%,var(--line,#3a4458))!important;" +
      "font-weight:700!important;}" +
      "@supports (padding-top: env(safe-area-inset-top)){" +
      "@media (max-width:900px){" +
      ".workspace-top{top:env(safe-area-inset-top,0px)!important;" +
      "padding-top:calc(0.45rem + env(safe-area-inset-top,0px))!important;}