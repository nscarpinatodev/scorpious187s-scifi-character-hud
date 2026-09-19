// ================= STATE =================
let CH = freshChars();
const state = { theme:'omni', char:'asha', chrome:'full', scan:true, me:true, power:true, hidden:false, hideKey:'h', capturing:false, win:1280, dialog:false,
  get frame() { return this.chrome === 'full'; },
  tabs:{ asha:'actions', dana:'inventory', vex:'details' }, sub:{}, pinned:null, preview:null, ticker:'Unit ready.' };
try { const s = JSON.parse(localStorage.getItem('hud-proto') || '{}'); for (const k of ['theme', 'char', 'chrome', 'scan', 'me', 'hideKey', 'win']) if (k in s) state[k] = s[k]; } catch (e) {}
const save = () => { try { localStorage.setItem('hud-proto', JSON.stringify({ theme:state.theme, char:state.char, chrome:state.chrome, scan:state.scan, me:state.me, hideKey:state.hideKey, win:state.win })); } catch (e) {} };
const stage = document.getElementById('stage'), toasts = document.getElementById('toasts');
const scrollMem = {};

// ================= LAYOUT (per theme) =================
function layout(t, frame, ex) {
  if (t === 'omni') return frame
    ? { identity:[250,20,780,60], vitals:[28,96,204,300], effects: ex ? [28,408,204,112] : [28,408,204,318], extras:[28,532,204,194], defenses:[1048,96,204,250], readout:[1048,360,204,366], projection:[250,92,780,470] }
    : { identity:[262,24,756,60], vitals:[28,100,212,310], effects: ex ? [28,422,212,150] : [28,422,212,376], extras:[28,584,212,214], defenses:[1040,100,212,250], readout:[1040,364,212,434], projection:[262,100,756,600] };
  if (t === 'wrist') return { identity:[24,14,286,204], vitals:[322,14,420,204], defenses: ex ? [754,14,238,204] : [754,14,502,204], extras:[1004,14,252,204], projection:[228,266,604,532], effects:[844,266,208,150], readout:[844,428,208,370] };
  return { identity:[26,24,1228,50], vitals:[26,258,262,236], effects: ex ? [26,506,262,104] : [26,506,262,330], extras:[26,622,262,214], projection:[300,86,664,660], defenses:[300,758,664,78], readout:[976,322,278,200], nav:[1006,534,248,302] };
}
const pos = r => `left:${r[0]}px;top:${r[1]}px;width:${r[2]}px;height:${r[3]}px`;
const EVA_CAP = { vitals:'Unit Status', effects:'Effects', extras:'Dossier', readout:'Intel', defenses:null };

