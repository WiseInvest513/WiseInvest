/* Shared Wise community dialog. CHAIN is the visual reference for every site. */
(() => {
  "use strict";
  if (window.WiseCommunityPopup) return;
  const script = document.getElementById("wise-global-popup-script") || document.currentScript;
  const site = script?.dataset.site || "main";
  const blockedRoute = () => /^\/(admin|account|auth|login|register|oauth|checkout|api)(\/|$)/.test(location.pathname);
  const POPUP_SHOWN_AT_KEY = "wise-popup-last-shown-at-v1";
  const POPUP_INTERVAL_MS = 3 * 60 * 60 * 1000;

  // Shared by automatic recommendations and the manual community entry on this site.
  function getPopupShownAt() {
    let latest = window.__wisePopupShownAt || 0;
    for (const storageName of ["localStorage", "sessionStorage"]) {
      try {
        const storage = window[storageName];
        const values = [
          Number(storage.getItem(POPUP_SHOWN_AT_KEY)),
          Number(storage.getItem("wise-ipo-stockcoin-promo-dismissed-at")),
        ];
        try {
          values.push(Number(JSON.parse(storage.getItem("wise_invest_recommendation_log") || "null")?.lastShownTime));
        } catch { /* Ignore an invalid legacy record. */ }
        for (const value of values) {
          if (Number.isFinite(value) && value > 0 && value <= Date.now()) latest = Math.max(latest, value);
        }
      } catch { /* Storage may be unavailable in a restricted browser. */ }
    }
    return latest;
  }

  function shouldShowAutomaticPopup() {
    return Date.now() - getPopupShownAt() >= POPUP_INTERVAL_MS;
  }

  function recordPopupShown() {
    const now = Date.now();
    window.__wisePopupShownAt = now;
    for (const storageName of ["localStorage", "sessionStorage"]) {
      try { window[storageName].setItem(POPUP_SHOWN_AT_KEY, String(now)); } catch { /* Keep the in-page fallback. */ }
    }
  }
  const controls = document.createElement("style");
  controls.textContent = `[data-wise-community]{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:7px 10px;border:1px solid #c9a65e55;border-radius:8px;background:#a9791910;color:#987025;font:600 12px/1.4 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;white-space:nowrap;cursor:pointer;flex-shrink:0}[data-wise-community]:hover{background:#a9791926;border-color:#b58b3b}[data-wise-community]:focus-visible{outline:2px solid #b58b3b;outline-offset:3px}.wise-popup-actions{display:inline-flex;align-items:center;gap:6px;flex-shrink:0}.dark [data-wise-community],[data-theme="dark"] [data-wise-community]{color:#e3c481}@media(max-width:600px){[data-wise-community]{padding:7px;font-size:11px}.wise-popup-actions{gap:4px}}`;
  document.head.append(controls);
  let dialog, host, previousFocus, previousOverflow, opened = false;
  function close() { if (dialog?.open) dialog.close(); }
  function open() {
    if (blockedRoute()) return false;
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
    if (dialog.open) return true;
    window.dispatchEvent(new Event("wise-community:opening"));
    host.toggleAttribute("data-dark", document.documentElement.classList.contains("dark") || document.documentElement.dataset.theme === "dark");
    previousFocus = document.activeElement;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
    recordPopupShown();
    dialog.querySelector("h2").focus({ preventScroll: true });
    return true;
  }
  function openAutomatic() {
    if (!shouldShowAutomaticPopup()) return false;
    return window.WiseKrakenPopup?.openAutomatic() || false;
  }
  window.WiseCommunityPopup = { open, close, openAutomatic };
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
    if (!window.WiseKrakenPopup || ["main", "ipo", "etf"].includes(site) || blockedRoute() || opened) return;
    if (document.visibilityState === "hidden") {
      const visible = () => { if (document.visibilityState === "visible") { document.removeEventListener("visibilitychange", visible); if (!opened) openAutomatic(); } };
      document.addEventListener("visibilitychange", visible);
    } else openAutomatic();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();

/* Wise limited-time benefits. Community remains available via its existing entry. */
(() => {
  'use strict';
  if (window.WiseKrakenPopup) return;
  const site = document.getElementById('wise-global-popup-script')?.dataset.site || 'main';
  const blocked = () => /^\/(admin|account|auth|login|register|oauth|checkout|api|studio)(\/|$)/.test(location.pathname) || /^\/shop\//.test(location.pathname);
  const key = 'wise-popup-last-shown-at-v1';
  const interval = 3 * 60 * 60 * 1000;
  const host = document.createElement('wise-kraken-popup');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
  <style>
    :host{font-family:WiseInter,-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color-scheme:light;color:#282d32}
    *{box-sizing:border-box}dialog{padding:0;margin:auto;border:1px solid #ded9ce;border-radius:24px;width:calc(100vw - 32px);max-width:584px;max-height:calc(100dvh - 32px);overflow:auto;background:#fff;color:#282d32;box-shadow:0 28px 100px #161b2930;outline:none}
    dialog::backdrop{background:#252b3670;backdrop-filter:blur(6px)}dialog[open]{animation:appear .22s ease-out}.content{padding:32px 36px 24px;text-align:center;position:relative}
    button,a{-webkit-tap-highlight-color:transparent;font:inherit}button{cursor:pointer}a{color:inherit}button:focus-visible,a:focus-visible{outline:2px solid #9a7b42;outline-offset:4px}button{border:0}.close{position:absolute;right:16px;top:16px;width:32px;height:32px;display:grid;place-items:center;background:#f3f4f5;border-radius:10px;color:#68717d}.close svg{width:16px;height:16px}
    .brand{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:22px}.brand img{width:48px;height:48px;border-radius:14px}.brand-name{text-align:left;font-size:20px;line-height:1.3;font-weight:650}.brand-name small{display:block;font-size:11px;font-weight:500;letter-spacing:.08em;color:#9a7b42;margin-top:5px}
    h2{font-size:27px;line-height:1.4;letter-spacing:-.035em;margin:0 0 9px;font-weight:700;outline:none}.intro{margin:0;color:#68717d;font-size:13px;line-height:1.7}
    .funds{background:#f5f6f7;border:1px solid #eaebed;border-radius:14px;margin:24px 0 20px;padding:17px 16px}.funds h3{font-size:14px;margin:0 0 10px;font-weight:650}.flow{display:flex;align-items:center;justify-content:center;gap:10px;font-size:13px;line-height:1.6}.flow svg{width:15px;flex-shrink:0;color:#9a7b42}.funds p{font-size:11px;line-height:1.6;color:#7c838c;margin:9px 0 0}
    .benefits{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin:0 0 22px}.benefit{padding:0 13px}.benefit+.benefit{border-left:1px solid #e5e5e5}.benefit h3{font-size:12px;font-weight:600;color:#68717d;margin:0 0 8px}.value{white-space:nowrap;font-size:34px;line-height:1.2;letter-spacing:-.04em;font-weight:700;color:#9a7b42;margin:0 0 10px}.value span{font-size:15px;letter-spacing:0;margin-left:4px}.value .before{font-size:17px;font-weight:500;color:#7c838c;margin:0 8px 0 0}.benefit p{font-size:12px;line-height:1.85;color:#68717d;margin:0}.benefit strong{color:#353c43;font-weight:600}
    .invite{border-top:1px solid #ecebea;padding:16px 0;display:flex;align-items:center;justify-content:center;gap:10px;font-size:12px;color:#68717d}.invite code{font:600 14px/1.4 ui-monospace,monospace;color:#282d32;letter-spacing:.04em}.copy{background:#f4f2ec;border:1px solid #e8dfce;border-radius:6px;padding:5px 9px;color:#876b36;font-size:11px;min-width:46px}.cta{display:flex;gap:10px;justify-content:center;align-items:center;background:#e3c481;color:#282d32;padding:15px 10px;border:1px solid #d4b776;border-radius:12px;font-size:14px;font-weight:650;text-decoration:none;transition:background .15s}.cta:hover{background:#d3b268}.cta svg{width:17px;height:17px}.note{font-size:11px;line-height:1.7;color:#7c838c;margin:12px 0 0}.foot{border-top:1px solid #ecebea;background:#f7f8f9;text-align:center;padding:13px 20px;color:#858b93;font-size:11px;line-height:1.6}
    [data-wise-kraken]{cursor:pointer}@keyframes appear{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    @media(max-width:480px){.content{padding:26px 20px 20px}.brand{margin-bottom:17px}.brand img{width:44px;height:44px}.brand-name{font-size:18px}h2{font-size:23px}.intro{font-size:12px}.funds{margin:20px 0;padding:14px 9px}.flow{font-size:11px;gap:6px}.benefit{padding:0 8px}.value{font-size:30px}.value .before{font-size:14px;margin-right:4px}.value span{font-size:12px}.benefit p{font-size:11px}.cta{font-size:13px}.foot{font-size:10px}}
    @media(max-width:360px){.value{font-size:26px}.value .before{font-size:12px}.benefit{padding:0 5px}}
    @media(prefers-reduced-motion:reduce){dialog[open]{animation:none}.cta{transition:none}}
  </style>
  <dialog aria-labelledby="kraken-title" aria-describedby="kraken-intro">
    <div class="content">
      <button class="close" type="button" aria-label="关闭海妖福利弹窗"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button>
      <div class="brand"><img src="/kraken-logo.jpg" alt="Kraken 海妖" width="48" height="48"><div class="brand-name">Kraken 海妖<small>WISE 专属福利</small></div></div>
      <h2 id="kraken-title" tabindex="-1">让资金周转，多一个选择</h2>
      <p class="intro" id="kraken-intro">从注册认证到入金、兑换、提现，一篇教程看懂。</p>
      <section class="funds" aria-label="资金出入金"><h3>连接加密资产与海外银行账户</h3><div class="flow"><span>加密资产转入</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg><span>兑换美元 / 欧元</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg><span>提现至本人银行</span></div><p>也支持银行入金，具体通道以所在地区与账户权限为准。</p></section>
      <div class="benefits"><section class="benefit"><h3>专属返佣 · 可申请升级</h3><div class="value"><span class="before">20% →</span>40%</div><p>专属邀请注册默认 <strong>20%</strong><br>注册后私信 Wise 提交 UID<br>可升级至 <strong>40% 返佣</strong></p></section><section class="benefit"><h3>符合资格的新用户奖励</h3><div class="value">10<span>USDC</span></div><p>填写下方邀请码注册<br>完成 <strong>100 USDC 入金</strong><br>及 <strong>100 USDC 交易</strong>即可领取</p></section></div>
      <div class="invite"><span>注册邀请码</span><code>htsqfhfq</code><button class="copy" type="button" aria-label="复制邀请码 htsqfhfq">复制</button><span class="copy-status" role="status" hidden></span></div>
      <a class="cta" href="https://www.wise-invest.org/articles/crypto/QWWO6E4L" target="_blank" rel="noopener noreferrer">查看海妖注册与出入金教程<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>
      <p class="note">10 USDC 为 Wise 专属活动奖励，需符合活动资格并完成任务。</p>
    </div><div class="foot">关闭后，可点击右上角「限时福利」再次查看</div>
  </dialog>`;
  document.body.append(host);
  const entryStyle=document.createElement('style');
  entryStyle.textContent='[data-wise-kraken]{display:inline-flex!important;align-items:center;justify-content:center;gap:5px;min-height:34px;padding:7px 10px!important;margin:0 4px 0 0;border:1px solid #d4bd8b!important;border-radius:9px!important;background:#f8f3e7!important;color:#876b36!important;font:600 12px/1.3 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif!important;white-space:nowrap;cursor:pointer;flex-shrink:0}[data-wise-kraken]::before{content:"✦";color:#9a7b42}[data-wise-kraken]:hover{background:#f1e6cb!important}[data-wise-kraken]:focus-visible{outline:2px solid #9a7b42;outline-offset:3px}@media(max-width:480px){[data-wise-kraken]{padding:6px 7px!important;font-size:11px!important;gap:3px;margin-right:2px}}';
  document.head.append(entryStyle);
  const dialog = root.querySelector('dialog');
  let previousFocus, previousOverflow;
  function record() { const now=Date.now();window.__wisePopupShownAt=now;for(const type of ['localStorage','sessionStorage']){try{window[type].setItem(key,String(now));}catch{}} }
  function eligible() {let last=window.__wisePopupShownAt||0;for(const type of ['localStorage','sessionStorage']){try{const n=Number(window[type].getItem(key));if(Number.isFinite(n)&&n>0&&n<=Date.now())last=Math.max(last,n);}catch{}}return Date.now()-last>=interval;}
  function restore(){if(previousOverflow===undefined)return;document.documentElement.style.overflow=previousOverflow;previousOverflow=undefined;previousFocus?.focus({preventScroll:true});}
  function close(){if(dialog.open){dialog.close();restore();}}
  function open(){if(blocked())return false;if(dialog.open)return true;window.WiseCommunityPopup?.close();previousFocus=document.activeElement;previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();record();root.querySelector('h2').focus({preventScroll:true});return true;}
  root.querySelector('.close').addEventListener('click',close);
  dialog.addEventListener('close',()=>{restore();window.dispatchEvent(new Event('wise-campaign:closed'));});
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
  root.querySelector('.copy').addEventListener('click',async()=>{const button=root.querySelector('.copy');try{await navigator.clipboard.writeText('htsqfhfq');button.textContent='已复制';}catch{button.textContent='请手动复制';}});
  document.addEventListener('click',e=>{if(e.target instanceof Element&&e.target.closest('[data-wise-kraken]'))open();});
  window.addEventListener('wise-community:opening',close);
  window.addEventListener('popstate',close);
  function openAutomatic(){
    if(blocked()||document.visibilityState==='hidden'||!eligible())return false;
    if(site==='etf'){try{if(!localStorage.getItem('etf-disclaimer'))return false;}catch{return false;}}
    if(document.querySelector('dialog[open], [role="dialog"][data-state="open"]'))return false;
    return open();
  }
  window.WiseKrakenPopup={open,close,openAutomatic};
  window.addEventListener('wise-campaign:auto',openAutomatic);
  const visible=()=>{if(document.visibilityState==='visible'){openAutomatic();document.removeEventListener('visibilitychange',visible);}};
  if(document.visibilityState==='hidden')document.addEventListener('visibilitychange',visible);else openAutomatic();
  window.dispatchEvent(new Event('wise-campaign:ready'));
})();
