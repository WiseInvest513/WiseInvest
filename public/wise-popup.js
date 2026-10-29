/* Shared Wise community dialog. CHAIN is the visual reference for every site. */
(() => {
  "use strict";
  if (window.WiseCommunityPopup) return;
  const script = document.getElementById("wise-global-popup-script") || document.currentScript;
  const site = script?.dataset.site || "main";
  const blockedRoute = () => /^\/(admin|account|auth|login|register|oauth|checkout|api)(\/|$)/.test(location.pathname);
  const controls = document.createElement("style");
  controls.textContent = `[data-wise-community]{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:7px 10px;border:1px solid #c9a65e55;border-radius:8px;background:#a9791910;color:#987025;font:600 12px/1.4 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;white-space:nowrap;cursor:pointer;flex-shrink:0}[data-wise-community]:hover{background:#a9791926;border-color:#b58b3b}[data-wise-community]:focus-visible{outline:2px solid #b58b3b;outline-offset:3px}.wise-popup-actions{display:inline-flex;align-items:center;gap:6px;flex-shrink:0}.dark [data-wise-community],[data-theme="dark"] [data-wise-community]{color:#e3c481}@media(max-width:600px){[data-wise-community]{padding:7px;font-size:11px}.wise-popup-actions{gap:4px}}`;
  document.head.append(controls);
  let dialog, host, previousFocus, previousOverflow, opened = false;
  function close() { if (dialog?.open) dialog.close(); }
  function open() {
    if (blockedRoute()) return;
    opened = true;
    if (!dialog) {
      host = document.createElement("wise-community-popup");
      const shadow = host.attachShadow({ mode: "open" });
      shadow.innerHTML = `<style>
        :host{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;--surface:#fff;--elevated:#f8fafc;--border:#e2e8f0;--text:#0f172a;--muted:#64748b;--quiet:#64748b;color-scheme:light}
        :host([data-dark]){--surface:#1e293b;--elevated:#334155;--border:#334155;--text:#f8fafc;--muted:#94a3b8;--quiet:#94a3b8;color-scheme:dark}
        *{box-sizing:border-box}dialog{padding:0;margin:auto;width:calc(100vw - 32px);max-width:340px;max-height:calc(100dvh - 32px);overflow:auto;border:1px solid var(--border);border-radius:16px;background:var(--surface);color:var(--text);box-shadow:0 24px 60px #0000004d;outline:none}
        dialog::backdrop{background:#0008;backdrop-filter:blur(4px)}dialog[open]{animation:arrive .22s ease}
        .card{position:relative}.heading{padding:20px 20px 16px}.eyebrow{color:#0284c7;font-size:11px;font-weight:600;letter-spacing:.1em;margin:0 0 4px;line-height:1.5}h2{font-size:18px;font-weight:600;line-height:1.5;margin:0;outline:none}
        button,a{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}button{border:0}button:focus-visible,a:focus-visible{outline:2px solid #0284c7;outline-offset:3px}
        .close{position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:50%;background:var(--elevated);color:var(--muted);display:grid;place-items:center;padding:0}.close svg{width:14px;height:14px}.close:hover,.dismiss:hover{opacity:.7}
        .tabs{display:flex;margin:0 20px 16px;padding:4px;gap:4px;border-radius:12px;background:var(--elevated)}.tab{flex:1;padding:8px 0;border-radius:8px;background:transparent;color:var(--muted);font-size:13px;line-height:1.5;font-weight:600;transition:background .15s}.tab[aria-pressed="true"]{background:var(--channel);color:white;box-shadow:0 2px 8px color-mix(in srgb,var(--channel) 25%,transparent)}
        .qr{margin:0 20px;border:1.5px solid color-mix(in srgb,var(--channel) 15%,transparent);border-radius:12px;overflow:hidden;background:#fff}.qr img{display:block;width:100%;height:auto}.description{margin:0;padding:12px 20px 4px;text-align:center;color:var(--muted);font-size:13px;line-height:1.5}.actions{padding:8px 20px 20px;display:flex;flex-direction:column;gap:8px}.join{display:block;text-align:center;text-decoration:none;color:#fff;background:linear-gradient(135deg,#0284c7,#0ea5e9);padding:12px;border-radius:12px;font-size:15px;font-weight:600}.dismiss{padding:4px;background:transparent;color:var(--quiet);font-size:13px;line-height:1.5}
        [hidden]{display:none!important}@media(prefers-reduced-motion:reduce){dialog[open]{animation:none}.tab{transition:none}}@keyframes arrive{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:none}}
      </style><dialog aria-labelledby="community-title"><div class="card">
        <button type="button" class="close" aria-label="关闭社群弹窗"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg></button>
        <div class="heading"><p class="eyebrow">WISEINVEST 社区</p><h2 id="community-title" tabindex="-1">加入我们的社群</h2></div>
        <div class="tabs"><button type="button" class="tab" style="--channel:#07c160" data-channel="wechat" aria-pressed="true">微信群聊</button><button type="button" class="tab" style="--channel:#0284c7" data-channel="telegram" aria-pressed="false">电报群聊</button></div>
        <div data-panel="wechat" style="--channel:#07c160"><div class="qr"><img src="/草料图片.png" alt="微信群聊二维码"></div><p class="description">扫码加入官方微信群聊，与国内投资者交流</p></div>
        <div data-panel="telegram" style="--channel:#0284c7" hidden><div class="qr"><img src="/电报图片.png" alt="电报群聊二维码"></div><p class="description">扫码或点击按钮加入 Telegram 群，与全球投资者交流</p></div>
        <div class="actions"><a class="join" href="https://t.me/WiseInvest513Chat" target="_blank" rel="noopener noreferrer" hidden>点击加入群聊 →</a><button type="button" class="dismiss">暂时关闭</button></div>
      </div></dialog>`;
      document.body.append(host);
      dialog = shadow.querySelector("dialog");
      dialog.querySelectorAll(".close,.dismiss").forEach(b => b.addEventListener("click", close));
      dialog.addEventListener("close", () => {
        document.documentElement.style.overflow = previousOverflow;
        if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        window.dispatchEvent(new Event("wise-community:closed"));
      });
      dialog.addEventListener("click", e => {
        if (e.target !== dialog) return;
        const r = dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
      });
      dialog.querySelectorAll("[data-channel]").forEach(button => button.addEventListener("click", () => {
        dialog.querySelectorAll("[data-channel]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
        dialog.querySelectorAll("[data-panel]").forEach(panel => { panel.hidden = panel.dataset.panel !== button.dataset.channel; });
        dialog.querySelector(".join").hidden = button.dataset.channel !== "telegram";
      }));
    }
    if (dialog.open) return;
    window.dispatchEvent(new Event("wise-community:opening"));
    host.toggleAttribute("data-dark", document.documentElement.classList.contains("dark") || document.documentElement.dataset.theme === "dark");
    previousFocus = document.activeElement;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
    dialog.querySelector("h2").focus({ preventScroll: true });
  }
  window.WiseCommunityPopup = { open, close };
  document.addEventListener("click", event => {
    if (event.target instanceof Element && event.target.closest("[data-wise-community]")) { event.preventDefault(); open(); }
  });
  window.addEventListener("open-community-modal", open);
  window.addEventListener("wise-community:request", open);
  window.addEventListener("wise-community:close", close);
  window.addEventListener("popstate", close);
  window.dispatchEvent(new Event("wise-community:ready"));
  // Original promotional windows remain on main/IPO; ETF coordinates its disclaimer first.
  function start() {
    if (["main", "ipo", "etf"].includes(site) || blockedRoute() || opened) return;
    if (document.visibilityState === "hidden") {
      const visible = () => { if (document.visibilityState === "visible") { document.removeEventListener("visibilitychange", visible); if (!opened) open(); } };
      document.addEventListener("visibilitychange", visible);
    } else open();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();