// ================= ORNAMENTS =================
function ornBack(t, L, c) {
  const bare = state.chrome === 'clean';   // panels only: no device, no backdrop
  if (t === 'omni') {
    if (bare) return { back: '', dev: '' };
    const P = L.projection, y = P[1] + P[3];
    let s = `<svg width="1280" height="860" viewBox="0 0 1280 860" style="position:absolute;inset:0" aria-hidden="true"><defs>
      <pattern id="hx" width="28" height="48.5" patternUnits="userSpaceOnUse"><path d="M14 0l14 8v16l-14 8L0 24V8zM14 32v16.5" fill="none" stroke="#ff8c2a" stroke-opacity=".07"/></pattern>
      <linearGradient id="bm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".5"/><stop offset=".4" stop-color="#ff8c2a" stop-opacity=".14"/><stop offset="1" stop-color="#ff8c2a" stop-opacity=".03"/></linearGradient>
      <linearGradient id="am" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4150"/><stop offset=".3" stop-color="#1c2029"/><stop offset="1" stop-color="#0b0d12"/></linearGradient>
      <filter id="bl" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
      <rect class="hexbg" width="1280" height="860" fill="url(#hx)"/>`;
    if (state.frame) s += `${state.power ? `<polygon class="beam" points="${P[0]},${y} ${P[0] + P[2]},${y} 690,752 590,752" fill="url(#bm)"/>` : ''}
      <path id="omni-arm" d="M300 754 C 470 742 810 742 980 754 L 1000 860 L 280 860 Z" fill="url(#am)" stroke="#4a5263" stroke-width="1.5"/>
      <path d="M396 748 L386 860 M470 745 L464 860 M812 745 L820 860 M886 748 L900 860" stroke="#0a0c10" stroke-width="3"/>
      <rect x="540" y="734" width="200" height="74" rx="20" fill="#ff8c2a" fill-opacity=".22" filter="url(#bl)"/>
      <g id="omni-screen" style="pointer-events:auto;cursor:pointer">
      <path d="M548 741 C 600 732 680 732 732 741 L 736 806 C 680 798 600 798 544 806 Z" fill="#ff8c2a" fill-opacity=".2" stroke="#ffb866" stroke-opacity=".8"/>
      <path d="M560 758 h160 M560 774 h160 M560 790 h160" stroke="#ffb866" stroke-opacity=".35" stroke-dasharray="6 5"/>
      <path d="M640 736 l14 8 v14 l-14 8 l-14 -8 v-14 z" fill="#ff8c2a" fill-opacity=".45" stroke="#ffd9b0"/><circle cx="640" cy="751" r="4" fill="#fff1de"/></g>`;
    else s += `<ellipse cx="640" cy="836" rx="380" ry="20" fill="none" stroke="#ff9a3c" stroke-opacity=".3"/><ellipse cx="640" cy="836" rx="300" ry="14" fill="none" stroke="#ff9a3c" stroke-opacity=".16" stroke-dasharray="3 6"/>`;
    return { back: s + '</svg>', dev: '' };
  }
  if (t === 'wrist') {
    if (bare) return { back: '', dev: '' };
    let back = `<svg width="1280" height="860" viewBox="0 0 1280 860" style="position:absolute;inset:0" aria-hidden="true"><defs>
      <linearGradient id="sn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd34f"/><stop offset=".55" stop-color="#ff5e8a"/><stop offset="1" stop-color="#b3269a"/></linearGradient>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0418"/><stop offset="1" stop-color="#2a0b48"/></linearGradient>
      <linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d1a52"/><stop offset=".5" stop-color="#1a0e33"/><stop offset="1" stop-color="#0f0820"/></linearGradient>
      <clipPath id="sc"><rect width="1280" height="240"/></clipPath></defs>
      <g class="backdrop"><rect width="1280" height="240" fill="url(#sk)"/><g clip-path="url(#sc)"><circle cx="640" cy="240" r="170" fill="url(#sn)"/><g fill="#2a0b48"><rect x="460" y="150" width="360" height="6"/><rect x="460" y="174" width="360" height="8"/><rect x="460" y="198" width="360" height="10"/><rect x="460" y="222" width="360" height="12"/></g></g>
      <g stroke="#ff3ea5" stroke-opacity=".45"><path d="M0 240 H1280 M640 240 L40 860 M640 240 L240 860 M640 240 L440 860 M640 240 L840 860 M640 240 L1040 860 M640 240 L1240 860"/></g>
      <g stroke="#ff3ea5" stroke-opacity=".25"><path d="M0 266 H1280 M0 304 H1280 M0 364 H1280 M0 454 H1280 M0 584 H1280 M0 764 H1280"/></g></g></svg>`;
    let dev = '';
    if (state.frame) dev += `<svg width="1280" height="860" viewBox="0 0 1280 860" style="position:absolute;inset:0" aria-hidden="true"><defs><linearGradient id="cs2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d1a52"/><stop offset=".5" stop-color="#1a0e33"/><stop offset="1" stop-color="#0f0820"/></linearGradient></defs><rect x="136" y="206" width="1008" height="640" rx="54" fill="url(#cs2)" stroke="#8a55d6" stroke-width="2"/><rect x="142" y="212" width="996" height="628" rx="50" fill="none" stroke="#35ecf2" stroke-opacity=".5"/><rect x="580" y="218" width="120" height="6" rx="3" fill="#ff3ea5" fill-opacity=".85"/><circle cx="1100" cy="236" r="6" fill="#35ecf2"/><path d="M300 846 v14 M980 846 v14" stroke="#8a55d6" stroke-width="10"/></svg>`;
    dev += `<div style="position:absolute;left:212px;top:250px;width:856px;height:560px;box-sizing:border-box;border-radius:22px;border:${state.frame ? '3px solid #05020c;box-shadow:inset 0 0 40px rgba(255,62,165,.18),0 0 0 1px #8a55d6' : '1px solid #35ecf2;box-shadow:0 0 30px rgba(53,236,242,.35),inset 0 0 40px rgba(255,62,165,.15)'};background:radial-gradient(ellipse at 50% 40%,#1d0f3a 0%,#0d0620 75%)"></div>`;
    return { back, dev };
  }
  // EVA
  const hp = pct(c.hp.v, c.hp.max), segs = 24, lit = Math.round(segs * hp / 100);   // EVA keeps its readouts in every chrome mode; only the bezel goes
  const cur = c.system === 'sf2e' ? '$' + c.credits.toLocaleString() : c.currency.gp.toLocaleString() + ' gp';
  let s = '';
  if (state.frame) s += `<div style="position:absolute;inset:0;border:14px solid ${t === 'gdi' ? '#3a3d2c' : '#3a2020'};box-shadow:inset 0 0 0 2px #000,inset 0 0 0 4px var(--line);pointer-events:none;z-index:5"></div>`
    + ['left:2px;top:2px', 'right:2px;top:2px', 'left:2px;bottom:2px', 'right:2px;bottom:2px'].map(p => `<span style="position:absolute;${p};width:10px;height:10px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#9a9a8a,#2a2a24);z-index:6"></span>`).join('');
  if (!state.power) return { back: s, dev: '' };
  let d = `<div class="slot pnl" style="left:26px;top:86px;width:262px;height:160px"><div class="cap">EVA Link</div><svg viewBox="0 0 260 134" width="260" height="134" aria-hidden="true"><circle cx="130" cy="66" r="56" fill="none" stroke="var(--hot)" stroke-opacity=".3"/><circle cx="130" cy="66" r="44" fill="none" stroke="var(--hot)" stroke-opacity=".5" stroke-dasharray="3 5"/><circle cx="130" cy="66" r="30" fill="var(--hot)" fill-opacity=".08" stroke="var(--hot)"/>${[16, 32, 48, 24, 60, 36, 52, 20, 40, 12].map((h, i) => `<rect x="${92 + i * 8}" y="${66 - h / 2}" width="5" height="${h}" fill="var(--hot)"><animate attributeName="height" values="${h};${h / 3};${h}" dur="${0.6 + i * 0.07}s" repeatCount="indefinite"/><animate attributeName="y" values="${66 - h / 2};${66 - h / 6};${66 - h / 2}" dur="${0.6 + i * 0.07}s" repeatCount="indefinite"/></rect>`).join('')}</svg></div>
    <div class="slot pnl" style="left:976px;top:86px;width:278px;height:52px;flex-direction:row;align-items:center;justify-content:space-between;padding:0 14px;background:#000">${lbl('Credits')}<span class="big hot" style="font-size:28px">${cur}</span></div>
    <div class="slot pnl" style="left:976px;top:150px;width:278px;height:160px;background:#000;overflow:hidden"><svg width="276" height="158" style="position:absolute;inset:0" aria-hidden="true"><g stroke="var(--hot)" stroke-opacity=".18"><path d="M0 31H276M0 62H276M0 94H276M0 125H276M46 0V158M92 0V158M138 0V158M184 0V158M230 0V158"/></g><circle cx="138" cy="79" r="70" fill="none" stroke="var(--hot)" stroke-opacity=".35"/><path d="M138 79 L 204 50 A 70 70 0 0 0 184 26 Z" fill="var(--hot)" fill-opacity=".2"><animateTransform attributeName="transform" type="rotate" from="0 138 79" to="360 138 79" dur="6s" repeatCount="indefinite"/></path></svg>
      <div style="position:absolute;left:12px;top:12px;width:96px;height:134px;border:1px solid var(--hot);background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="var(--hot)" stroke-width="1.2" aria-hidden="true"><path d="${ICON.character}"/></svg></div>
      <div style="position:absolute;left:120px;top:14px;right:10px;display:flex;flex-direction:column;gap:3px">${lbl('Unit')}<b class="acc" style="font-size:15px">${esc(c.name)}</b>${lbl('Status')}<b class="${hp < 35 ? '' : 'hot'}" style="font-size:13px;color:${hp < 35 ? 'var(--bad)' : ''}">${hp < 35 ? 'CRITICAL' : hp < 70 ? 'DAMAGED' : 'OPERATIONAL'}</b></div></div>
    <div class="slot" style="position:absolute;left:976px;top:534px;width:24px;height:302px;box-sizing:border-box;border:1px solid var(--line);background:#000;display:flex;flex-direction:column-reverse;padding:3px;gap:2px" role="img" aria-label="Hit points ${c.hp.v} of ${c.hp.max}">${Array.from({ length: segs }, (_, i) => `<div style="flex:1;background:${i < lit ? (i < 5 ? 'var(--bad)' : i < 10 ? 'var(--acc)' : 'var(--hot)') : 'rgba(255,255,255,.05)'}"></div>`).join('')}</div>`;
  return { back: s, dev: d };
}

