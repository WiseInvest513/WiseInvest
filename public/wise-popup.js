/* Wise community popup. Each visit opens the community invitation; no saved cooldown. */
(() => {
  "use strict";
  if (window.WiseCommunityPopup) return;
  const script = document.getElementById("wise-global-popup-script") || document.currentScript;
  const site = script?.dataset.site || "main";
  const blockedRoute = () => /^\/(admin|account|auth|login|register|oauth|checkout|api)(\/|$)/.test(location.pathname);
  const controls = document.createElement("style");
  controls.textContent = `[data-wise-community]{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:7px 10px;border:1px solid #c9a65e55;border-radius:8px;background:#a9791910;color:#987025;font:600 12px/1.4 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;white-space:nowrap;cursor:pointer;flex-shrink:0}[data-wise-community]:hover{background:#a9791926;border-color:#b58b3b}[data-wise-community]:focus-visible{outline:2px solid #b58b3b;outline-offset:3px}.wise-popup-actions{display:inline-flex;align-items:center;gap:6px;flex-shrink:0}.dark [data-wise-community],[data-theme="dark"] [data-wise-community]{color:#e3c481}@media(max-width:600px){[data-wise-community]{padding:7px;font-size:11px}.wise-popup-actions{gap:4px}}`;
  document.head.append(controls);
  let dialog, host, previousFocus, previousOverflow;
  function close() { if (dialog?.open) dialog.close(); }
  function open() {
    if (blockedRoute()) return;
    if (!dialog) {
      host = document.createElement("wise-community-popup");
      const shadow = host.attachShadow({ mode: "open" });
      shadow.innerHTML = `<style>
      :host{font-family:var(--font-inter),-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color-scheme:light;--text:#282d32;--muted:#687078;--line:#dfe2e5;--gold:#a97919;--surface:#fff;--soft:#f5f6f7;--primary:#282d32;--on-primary:#fff}
      *{box-sizing:border-box} dialog{margin:auto;padding:0;border:1px solid var(--line);border-radius:18px;width:calc(100vw - 32px);max-width:560px;max-height:calc(100dvh - 32px);overflow:auto;color:var(--text);background:var(--surface);box-shadow:0 24px 80px #151a2433;outline:none}
      dialog::backdrop{background:#18202b66;backdrop-filter:blur(4px)}
      dialog[open]{animation:arrive .2s ease-out}.card{padding:28px 36px 0;text-align:center;position:relative}
      .brand{padding:0 44px 22px;border-bottom:1px solid var(--line);font-family:var(--font-nunito),sans-serif;font-size:22px;font-weight:850;letter-spacing:-.04em;line-height:1.5}.brand span{color:var(--gold)}
      .close{position:absolute;right:22px;top:25px;display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:8px;background:var(--soft);color:var(--muted);cursor:pointer;font-size:24px;line-height:1}.close:hover{color:var(--text);background:var(--line)}
      h2{outline:none;margin:0;font-family:var(--font-nunito),"PingFang SC","Microsoft YaHei",sans-serif;font-size:36px;font-weight:850;line-height:1.35;letter-spacing:-.035em;overflow-wrap:anywhere;text-wrap:balance}
      .message{margin:20px 0 0;color:var(--muted);font-size:15px;line-height:1.8}
      .actions{display:grid;grid-template-columns:1fr 1fr;align-items:stretch;gap:12px;margin:30px 0 28px}a{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;line-height:1.6;transition:background .15s,color .15s}
      a span{overflow-wrap:anywhere}.arrow{font-size:19px;font-weight:400;flex-shrink:0}
      .profile,.community-link{justify-content:center;min-height:60px;background:linear-gradient(180deg,#fffaf0,#f7ecd4);color:#73521b;border:1px solid #d8bf88;padding:14px 16px;font-size:16px;font-weight:700;border-radius:12px;box-shadow:inset 0 1px 0 #fff,0 3px 9px #9272380c;transition:background .18s,border-color .18s,box-shadow .18s,transform .18s}.profile:hover,.community-link:hover{background:linear-gradient(180deg,#fff6e4,#f0dfb9);border-color:#b58b3b;color:#614213;box-shadow:inset 0 1px 0 #fff,0 6px 16px #9272381c;transform:translateY(-2px)}.profile:active,.community-link:active{transform:translateY(0);box-shadow:inset 0 1px 3px #92723818}
      .profile .arrow,.community-link .arrow{color:var(--gold)}
      button:focus-visible,a:focus-visible{outline:3px solid var(--gold);outline-offset:4px}
      :host([data-dark]){color-scheme:dark;--text:#f2f3f4;--muted:#b1b6bc;--line:#373a3e;--gold:#d3ac64;--surface:#181a1d;--soft:#202327;--primary:#f2f3f4;--on-primary:#282d32}
      :host([data-dark]) .profile,:host([data-dark]) .community-link{background:linear-gradient(180deg,#342f24,#29261f);border-color:#77623b;color:#ead3a0;box-shadow:inset 0 1px 0 #ffffff0d,0 3px 9px #0002}:host([data-dark]) .profile:hover,:host([data-dark]) .community-link:hover{background:#3c3425;border-color:#b58b3b;color:#f5dfad}
      .profile[aria-pressed="true"]{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold)}
      @media(max-width:480px){.card{padding:22px 24px 0}.brand{font-size:20px;padding-bottom:18px}.close{right:16px;top:19px}.actions{gap:8px;margin:24px 0}.profile,.community-link{min-height:48px;padding:12px 8px;font-size:14px}}
      @media(prefers-reduced-motion:reduce){dialog[open]{animation:none}a{transition:none}.profile:hover,.community-link:hover{transform:none}}
      @keyframes arrive{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    </style><dialog aria-labelledby="wise-community-title"><div class="card" style="padding-bottom:28px"><button type="button" class="close" aria-label="关闭群聊弹窗">×</button><div class="brand">Wise <span>Invest</span></div><h2 id="wise-community-title" tabindex="-1" style="font-size:26px;margin-top:26px">加入 WiseInvest 社群</h2><p class="message">选择 Telegram 群或微信群，与大家交流。</p><div class="actions"><button type="button" class="profile" data-channel="telegram" aria-pressed="true">Telegram 群</button><button type="button" class="profile" data-channel="wechat" aria-pressed="false">微信群</button></div><div data-panel="telegram"><a class="community-link" href="https://t.me/WiseInvest513Chat" target="_blank" rel="noopener noreferrer">加入 Telegram 群 ↗</a></div><div data-panel="wechat" hidden><img src="https://www.wise-invest.org/群聊.png" alt="WiseInvest 微信群二维码" style="display:block;width:240px;max-width:100%;height:auto;margin:0 auto;border-radius:12px"><p class="message">打开微信扫码加入</p></div></div></dialog>`;
      document.body.append(host);
      dialog = shadow.querySelector("dialog");
      dialog.querySelector(".close").addEventListener("click", close);
      dialog.addEventListener("close", () => {
        document.documentElement.style.overflow = previousOverflow;
        if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      });
      dialog.addEventListener("click", e => {
        if (e.target !== dialog) return;
        const r = dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
      });
      dialog.querySelectorAll("[data-channel]").forEach(button => button.addEventListener("click", () => {
        dialog.querySelectorAll("[data-channel]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
        dialog.querySelectorAll("[data-panel]").forEach(panel => { panel.hidden = panel.dataset.panel !== button.dataset.channel; });
      }));
    }
    if (dialog.open) return;
    host.toggleAttribute("data-dark", document.documentElement.classList.contains("dark") || document.documentElement.dataset.theme === "dark");
    previousFocus = document.activeElement;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
    dialog.querySelector("h2").focus({ preventScroll: true });
  }
  window.WiseCommunityPopup = { open, close };
  document.addEventListener("click", event => {
    if (event.target instanceof Element && event.target.closest("[data-wise-community]")) {
      event.preventDefault(); open();
    }
  });
  window.addEventListener("popstate", close);
  // These sites use the shared community UI. Other sites open their original modal on mount.
  function start() {
    if (!["vip", "crypto", "ipo"].includes(site) || blockedRoute()) return;
    if (document.visibilityState === "hidden") {
      const visible = () => {
        if (document.visibilityState !== "visible") return;
        document.removeEventListener("visibilitychange", visible);
        open();
      };
      document.addEventListener("visibilitychange", visible);
    } else open();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
