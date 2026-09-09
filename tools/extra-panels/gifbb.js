(() => {
  "use strict";

  const P = window.DevToolsPure;
  const K = window.DevToolsExtraKit;
  if (!P || !K) return;
  const { $, $$, setError, toast, bindPanel, flushPendingFileInput, formatKb, EBind } = K;
  const escapeHtml = P.escapeHtml;

  const M = window.DevToolsExtraMedia || {};
  const {
    mergeGifBlobs, compressGifBlob, getFfmpegInstance, ensureFfmpegAssets, fetchFileBytes,
    ensureFfmpegInputWritten, loadGifsicle, buildGifCompressArgs, buildBlackboxSoftCompressArgs,
    buildBlackboxHardCompressArgs, gifCompressSummary, readGifWatermarkOptions, drawGifTextWatermark,
    encodeAnimatedWebpFromStillFrames, isAutoPackZipEnabled, setAutoPackZipEnabled, syncAutoPackZipToggles,
    bindAutoPackZipToggles, canEncodeStillWebp, gifQualityToWebpQuality, gifQualityToMaxColors,
    terminateFfmpegInstance, paintFfmpegWarmHint, prewarmFfmpegEngine, TOOLS_VERSION, GIF_TOOL_VERSION,
    AUTO_PACK_ZIP_KEY, blackboxUseMaxBytes, compressExistingGifToBlackbox,
  } = M;
  const formatLocalPickMeta = K.formatLocalPickMeta;
  const attachLocalVideoPreview = K.attachLocalVideoPreview;
  const waitVideoMetadata = K.waitVideoMetadata;

    try {
      let gifbbFile;
      let gifbbMeta;
      let gifbbError;
      let gifbbList;
      let gifbbRun;
      let gifbbZip;
      let gifbbClear;
      let gifbbAbort;
      /** @type {{ file: File, outBlob?: Blob, status: string, note: string, error?: string, previewIdx?: boolean, jobProgress?: number, jobText?: string }[]} */
      let gifbbItems = [];
      let gifbbBusy = false;
      let abortGifbb = false;
      let gifbbZipUrl = "";
      /** @type {string[]} */
      let gifbbPreviewUrls = [];
  
      function gifbbBaseName(file) {
        const name = String(file?.name || "clip.gif");
        return name.replace(/\.gif$/i, "").replace(/[^\w\u4e00-\u9fff.-]+/g, "_") || "clip";
      }

      async function readGifDim(file) {
        try {
          const buf = await file.slice(0, 10).arrayBuffer();
          const d = new DataView(buf);
          if (d.byteLength < 10) return null;
          const w = d.getUint16(6, true);
          const h = d.getUint16(8, true);
          return w > 0 && h > 0 ? { w, h } : null;
        } catch (_) {
          return null;
        }
      }

      function gifbbMetaText(item) {
        const bits = [];
        if (item.dim) bits.push(`${item.dim.w}×${item.dim.h}`);
        bits.push(formatKb(item.file.size));
        if (item.note) bits.push(item.note);
        if (item.error) bits.push(item.error);
        return bits.join(" · ");
      }
  
      function gifbbOutName(item) {
        const base = gifbbBaseName(item.file);
        if (item.status === "skip") return `${base}.gif`;
        return `${base}-blackbox.gif`;
      }
  
      function buildGifbbProgressDom() {
        const box = document.createElement("div");
        box.className = "vsplit-clip-progress";
        box.hidden = true;
        box.innerHTML =
          '<div class="vsplit-clip-progress-head">' +
          '<span class="hint tight vsplit-clip-progress-text">等待中…</span>' +
          '<span class="mono vsplit-clip-progress-pct">—</span>' +
          "</div>" +
          '<div class="gif-progress-track" aria-hidden="true"><span class="gif-progress-fill"></span></div>';
        return box;
      }
  
      function syncGifbbProgressDom(box, job) {
        if (!box) return;
        const status = job?.jobStatus || "";
        const show = status === "pending" || status === "running" || status === "done" || status === "error";
        box.hidden = !show;
        if (!show) return;
        box.dataset.status = status;
        const ratio = Math.max(0, Math.min(1, Number(job.jobProgress) || 0));
        const pct = Math.round(ratio * 100);
        const fill = box.querySelector(".gif-progress-fill");
        const textEl = box.querySelector(".vsplit-clip-progress-text");
        const pctEl = box.querySelector(".vsplit-clip-progress-pct");
        const running = status === "running";
        if (fill) {
          const width = status === "pending" ? 0 : Math.max(pct, running && pct < 6 ? 6 : pct);
          fill.style.width = `${width}%`;
          fill.classList.toggle("is-active", running);
          fill.classList.toggle("is-busy", running);
        }
        if (textEl) {
          textEl.textContent =
            job.jobText ||
            (status === "pending"
              ? "等待中…"
              : status === "running"
                ? "处理中…"
                : status === "done"
                  ? "完成"
                  : status === "error"
                    ? "失败"
                    : "");
        }
        if (pctEl) pctEl.textContent = status === "pending" ? "—" : `${pct}%`;
      }
  
      function setGifbbButtons() {
        const done = gifbbItems.filter((it) => it.outBlob).length;
        if (gifbbRun) gifbbRun.disabled = gifbbItems.length === 0 || gifbbBusy;
        if (gifbbZip) gifbbZip.disabled = done < 1 || gifbbBusy;
        if (gifbbClear) gifbbClear.disabled = gifbbBusy && gifbbItems.length === 0;
        if (gifbbAbort) gifbbAbort.hidden = !gifbbBusy;
      }
  
      function renderGifbbList() {
        if (!gifbbList) return;
        gifbbPreviewUrls.forEach((u) => {
          try {
            URL.revokeObjectURL(u);
          } catch (_) {}
        });
        gifbbPreviewUrls = [];
        gifbbList.innerHTML = "";
        if (!gifbbItems.length) {
          gifbbList.hidden = true;
          if (gifbbMeta) gifbbMeta.textContent = "未选择 GIF";
          setGifbbButtons();
          return;
        }
        gifbbList.hidden = false;
        const total = gifbbItems.reduce((s, it) => s + (it.file.size || 0), 0);
        if (gifbbMeta) {
          gifbbMeta.textContent = `已选 ${gifbbItems.length} 个 · 共 ${formatKb(total)} · 点「压黑盒」批量处理（≤6MB 的会跳过）`;
        }
        gifbbItems.forEach((item, idx) => {
          const row = document.createElement("div");
          row.className = "gif-frame vsplit-clip";
          row.dataset.gifbbIdx = String(idx);
          const top = document.createElement("div");
          top.className = "vsplit-clip-top";
          const title = document.createElement("strong");
          title.textContent = item.file.name;
          const meta = document.createElement("span");
          meta.className = "hint tight";
          meta.textContent = gifbbMetaText(item);
          const actions = document.createElement("div");
          actions.className = "btn-row";
          if (item.outBlob) {
            const dlBtn = document.createElement("button");
            dlBtn.type = "button";
            dlBtn.className = "secondary-btn";
            dlBtn.textContent = "下载";
            dlBtn.addEventListener("click", () => {
              triggerLocalDownload(item.outBlob, gifbbOutName(item));
            });
            actions.appendChild(dlBtn);
          }
          top.append(title, meta, actions);
          row.appendChild(top);
          if (item.status === "working") {
            const progressBox = buildGifbbProgressDom();
            row.appendChild(progressBox);
            syncGifbbProgressDom(progressBox, {
              jobStatus: "working",
              jobProgress: item.jobProgress || 0,
              jobText: item.jobText || "处理中…",
            });
          }
          // 与黑盒 GIF(vbb) 结果卡片一致：成功后默认展示缩略图
          if (item.outBlob) {
            const url = URL.createObjectURL(item.outBlob);
            gifbbPreviewUrls.push(url);
            const img = document.createElement("img");
            img.className = "vsplit-clip-gif";
            img.alt = item.file.name;
            img.loading = "lazy";
            img.decoding = "async";
            img.src = url;
            row.appendChild(img);
          }
          gifbbList.appendChild(row);
          if (item.outBlob && !item.dim) {
            readGifDim(item.outBlob)
              .then((d) => {
                if (d) {
                  item.dim = d;
                  const m = row.querySelector(".hint.tight");
                  if (m) m.textContent = gifbbMetaText(item);
                }
              })
              .catch(() => {});
          }
        });
        setGifbbButtons();
      }
  
      function clearGifbb() {
        if (gifbbBusy) abortGifbb = true;
        gifbbItems = [];
        abortGifbb = false;
        gifbbBusy = false;
        if (gifbbZipUrl) {
          try {
            URL.revokeObjectURL(gifbbZipUrl);
          } catch (_) {}
        }
        gifbbZipUrl = "";
        if (gifbbFile) gifbbFile.value = "";
        setError(gifbbError, "");
        setGifbbProgress(false);
        renderGifbbList();
      }
  
      function loadGifbbFiles(fileList) {
        const files = [...(fileList || [])].filter((f) => {
          const type = String(f.type || "").toLowerCase();
          const name = String(f.name || "");
          return type === "image/gif" || /\.gif$/i.test(name);
        });
        if (!files.length) {
          setError(gifbbError, "请选择 GIF 文件");
          return;
        }
        setError(gifbbError, "");
        gifbbItems = files.map((file) => ({
          file,
          status: "pending",
          note: "",
          previewIdx: false,
        }));
        renderGifbbList();
        toast(`已添加 ${files.length} 个 GIF`);
      }
  
      // 顶部总进度条（与黑盒 GIF(vbb) 同款 gif-progress 样式）
      function setGifbbProgress(visible, ratio, text, opts = {}) {
        const box = document.getElementById("gifbb-progress");
        if (!box) return;
        box.hidden = !visible;
        const fill = document.getElementById("gifbb-progress-fill");
        const pctEl = document.getElementById("gifbb-progress-pct");
        const textEl = document.getElementById("gifbb-progress-text");
        const subEl = document.getElementById("gifbb-progress-sub");
        if (!visible) {
          if (fill) fill.style.width = "0%";
          if (pctEl) pctEl.hidden = true;
          if (subEl) { subEl.hidden = true; }
          return;
        }
        const pct = Math.max(0, Math.min(100, Math.round((ratio || 0) * 100)));
        const busy = Boolean(opts.busy) || (pct > 0 && pct < 100);
        if (fill) {
          fill.style.width = `${Math.max(pct, busy && pct < 8 ? 8 : pct)}%`;
          fill.classList.toggle("is-active", busy);
          fill.classList.toggle("is-busy", Boolean(opts.busy));
        }
        if (pctEl) { pctEl.textContent = `${pct}%`; pctEl.hidden = false; }
        if (textEl) textEl.textContent = String(text || "");
        if (subEl) {
          if (opts.sub) {
            subEl.textContent = String(opts.sub);
            subEl.hidden = false;
          } else {
            subEl.hidden = true;
          }
        }
      }

      async function runGifbbCompress() {
        if (!gifbbItems.length || gifbbBusy) return;
        gifbbBusy = true;
        abortGifbb = false;
        setError(gifbbError, "");
        setGifbbButtons();
        let ok = 0;
        let skip = 0;
        let fail = 0;
        const total = gifbbItems.length;
        setGifbbProgress(true, 0, `压缩 0/${total}`, { busy: true });
        try {
          for (let i = 0; i < total; i++) {
            if (abortGifbb) throw new Error("已取消");
            const item = gifbbItems[i];
            item.status = "working";
            item.jobProgress = 0;
            item.jobText = "准备…";
            item.note = "";
            item.error = "";
            item.outBlob = undefined;
            renderGifbbList();
            try {
              const before = item.file.size;
              if (before <= blackboxUseMaxBytes()) {
                item.outBlob = item.file;
                item.status = "skip";
                item.note = `已符合黑盒 · ${formatKb(before)} · 未压缩`;
                skip++;
              } else {
                item.jobText = `压缩中 · ${formatKb(before)}`;
                const result = await compressExistingGifToBlackbox(item.file, (ratio, text) => {
                  item.jobProgress = Math.max(0, Math.min(1, Number(ratio) || 0));
                  item.jobText = text || "压缩中…";
                  const overall = (i + (item.jobProgress || 0)) / total;
                  setGifbbProgress(true, overall, `压缩 ${i + 1}/${total}`, { sub: item.jobText, busy: true });
                  renderGifbbList();
                }, () => abortGifbb);
                item.outBlob = result.blob;
                item.status = result.ok ? "done" : "warn";
                const after = result.blob.size;
                const saved =
                  before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
                if (result.skipped) {
                  item.note = `已符合黑盒 · ${formatKb(after)}`;
                  skip++;
                } else if (result.ok) {
                  item.note = `${formatKb(before)} → ${formatKb(after)} · 约省 ${saved}% · ${result.compressRounds} 轮`;
                  ok++;
                } else if (after >= before) {
                  // 压不动：绝不返回更大的文件，保留原图
                  item.note = `未能压小 · 已保留原图（${formatKb(after)}，超 6MB）`;
                  item.error = "未压进 6MB";
                  fail++;
                } else {
                  item.note = `仍 ${formatKb(after)}（超 6MB）· 已压 ${result.compressRounds} 轮`;
                  item.error = "未压进 6MB";
                  fail++;
                }
              }
            } catch (err) {
              item.status = "error";
              item.error = err.message || String(err);
              fail++;
            }
            item.status = item.status === "working" ? "done" : item.status;
            setGifbbProgress(true, (i + 1) / total, `压缩 ${Math.min(i + 1, total)}/${total}`, { busy: i + 1 < total });
            renderGifbbList();
          }
          if (abortGifbb) toast("已取消");
          else if (fail) toast(`完成：${ok + skip} 个成功，${fail} 个有问题`);
          else toast(`全部完成（${skip} 个跳过，${ok} 个已压缩）`);
        } catch (err) {
          if (String(err?.message) !== "已取消") setError(gifbbError, err.message || String(err));
          else toast("已取消");
        } finally {
          gifbbBusy = false;
          abortGifbb = false;
          setGifbbProgress(false);
          setGifbbButtons();
        }
      }
  
      async function packGifbbResults() {
        const ready = gifbbItems.filter((it) => it.outBlob);
        if (!ready.length) {
          toast("请先处理 GIF");
          return;
        }
        const packed = await zipBlobs(
          ready.map((it) => ({ name: gifbbOutName(it), blob: it.outBlob })),
          "blackbox-gifs.zip"
        );
        if (gifbbZipUrl) {
          try {
            URL.revokeObjectURL(gifbbZipUrl);
          } catch (_) {}
        }
        gifbbZipUrl = packed.url;
        triggerLocalDownload(packed.blob, packed.name);
        toast(`已打包 ${ready.length} 个 GIF`);
      }
  
      bindPanel("gifbb", (root) => {
        root = root || document.getElementById("gifbb");
        gifbbFile = $("#gifbb-file", root);
        gifbbMeta = $("#gifbb-meta", root);
        gifbbError = $("#gifbb-error", root);
        gifbbList = $("#gifbb-list", root);
        gifbbRun = $("#gifbb-run", root);
        gifbbZip = $("#gifbb-zip", root);
        gifbbClear = $("#gifbb-clear", root);
        gifbbAbort = $("#gifbb-abort", root);
  
        if (gifbbFile && !gifbbFile.dataset.gifbbBound) {
          gifbbFile.dataset.gifbbBound = "1";
          gifbbFile.addEventListener("change", (e) => {
            loadGifbbFiles(e.target.files);
          });
        }
  
      gifbbRun?.addEventListener("click", () => {
        runGifbbCompress().catch((err) => setError(gifbbError, err.message || String(err)));
      });
      gifbbZip?.addEventListener("click", () => {
        packGifbbResults().catch((err) => setError(gifbbError, err.message || String(err)));
      });
      const allowScaleEl = $("#gifbb-allow-scale");
      if (allowScaleEl) {
        try {
          allowScaleEl.checked = localStorage.getItem("devtools-gifbb-scale-v1") !== "0";
        } catch (_) {}
        allowScaleEl.addEventListener("change", () => {
          try {
            localStorage.setItem("devtools-gifbb-scale-v1", allowScaleEl.checked ? "1" : "0");
          } catch (_) {}
          if (gifbbMeta) {
            gifbbMeta.textContent = allowScaleEl.checked
              ? "已开启：必要时缩小尺寸/画质以保证压进 6MB"
              : "已关闭：保持原始尺寸，仅降色/压缩，可能无法压进 6MB";
          }
        });
      }
      gifbbClear?.addEventListener("click", clearGifbb);
      gifbbAbort?.addEventListener("click", () => {
        abortGifbb = true;
      });
      window.DevToolsTemp?.registerCleanup(clearGifbb);
      renderGifbbList();
      flushPendingFileInput(gifbbFile, (files) => loadGifbbFiles(files));
      });
    } catch (err) {
      if (String(err?.message) !== "skip gifbb") console.error("gifbb init failed", err);
    }
})();