// ================= RENDER =================
function render() {
  const c = CH[state.char], t = state.theme, ex = !!(state.me && c.me);
  const L = layout(t, state.frame, ex), eva = t === 'gdi' || t === 'nod';
  const old = stage.querySelector('.proj-b'); if (old) scrollMem[old.dataset.key] = old.scrollTop;
  stage.className = `stage t-${t} ${state.frame ? 'frame-on' : 'frame-off'} ${state.scan ? 'scan-on' : ''} chrome-${state.chrome}`;
  if (state.hidden) {
    stage.classList.add('hud-hidden');
    stage.innerHTML = `<div class="hidepill"><b>${esc(c.name)}</b>HUD hidden<span>press <kbd>${esc(state.hideKey.toUpperCase())}</kbd> to bring it back</span></div>`;
    syncControls(); return;
  }
  const panel = (name, r, inner, cls = 'pad') => { if (eva && EVA_CAP[name]) cls = ''; return `<section class="slot pnl ${t === 'wrist' && ['identity', 'vitals', 'defenses', 'extras'].includes(name) ? 'tile' : ''} ${cls}" data-slot="${name}" style="${pos(r)}" aria-label="${name}">${eva && EVA_CAP[name] ? `<div class="cap">${EVA_CAP[name]}</div><div class="slot-in pad" style="display:flex;flex-direction:column;gap:10px;flex:1;min-height:0;padding:10px 12px">${inner}</div>` : inner}</section>`; };
  const O = ornBack(t, L, c);
  if (!state.power) {
    // Powered down: the housing stays, but the wrist unit has folded away entirely
    stage.innerHTML = `<div class="ornlayer">${O.back}</div>${t === 'wrist' ? '' : `<div class="ornlayer">${O.dev}</div>`}${powerPrompt(t, c)}`;
    syncControls(); return;
  }
  let h = `<div class="ornlayer">${O.back}</div><div class="foldwrap"><div class="ornlayer">${O.dev}</div><div class="sweep"></div><div class="flare"></div>`;
  h += panel('identity', L.identity, renderIdentity(c, t), 'ident');
  h += panel('vitals', L.vitals, renderVitals(c));
  h += panel('defenses', L.defenses, eva ? renderDefenses(c, true).replace('class="cells scroll"', 'class="cells scroll" style="grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);height:100%"') : renderDefenses(c), eva ? '' : 'pad');
  h += panel('effects', L.effects, renderEffectsSlot(c));
  if (ex) h += panel('extras', L.extras, renderExtras(c));
  h += eva
    ? `<section class="slot pnl" data-slot="readout" style="${pos(L.readout)}" aria-label="Readout"><div class="cap">Intel</div><div class="ro scroll pad" id="readout" aria-live="polite" style="display:flex;flex-direction:column;flex:1">${readoutHtml(c, state.preview || state.pinned)}</div></section>`
    : `<section class="slot pnl pad ro scroll" data-slot="readout" style="${pos(L.readout)}" aria-label="Readout" aria-live="polite" id="readout">${readoutHtml(c, state.preview || state.pinned)}</section>`;
  // projection
  const tabs = c.system === 'sf2e' ? SF_TABS : DND_TABS, tab = state.tabs[c.id], R = c.system === 'sf2e' ? SF : DND;
  const out = R[tab](c), body = typeof out === 'string' ? out : out.body, sub = typeof out === 'string' ? '' : out.sub;
  const key = c.id + ':' + tab + ':' + (state.sub[c.id] || '');
  h += `<section class="slot pnl proj" data-slot="projection" style="${pos(L.projection)}" aria-label="${tabs.find(x => x[0] === tab)[1]} tab">
    <div class="proj-h"><span class="proj-t">${tabs.find(x => x[0] === tab)[1]}</span>${sub}<span class="src">${TAB_SRC[c.system]}${tab}</span></div>
    <div class="proj-b scroll" data-key="${key}">${body}</div><div class="scanfx"></div></section>`;
  h += renderNav(c, t, L);
  h += `</div>`;
  if (state.dialog) h += renderDialog(c);
  stage.innerHTML = h;
  const nb = stage.querySelector('.proj-b'); if (nb && scrollMem[key]) nb.scrollTop = scrollMem[key];
  stagger();
  const P = L.projection; toasts.className = 't-' + t; Object.assign(toasts.style, { left: (P[0] + P[2] - 262) + 'px', top: (P[1] + 50) + 'px' });
  syncControls();
}
function refreshReadout() {
  const el = document.getElementById('readout'); if (!el) return;
  el.innerHTML = readoutHtml(CH[state.char], state.preview || state.pinned);
}

