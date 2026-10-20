/* Wise popup — canonical client, shared by all Wise sites. No cookies or timers. */
(() => {
  "use strict";
  if (window.WisePopup) return;
  const script = document.getElementById("wise-global-popup-script") || document.currentScript;
  const site = script?.dataset.site || "main";
  const endpoint = script?.dataset.configUrl || "/api/public/popup";
  let communityDialog = null;
  let suppressAutomatic = false;
  const controls = document.createElement("style");
  controls.textContent = `[data-wise-vote],[data-wise-community]{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:7px 10px;border:1px solid #c9a65e55;border-radius:8px;background:#a9791910;color:#987025;font:600 12px/1.4 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;white-space:nowrap;cursor:pointer;flex-shrink:0}[data-wise-vote]:hover,[data-wise-community]:hover{background:#a9791926;border-color:#b58b3b}[data-wise-vote]:focus-visible,[data-wise-community]:focus-visible{outline:2px solid #b58b3b;outline-offset:3px}.wise-popup-actions{display:inline-flex;align-items:center;gap:6px;flex-shrink:0}.dark [data-wise-vote],.dark [data-wise-community],[data-theme="dark"] [data-wise-vote],[data-theme="dark"] [data-wise-community]{color:#e3c481}@media(max-width:600px){[data-wise-vote],[data-wise-community]{padding:7px;font-size:11px}.wise-popup-actions{gap:4px}}`;
  document.head.append(controls);
  let attempted = false;
  let loading = null;
  let host = null;
  let dialog = null;
  let previousFocus = null;
  let previousOverflow = null;
  const blockedRoute = () => /^\/(admin|account|auth|login|register|oauth|checkout|api)(\/|$)/.test(location.pathname);
  const valid = (c) => c && typeof c.enabled === "boolean" && Array.isArray(c.sites) &&
    ["eyebrow", "title", "subtitle", "message", "profileLabel", "voteLabel"].every(k => typeof c[k] === "string" && c[k].length <= 120) &&
    ["profileUrl", "voteUrl"].every(k => { try { const u = new URL(c[k]); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; } });
  function close() { if (dialog?.open) dialog.close(); }
  function restoreFocus() {
    if (dialog?.open || communityDialog?.open) return;
    if (previousOverflow !== null) document.documentElement.style.overflow = previousOverflow;
    previousOverflow = null;
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
  function rememberFocus() {
    if (previousOverflow !== null) return;
    previousFocus = document.activeElement;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
  }
  function showCommunity() {
    suppressAutomatic = true;
    close();
    mount();
    if (!communityDialog) {
      communityDialog = document.createElement("dialog");
      communityDialog.setAttribute("aria-labelledby", "wise-community-title");
      communityDialog.innerHTML = `<div class="card" style="padding-bottom:28px"><button type="button" class="close" aria-label="关闭群聊弹窗">×</button><div class="brand">Wise <span>Invest</span></div><h2 id="wise-community-title" tabindex="-1" style="font-size:26px;margin-top:26px">加入 WiseInvest 社群</h2><p class="message">选择 Telegram 群或微信群，与大家交流。</p><div class="actions"><button type="button" class="profile" data-channel="telegram" aria-pressed="true">Telegram 群</button><button type="button" class="profile" data-channel="wechat" aria-pressed="false">微信群</button></div><div data-panel="telegram"><a class="vote" href="https://t.me/WiseInvest513Chat" target="_blank" rel="noopener noreferrer">加入 Telegram 群 ↗</a></div><div data-panel="wechat" hidden><img src="https://www.wise-invest.org/群聊.png" alt="WiseInvest 微信群二维码" style="display:block;width:240px;max-width:100%;height:auto;margin:0 auto;border-radius:12px"><p class="message">打开微信扫码加入</p></div></div>`;
      host.shadowRoot.append(communityDialog);
      communityDialog.querySelector(".close").addEventListener("click", () => communityDialog.close());
      communityDialog.addEventListener("close", restoreFocus);
      communityDialog.querySelectorAll("[data-channel]").forEach(button => button.addEventListener("click", () => {
        const channel = button.dataset.channel;
        communityDialog.querySelectorAll("[data-channel]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
        communityDialog.querySelectorAll("[data-panel]").forEach(panel => { panel.hidden = panel.dataset.panel !== channel; });
      }));
    }
    host.toggleAttribute("data-dark", document.documentElement.classList.contains("dark") || document.documentElement.dataset.theme === "dark");
    rememberFocus();
    if (!communityDialog.open) communityDialog.showModal();
    communityDialog.querySelector("h2").focus({ preventScroll: true });
  }
  function mount() {
    if (host) return;
    host = document.createElement("wise-vote-popup");
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>
      :host{font-family:var(--font-inter),-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color-scheme:light;--text:#282d32;--muted:#687078;--line:#dfe2e5;--gold:#a97919;--surface:#fff;--soft:#f5f6f7;--primary:#282d32;--on-primary:#fff}
      *{box-sizing:border-box} dialog{margin:auto;padding:0;border:1px solid var(--line);border-radius:18px;width:calc(100vw - 32px);max-width:560px;max-height:calc(100dvh - 32px);overflow:auto;color:var(--text);background:var(--surface);box-shadow:0 24px 80px #151a2433;outline:none}
      dialog::backdrop{background:#18202b66;backdrop-filter:blur(4px)}
      dialog[open]{animation:arrive .2s ease-out}.card{padding:28px 36px 0;text-align:center;position:relative}
      .brand{padding:0 44px 22px;border-bottom:1px solid var(--line);font-family:var(--font-nunito),sans-serif;font-size:22px;font-weight:850;letter-spacing:-.04em;line-height:1.5}.brand span{color:var(--gold)}
      .close{position:absolute;right:22px;top:25px;display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:8px;background:var(--soft);color:var(--muted);cursor:pointer;font-size:24px;line-height:1}.close:hover{color:var(--text);background:var(--line)}
      .eyebrow{margin:28px 0 12px;font-size:14px;font-weight:500;color:var(--gold);line-height:1.6}
      h2{outline:none;margin:0;font-family:var(--font-nunito),"PingFang SC","Microsoft YaHei",sans-serif;font-size:36px;font-weight:850;line-height:1.35;letter-spacing:-.035em;overflow-wrap:anywhere;text-wrap:balance}
      .subtitle{margin:8px 0 0;color:var(--text);font-size:24px;font-weight:600;line-height:1.5;text-wrap:balance}
      .message{margin:20px 0 0;color:var(--muted);font-size:15px;line-height:1.8}
      .actions{display:grid;grid-template-columns:1fr 1fr;align-items:stretch;gap:12px;margin:30px 0 28px}a{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;line-height:1.6;transition:background .15s,color .15s}
      a span{overflow-wrap:anywhere}.arrow{font-size:19px;font-weight:400;flex-shrink:0}
      .profile,.vote{justify-content:center;min-height:60px;background:linear-gradient(180deg,#fffaf0,#f7ecd4);color:#73521b;border:1px solid #d8bf88;padding:14px 16px;font-size:16px;font-weight:700;border-radius:12px;box-shadow:inset 0 1px 0 #fff,0 3px 9px #9272380c;transition:background .18s,border-color .18s,box-shadow .18s,transform .18s}.profile:hover,.vote:hover{background:linear-gradient(180deg,#fff6e4,#f0dfb9);border-color:#b58b3b;color:#614213;box-shadow:inset 0 1px 0 #fff,0 6px 16px #9272381c;transform:translateY(-2px)}.profile:active,.vote:active{transform:translateY(0);box-shadow:inset 0 1px 3px #92723818}
      .profile .arrow,.vote .arrow{color:var(--gold)}
      .registration{margin:-8px 0 24px;color:var(--muted);font-size:13px;line-height:1.8}.registration a{display:inline;min-height:0;padding:0;border-radius:2px;font-size:inherit;font-weight:600;color:var(--gold);text-decoration:underline;text-underline-offset:3px}.registration a:hover{color:var(--text)}
      .foot{margin:0 -36px;padding:16px 36px;border-top:1px solid var(--line);background:var(--soft);color:var(--muted);font-size:12px;line-height:1.7}
      button:focus-visible,a:focus-visible{outline:3px solid var(--gold);outline-offset:4px}
      :host([data-dark]){color-scheme:dark;--text:#f2f3f4;--muted:#b1b6bc;--line:#373a3e;--gold:#d3ac64;--surface:#181a1d;--soft:#202327;--primary:#f2f3f4;--on-primary:#282d32}
      :host([data-dark]) .profile,:host([data-dark]) .vote{background:linear-gradient(180deg,#342f24,#29261f);border-color:#77623b;color:#ead3a0;box-shadow:inset 0 1px 0 #ffffff0d,0 3px 9px #0002}:host([data-dark]) .profile:hover,:host([data-dark]) .vote:hover{background:#3c3425;border-color:#b58b3b;color:#f5dfad}
      @media(max-width:480px){.card{padding:22px 24px 0}.brand{font-size:20px;padding-bottom:18px}.close{right:16px;top:19px}.eyebrow{margin-top:24px}h2{font-size:29px}.subtitle{font-size:21px}.actions{grid-template-columns:1fr;gap:12px;margin:24px 0 24px}.profile,.vote{min-height:54px;font-size:14px}.foot{margin-inline:-24px;padding:14px 24px;font-size:11px}}
      @media(max-height:520px){.card{padding-top:18px}.brand{padding-bottom:12px}.eyebrow{margin-top:16px}.message{margin-top:12px}.actions{margin-top:16px;margin-bottom:16px}}
      @media(prefers-reduced-motion:reduce){dialog[open]{animation:none}a{transition:none}.profile:hover,.vote:hover{transform:none}}
      @keyframes arrive{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    </style><dialog aria-labelledby="vote-title" aria-describedby="vote-message"><div class="card">
      <button type="button" class="close" aria-label="关闭投票弹窗">×</button>
      <div class="brand" aria-label="Wise Invest">Wise <span>Invest</span></div><p class="eyebrow"></p>
      <h2 id="vote-title" tabindex="-1"></h2><p class="subtitle"></p><p class="message" id="vote-message"></p>
      <div class="actions"><a class="vote" target="_blank" rel="noopener noreferrer"><span></span><span class="arrow" aria-hidden="true">↗</span></a><a class="profile" target="_blank" rel="noopener noreferrer"><span></span><span class="arrow" aria-hidden="true">↗</span></a></div>
      <p class="registration">如果还没有币安账号，可<a href="https://www.wise-invest.org/articles/crypto/GaM38JYk" target="_blank" rel="noopener noreferrer">查看教程注册 ↗</a></p>
      <p class="foot">关闭后，可随时点击右上角「为 Wise 投票」再次打开</p>
    </div></dialog>`;
    document.body.append(host);
    dialog = shadow.querySelector("dialog");
    shadow.querySelector(".close").addEventListener("click", close);
    dialog.addEventListener("click", e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); } });
    dialog.addEventListener("close", restoreFocus);
    shadow.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
  }
  function show(c, preview = false) {
    if (!valid(c) || (!preview && (!c.enabled || !c.sites.includes(site) || blockedRoute()))) return false;
    mount();
    const root = host.shadowRoot;
    const dark = document.documentElement.classList.contains("dark") || document.documentElement.dataset.theme === "dark";
    host.toggleAttribute("data-dark", dark);
    for (const [selector, key] of [[".eyebrow","eyebrow"],["h2","title"],[".subtitle","subtitle"],[".message","message"],[".profile span","profileLabel"],[".vote span","voteLabel"]]) root.querySelector(selector).textContent = c[key];
    root.querySelector(".profile").href = c.profileUrl;
    root.querySelector(".vote").href = c.voteUrl;
    if (communityDialog?.open) communityDialog.close();
    window.dispatchEvent(new Event("wise-popup:opening"));
    if (!dialog.open) {
      rememberFocus();
      dialog.showModal();
      root.querySelector("h2").focus({ preventScroll: true });
    }
    return true;
  }
  async function load() {
    if (loading) return loading;
    loading = (async () => {
      try {
        const response = await fetch(endpoint, { credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(7000) });
        if (!response.ok) throw new Error("unavailable");
        const data = await response.json();
        if (!valid(data)) throw new Error("invalid");
        return data;
      } catch { return null; }
      finally { loading = null; }
    })();
    return loading;
  }
  async function open() { const c = await load(); return show(c); }
  window.WisePopup = { open, close, community: showCommunity, preview: c => show(c, true) };
  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("[data-wise-vote]")) { event.preventDefault(); void open(); }
    if (target?.closest("[data-wise-community]")) { event.preventDefault(); showCommunity(); }
  });
  window.addEventListener("wise-popup:open", () => { void open(); });
  const communityOpening = () => { suppressAutomatic = true; close(); };
  window.addEventListener("open-community-modal", communityOpening);
  window.addEventListener("wise-community:opening", communityOpening);
  window.addEventListener("popstate", close);
  async function start() {
    if (attempted || blockedRoute()) return;
    attempted = true;
    const c = await load();
    if (document.visibilityState === "hidden") {
      const onVisible = () => { if (document.visibilityState === "visible") { document.removeEventListener("visibilitychange", onVisible); if (!suppressAutomatic) show(c); } };
      document.addEventListener("visibilitychange", onVisible);
    } else if (!suppressAutomatic) show(c);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else void start();
})();