// ================= POWER SEQUENCE =================
const SEQ_ORDER = { projection:0, identity:1, vitals:2, defenses:3, effects:4, extras:5, readout:6 };
const ON_MS = 940, OFF_MS = 780;
let seqTimer = null;
function stagger() {
  for (const el of stage.querySelectorAll('[data-slot]')) {
    const i = SEQ_ORDER[el.dataset.slot] ?? 7;
    el.style.setProperty('--d', (i * 55) + 'ms');
    el.style.setProperty('--dr', ((7 - i) * 34) + 'ms');
  }
  stage.querySelectorAll('.navb').forEach((el, i) => {
    el.style.setProperty('--d', (200 + i * 26) + 'ms');
    el.style.setProperty('--dr', (i * 14) + 'ms');
  });
}
function playSeq(kind, done) {
  clearTimeout(seqTimer);
  stage.classList.remove('seq-on', 'seq-off');
  void stage.offsetWidth; // restart the animations
  stage.classList.add(kind === 'on' ? 'seq-on' : 'seq-off');
  seqTimer = setTimeout(() => { stage.classList.remove('seq-on', 'seq-off'); if (done) done(); }, kind === 'on' ? ON_MS : OFF_MS);
}
function powerOn() { if (state.power) return; state.power = true; render(); playSeq('on'); }
function powerOff() { if (!state.power) return; playSeq('off', () => { state.power = false; render(); }); }
const POWER_PROMPT = {
  omni:  [520, 712, 240, 112, 'Activate omni-tool'],
  wrist: [412, 430, 456, 190, 'Unfold wrist computer'],
  eva:   [430, 320, 420, 180, 'Bring console online'],
};
function powerPrompt(t, c) {
  const [x, y, w, hh, label] = POWER_PROMPT[t === 'gdi' || t === 'nod' ? 'eva' : t];
  return `<button type="button" class="powerbtn" data-act="power" data-k="on" style="left:${x}px;top:${y}px;width:${w}px;height:${hh}px">
    <span class="dot2"></span>${label}
    <span style="font-size:11px;letter-spacing:.06em;text-transform:none;color:var(--dim)">${esc(c.name)} · standby</span></button>`;
}

// ================= DIALOG =================
function renderDialog(c) {
  const card = (id, name, hint, sw) => `<button type="button" class="b card ${state.theme === id ? 'on' : ''}" data-act="settheme" data-k="${id}"><div class="sw" style="${sw}"></div><strong>${name}</strong><small>${hint}</small></button>`;
  return `<div class="dlg-bg" data-act="closebg"><div class="slot pnl dlg" style="position:relative" role="dialog" aria-modal="true" aria-label="HUD theme">
    <div class="row sp"><span class="proj-t">HUD Theme · ${esc(c.name)}</span><button type="button" class="b ic" data-act="close" aria-label="Close">×</button></div>
    <p style="margin:0;color:var(--dim);font-size:13px">Stored on this character, so each player can use a different device. The GM sets the world default in module settings.</p>
    <div class="cards">
      ${card('omni', 'Mass Effect Omni-tool', 'Orange holo · forearm projector', 'background:#07090d;border:1px solid #ff8c2a;box-shadow:inset 0 0 18px rgba(255,140,42,.45)')}
      ${card('wrist', 'Wrist Computer', 'Synthwave · on-device screen', 'background:#1a0d33;border:1px solid #35ecf2;box-shadow:inset 0 -14px 0 rgba(255,62,165,.55)')}
      ${card('gdi', 'EVA · GDI', 'Green and gold command console', 'background:#0c1209;border:1px solid #6dff5a;box-shadow:inset 0 0 0 4px #3a3d2c')}
      ${card('nod', 'EVA · Nod', 'Red and bone command console', 'background:#140707;border:1px solid #ff3b30;box-shadow:inset 0 0 0 4px #3a2020')}
    </div>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      ${[['full', 'Device frame'], ['bare', 'Backdrop only'], ['clean', 'Panels only']].map(([k, label]) => `<button type="button" class="b ${state.chrome === k ? 'on' : ''}" data-act="chrome" data-k="${k}" aria-pressed="${state.chrome === k}">${label}</button>`).join('')}
      <button type="button" class="b ${state.scan ? 'on' : ''}" data-act="scan" aria-pressed="${state.scan}">Scanlines</button></div>
    <div class="row" style="gap:8px;flex-wrap:wrap"><span class="lbl">Hide HUD</span>
      <button type="button" class="b keycap ${state.capturing ? 'armed' : ''}" data-act="capturekey">${state.capturing ? 'press a key…' : state.hideKey.toUpperCase()}</button>
      <span class="dimc" style="font-size:12px">Hides everything until you press it again. In Foundry this is a Foundry keybinding, so each player sets their own in Configure Controls.</span></div>
    <div class="row"><span class="grow"></span><button type="button" class="b ghost" data-act="toast" data-k="In Foundry this opens Sheet Configuration, where you can switch back to the standard sheet.">Standard sheet…</button></div>
  </div></div>`;
}

// ================= DICE / TOASTS =================
function rollFormula(f, crit) {
  const m = String(f).match(/^(\d+)d(\d+)([+-]\d+)?$/); if (!m) return { total:0, dice:[] };
  const n = +m[1] * (crit ? 2 : 1), d = +m[2], k = +(m[3] || 0);
  const dice = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * d));
  return { total: dice.reduce((a, b) => a + b, 0) + k * (crit ? 2 : 1), dice, d, k: k * (crit ? 2 : 1) };
}
function toast(title, value, detail, cls = '') {
  const el = document.createElement('div'); el.className = 'toast ' + cls;
  el.innerHTML = `<div class="tt">${esc(title)}</div>${value !== null ? `<div class="tv">${esc(value)}</div>` : ''}${detail ? `<div class="tf">${esc(detail)}</div>` : ''}`;
  toasts.prepend(el); while (toasts.children.length > 4) toasts.lastChild.remove();
  setTimeout(() => el.remove(), 5200);
  state.ticker = value !== null ? `${title}: ${value}` : title;
  const tk = document.getElementById('ticker'); if (tk) tk.innerHTML = `&gt; ${esc(state.ticker)}<i>▌</i>`;
}
function doRoll(f, label, crit) {
  const r = rollFormula(f, crit), d20 = r.d === 20 && r.dice.length === 1 ? r.dice[0] : null;
  toast(label, r.total, `${crit ? 'crit ' : ''}${r.dice.length}d${r.d}${r.k ? sgn(r.k) : ''} → [${r.dice.join(', ')}]${r.k ? ' ' + sgn(r.k) : ''}${d20 === 20 ? ' · natural 20' : d20 === 1 ? ' · natural 1' : ''}`, d20 === 20 ? 'crit' : d20 === 1 ? 'fumble' : '');
}

// ================= EVENTS =================
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function act(a, d) {
  const c = CH[state.char];
  switch (a) {
    case 'tab': state.tabs[c.id] = d.k; state.preview = null; break;
    case 'sub': state.sub[c.id] = d.k; break;
    case 'roll': doRoll(d.f, d.l, d.x === '2'); return;
    case 'pin': state.pinned = d.k; state.preview = null; refreshReadout(); return;
    case 'use': { const e = dbEntry(d.k); toast(`${d.k} used`, null, e.cost ? `${COST_GLYPH[e.cost]} posted to chat` : 'posted to chat'); state.pinned = 'db:' + d.k; refreshReadout(); return; }
    case 'hp': c.hp.v = clamp(c.hp.v + +d.d, 0, c.hp.max); break;
    case 'temp': c.hp.temp += +d.d; break;
    case 'hero': c.hero = c.hero === +d.i + 1 ? +d.i : +d.i + 1; break;
    case 'dying': c.dying = c.dying === +d.i + 1 ? +d.i : +d.i + 1; break;
    case 'stat': c[d.k] = clamp(c[d.k] + +d.d, 0, d.k === 'exh' ? 6 : 4); break;
    case 'death': c.death[d.k] = c.death[d.k] === +d.i + 1 ? +d.i : +d.i + 1; break;
    case 'insp': c.insp = !c.insp; break;
    case 'hd': if (c.hd.v > 0) { c.hd.v--; const r = rollFormula('1' + c.hd.die + '+' + mod5(c.abil[2][1])); c.hp.v = clamp(c.hp.v + r.total, 0, c.hp.max); toast('Hit Die spent', '+' + r.total, `1${c.hd.die}${sgn(mod5(c.abil[2][1]))} → [${r.dice}]`); } break;
    case 'effrm': c.effects.splice(+d.i, 1); break;
    case 'condrm': c.conds.splice(+d.i, 1); break;
    case 'condv': { const x = c.conds[+d.i]; x.v = clamp(x.v + +d.d, 0, 9); if (!x.v) c.conds.splice(+d.i, 1); break; }
    case 'qty': { const it = c.inv[+d.s].items[+d.i]; it.q = Math.max(0, it.q + +d.d); break; }
    case 'qty5': { const it = c.inv5[+d.s].items[+d.i]; it.q = Math.max(0, it.q + +d.d); break; }
    case 'carry': { const it = c.inv[+d.s].items[+d.i], order = ['Held 1', 'Held 2', 'Worn', 'Stowed', 'Dropped']; it.c = order[(order.indexOf(it.c) + 1) % order.length]; break; }
    case 'equip': { const it = c.inv5[+d.s].items[+d.i]; it.eq = !it.eq; break; }
    case 'consume': { const it = c.inv5[+d.s].items[+d.i]; if (it.q > 0) { it.q--; const r = rollFormula(it.use); c.hp.v = clamp(c.hp.v + r.total, 0, c.hp.max); toast(it.n, '+' + r.total + ' HP', `${it.use} → [${r.dice}]`); } break; }
    case 'feat': { const f = c.features.flatMap(g => g[1]).find(x => x[0] === d.k); f[1][0] = f[1][0] === +d.i + 1 ? +d.i : +d.i + 1; break; }
    case 'slot': { const s = c.slots[d.k]; s[0] = s[0] === +d.i + 1 ? +d.i : +d.i + 1; break; }
    case 'cast': { const lv = +d.l; if (lv) { if (c.slots[lv][0] < 1) { toast('No slots left', null, `Level ${lv} slots are spent. Take a long rest.`, 'fumble'); return; } c.slots[lv][0]--; }
      const e = dbEntry(d.k), atk = (e.meta || []).find(m => m[0] === 'Attack');
      if (atk) doRoll('1d20+' + c.spellAtk, 'Spell attack · ' + d.k); else toast(d.k + ' cast', null, lv ? `Level ${lv} slot spent` : 'Cantrip');
      state.pinned = 'db:' + d.k; break; }
    case 'flag': c.flags[d.k] = !c.flags[d.k]; break;
    case 'shield': c.shields.v = clamp(c.shields.v + +d.d, 0, c.shields.max); break;
    case 'pr': { const before = c.pr[d.k]; c.pr[d.k] = clamp(before + +d.d, 0, 100); state.pinned = 'pr:' + d.k;
      const crossed = PR_TIERS[d.k].filter(x => (before < x.v) !== (c.pr[d.k] < x.v));
      crossed.forEach(x => toast(`${d.k === 'paragon' ? 'Paragon' : 'Renegade'} ${x.v} – ${x.name}`, null, c.pr[d.k] >= x.v ? 'Tier unlocked · perk added to the character' : 'Tier lost · perk removed', c.pr[d.k] >= x.v ? 'crit' : 'fumble'));
      break; }
    case 'pruse': { const u = c.prUses[d.k]; if (u[d.t] < 1) return; u[d.t]--; const tier = PR_TIERS[d.k].find(x => x.v === +d.t);
      if (tier.kind === 'one' || tier.kind === 'free') c.effects.push({ n: tier.name, d: tier.v === 40 ? 'next check' : tier.v === 80 && d.k === 'renegade' ? 'this turn' : '1 min' });
      toast(tier.name, null, `${d.k === 'paragon' ? 'Paragon' : 'Renegade'} ${tier.v} used · 0/1 today`); state.pinned = 'pr:' + d.k; break; }
    case 'rest': {
      if (c.system === 'sf2e') { const gain = Math.max(1, c.attrs.con) * c.level; c.hp.v = clamp(c.hp.v + gain, 0, c.hp.max); if (c.prUses) for (const k in c.prUses) for (const t in c.prUses[k]) c.prUses[k][t] = 1; if (c.shields) c.shields.v = c.shields.max; c.wounded = 0; toast('Rest for the night', '+' + gain + ' HP', 'Daily uses restored'); }
      else if (d.k === 'long') { c.hp.v = c.hp.max; c.hd.v = Math.min(c.hd.max, c.hd.v + Math.ceil(c.hd.max / 2)); for (const k in c.slots) c.slots[k][0] = c.slots[k][1]; c.insp = true; c.death = { s:0, f:0 }; c.exh = Math.max(0, c.exh - 1); c.features.flatMap(g => g[1]).forEach(f => { if (f[1]) f[1][0] = f[1][1]; }); toast('Long rest', 'Full HP', 'Slots, hit dice, Lucky and Heroic Inspiration restored'); }
      else toast('Short rest', null, 'Spend Hit Dice from the vitals panel.');
      break; }
    case 'dialog': state.dialog = true; break;
    case 'close': state.dialog = false; break;
    case 'power': if (d.k === 'on') powerOn(); else powerOff(); return;
    case 'settheme': state.theme = d.k; save(); render(); if (state.power) playSeq('on'); return;
    case 'chrome': state.chrome = d.k; save(); break;
    case 'capturekey': state.capturing = !state.capturing; break;
    case 'scan': state.scan = !state.scan; save(); break;
    case 'manage': toast('Manage tabs', null, "In Foundry this opens the system's tab manager."); return;
    case 'toast': toast(d.k, null, ''); return;
    default: return;
  }
  render();
}
stage.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || !stage.contains(t)) return;
  if (t.dataset.act === 'closebg') { if (e.target === t) { state.dialog = false; render(); } return; }
  if (t.tagName === 'SELECT') return;
  act(t.dataset.act, t.dataset);
});
stage.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.act === 'condadd' && t.value) { const c = CH[state.char], n = t.value; if (!c.conds.find(x => x.n === n)) c.conds.push({ n, v: SF_VALUED.includes(n) && c.system === 'sf2e' ? 1 : null }); render(); }
});
stage.addEventListener('input', e => { const t = e.target; if (t.dataset.bio) CH[state.char].bio[t.dataset.bio] = t.value; });
stage.addEventListener('mouseover', e => { const t = e.target.closest('[data-ro]'); const k = t ? t.dataset.ro : null; if (k !== state.preview) { state.preview = k; refreshReadout(); } });
stage.addEventListener('mouseleave', () => { state.preview = null; refreshReadout(); });
stage.addEventListener('focusin', e => { const t = e.target.closest('[data-ro]'); if (t) { state.preview = t.dataset.ro; refreshReadout(); } });
stage.addEventListener('keydown', e => { if (e.key === 'Escape' && state.dialog) { state.dialog = false; render(); } });

// ================= TOOLBAR =================
const selTheme = document.getElementById('selTheme'), selChar = document.getElementById('selChar');
const tg = { tgScan:'scan', tgMe:'me' };
const selChrome = document.getElementById('selChrome'), selWin = document.getElementById('selWin');
function syncControls() {
  selTheme.value = state.theme; selChar.value = state.char; selChrome.value = state.chrome; selWin.value = String(state.win);
  for (const [id, k] of Object.entries(tg)) document.getElementById(id).setAttribute('aria-pressed', String(state[k]));
  document.getElementById('tgPower').setAttribute('aria-pressed', String(state.power));
  const me = document.getElementById('tgMe'); me.disabled = !CH[state.char].me; me.title = CH[state.char].me ? '' : 'Only shown for characters from the Mass Effect conversion';
}
selTheme.addEventListener('change', () => { state.theme = selTheme.value; save(); render(); if (state.power) playSeq('on'); });
selChar.addEventListener('change', () => { state.char = selChar.value; state.pinned = null; state.preview = null; save(); render(); });
for (const [id, k] of Object.entries(tg)) document.getElementById(id).addEventListener('click', () => { state[k] = !state[k]; save(); render(); });
selChrome.addEventListener('change', () => { state.chrome = selChrome.value; save(); render(); });
selWin.addEventListener('change', () => { state.win = +selWin.value; save(); fit(); });
document.getElementById('tgPower').addEventListener('click', () => { if (state.power) powerOff(); else powerOn(); });
document.getElementById('btnReset').addEventListener('click', () => { CH = freshChars(); state.pinned = null; render(); toast('Sample data reset', null, ''); });

// ================= HIDE KEY =================
document.addEventListener('keydown', e => {
  const el = document.activeElement, typing = el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT');
  if (state.capturing) {
    if (e.key === 'Escape') { state.capturing = false; render(); return; }
    if (e.key.length !== 1) return;
    e.preventDefault(); state.hideKey = e.key.toLowerCase(); state.capturing = false; save(); render();
    toast('Hide key set', null, `Press ${state.hideKey.toUpperCase()} to hide the HUD`); return;
  }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.toLowerCase() !== state.hideKey) return;
  e.preventDefault(); state.hidden = !state.hidden; render();
});

// ================= SCALE =================
const wrap = document.getElementById('wrap'), scaler = document.getElementById('scaler');
function fit() { wrap.style.maxWidth = state.win + 'px'; const s = Math.min(1, wrap.clientWidth / 1280); scaler.style.transform = `scale(${s})`; wrap.style.height = (860 * s) + 'px'; }
new ResizeObserver(fit).observe(wrap); fit();
render();
if (state.power) playSeq('on');
