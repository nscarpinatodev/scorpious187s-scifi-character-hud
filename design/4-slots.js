// ================= HELPERS =================
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
const sgn = n => (n >= 0 ? '+' : '') + n;
const mod5 = s => Math.floor((s - 10) / 2);
const pct = (v, m) => Math.max(0, Math.min(100, m ? (v / m) * 100 : 0));
const lbl = t => `<span class="lbl">${esc(t)}</span>`;
const bar = (v, m, cls = '') => `<div class="barx ${cls}"><i style="width:${pct(v, m)}%"></i></div>`;
const rollBtn = (text, f, l, extra = '') => `<button type="button" class="b roll ${extra}" data-act="roll" data-f="${esc(f)}" data-l="${esc(l)}">${esc(text)}</button>`;
const ro = key => `data-ro="${esc(key)}"`;
const nameBtn = (n, key) => `<button type="button" class="nm" ${ro(key || 'db:' + n)} data-act="pin" data-k="${esc(key || 'db:' + n)}">${esc(n)}</button>`;
const COST_GLYPH = { '1':'◆', '2':'◆◆', '3':'◆◆◆', R:'⟲', F:'◇', A:'A', B:'BA' };

function dbEntry(name) {
  const m = ME_DB[name];
  if (m) {
    const cost = m.act === 'action' ? String(m.n || 1) : m.act === 'reaction' ? 'R' : m.act === 'free' ? 'F' : null;
    const meta = [];
    if (m.level != null) meta.push(['Level', m.level]);
    if (m.dmg) meta.push(['Damage', `${m.dmg.dice}${m.dmg.die} ${m.dmg.damageType}`]);
    if (m.range) meta.push(['Range', m.range + ' ft']);
    if (m.ac != null) meta.push(['AC bonus', '+' + m.ac]);
    if (m.bulk != null && m.bulk !== 0) meta.push(['Bulk', m.bulk]);
    if (m.price) meta.push(['Price', Object.entries(m.price).map(([k, v]) => v + ' ' + k).join(' ')]);
    const kind = { weapon:'Weapon', armor:'Armor', equipment:'Equipment', consumable:'Consumable', background:'Background' }[m.type] || ({ class:'Class Feat', classfeature:'Class Feature', ancestry:'Ancestry Feat', ancestryfeature:'Ancestry Feature' }[m.cat] || 'Feat');
    return { kind, cost, traits: m.traits || [], meta, desc: m.desc, src:'Mass Effect conversion' };
  }
  return GENERIC_DB[name] || { kind:'Item', traits:[], desc:'Sample entry for the prototype.' };
}

// ================= IDENTITY =================
function renderIdentity(c, t) {
  const xp = `<div style="display:flex;flex-direction:column;gap:4px;width:170px;flex:none">${lbl('Experience')}<span class="mono" style="font-size:13px">${c.xp[0].toLocaleString()} / ${c.xp[1].toLocaleString()}</span>${bar(c.xp[0], c.xp[1])}</div>`;
  const rest = c.system === 'dnd5e'
    ? `<button type="button" class="b sm ghost" data-act="rest" data-k="short">Short rest</button><button type="button" class="b sm ghost" data-act="rest" data-k="long">Long rest</button>`
    : `<button type="button" class="b sm ghost" data-act="rest" data-k="night">Rest</button>`;
  const gear = `<button type="button" class="b ic" data-act="dialog" aria-label="HUD theme and sheet settings"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg></button>`;
  const lvl = `<div class="lvl">${lbl('Level')}<span class="big" style="font-size:21px">${c.level}</span></div>`;
  if (t === 'wrist') {
    return `<div class="lbl">Operator</div><div class="nm">${esc(c.name)}</div><div class="st">${esc(c.sub)}</div>
      <div class="row" style="margin-top:auto"><div class="grow">${bar(c.xp[0], c.xp[1])}</div><span class="mono" style="font-size:17px">LV ${c.level}</span></div>
      <div class="row">${rest}<span class="grow"></span>${gear}</div>`;
  }
  if (t === 'gdi' || t === 'nod') {
    return `<span class="big hot" style="font-family:var(--display);font-size:24px;font-weight:800;letter-spacing:.3em">EVA</span>
      <div class="ticker" id="ticker">&gt; ${esc(state.ticker)}<i>▌</i></div>
      <span style="font-weight:700;letter-spacing:.08em;color:var(--acc);font-size:17px;text-transform:uppercase">${esc(c.name)}</span>
      <span class="mono hot" style="padding:3px 9px;border:1px solid var(--line)">LV ${c.level}</span>${rest}${gear}`;
  }
  return `<div style="display:flex;flex-direction:column;flex:1 1 auto;min-width:0"><div class="nm">${esc(c.name)}</div><div class="st">${esc(c.sub)}</div></div>${xp}${lvl}${rest}${gear}`;
}

// ================= VITALS =================
function renderVitals(c) {
  const hp = `<div class="cell wide" style="align-items:stretch;gap:5px;padding:8px 10px">
    <div class="row sp">${lbl('Hit Points')}<button type="button" class="b sm" data-act="temp" data-d="5" title="Add 5 temporary HP">TEMP ${c.hp.temp}</button></div>
    <div class="row sp" style="gap:3px"><button type="button" class="b sm" data-act="hp" data-d="-5" aria-label="Lose 5 HP">−5</button><button type="button" class="b sm" data-act="hp" data-d="-1" aria-label="Lose 1 HP">−</button>
      <span class="big grow" style="font-size:26px;text-align:center">${c.hp.v}<span style="font-size:14px;color:var(--dim)">/${c.hp.max}</span></span>
      <button type="button" class="b sm" data-act="hp" data-d="1" aria-label="Heal 1 HP">+</button><button type="button" class="b sm" data-act="hp" data-d="5" aria-label="Heal 5 HP">+5</button></div>
    ${bar(c.hp.v, c.hp.max)}</div>`;
  let cells = '';
  if (c.system === 'sf2e') {
    const hero = [0, 1, 2].map(i => `<button type="button" class="pip ${i < c.hero ? 'on' : ''}" data-act="hero" data-i="${i}" aria-label="Hero point ${i + 1}"></button>`).join('');
    const dying = [0, 1, 2, 3].map(i => `<button type="button" class="pip bad ${i < c.dying ? 'on' : ''}" data-act="dying" data-i="${i}" aria-label="Dying ${i + 1}"></button>`).join('');
    cells = `<div class="cell">${lbl('Hero Points')}<div class="pips" style="padding:4px 0">${hero}</div></div>
      <div class="cell">${lbl('Dying')}<div class="pips" style="padding:4px 0">${dying}</div></div>
      <div class="cell">${lbl('Wounded')}<div class="row"><button type="button" class="b sm" data-act="stat" data-k="wounded" data-d="-1" aria-label="Wounded minus">−</button><span class="v">${c.wounded}</span><button type="button" class="b sm" data-act="stat" data-k="wounded" data-d="1" aria-label="Wounded plus">+</button></div></div>
      <div class="cell">${lbl('Doomed')}<div class="row"><button type="button" class="b sm" data-act="stat" data-k="doomed" data-d="-1" aria-label="Doomed minus">−</button><span class="v">${c.doomed}</span><button type="button" class="b sm" data-act="stat" data-k="doomed" data-d="1" aria-label="Doomed plus">+</button></div></div>`;
  } else {
    const ds = (k, cls) => [0, 1, 2].map(i => `<button type="button" class="pip ${cls} ${i < c.death[k] ? 'on' : ''}" data-act="death" data-k="${k}" data-i="${i}" aria-label="Death save ${k === 's' ? 'success' : 'failure'} ${i + 1}"></button>`).join('');
    cells = `<button type="button" class="cell" data-act="hd">${lbl('Hit Dice')}<span class="v">${c.hd.v}/${c.hd.max}${c.hd.die}</span></button>
      <button type="button" class="cell" data-act="insp" aria-pressed="${c.insp}">${lbl('Heroic Insp.')}<span class="v ${c.insp ? 'hot' : 'dimc'}">${c.insp ? '●' : '○'}</span></button>
      <div class="cell">${lbl('Death Saves')}<div class="pips">${ds('s', '')}</div><div class="pips">${ds('f', 'bad')}</div></div>
      <div class="cell">${lbl('Exhaustion')}<div class="row"><button type="button" class="b sm" data-act="stat" data-k="exh" data-d="-1" aria-label="Exhaustion minus">−</button><span class="v">${c.exh}</span><button type="button" class="b sm" data-act="stat" data-k="exh" data-d="1" aria-label="Exhaustion plus">+</button></div></div>`;
  }
  return `<div class="cells scroll">${hp}${cells}</div>`;
}

// ================= DEFENSES =================
function renderDefenses(c, compact) {
  const cell = (label, value, f, l) => f
    ? `<button type="button" class="cell" data-act="roll" data-f="${esc(f)}" data-l="${esc(l)}" ${ro(l.startsWith('Save') ? 'save:' + label : 'def:' + label)}>${lbl(label)}<span class="v">${value}</span></button>`
    : `<div class="cell">${lbl(label)}<span class="v">${value}</span></div>`;
  let h;
  if (c.system === 'sf2e') {
    h = `<div class="cell" style="background:var(--hotbg);border-color:var(--hot)">${lbl('AC')}<span class="v" style="font-size:24px;text-shadow:0 0 10px var(--glow)">${c.ac}</span></div>`
      + cell('Class DC', c.classDC) + cell('Fort', sgn(c.saves.fort[0]), `1d20+${c.saves.fort[0]}`, 'Save · Fortitude')
      + cell('Ref', sgn(c.saves.ref[0]), `1d20+${c.saves.ref[0]}`, 'Save · Reflex') + cell('Will', sgn(c.saves.will[0]), `1d20+${c.saves.will[0]}`, 'Save · Will')
      + cell('Perception', sgn(c.perception[0]), `1d20+${c.perception[0]}`, 'Perception check') + cell('Speed', c.speed + ' ft')
      + `<button type="button" class="cell" data-act="roll" data-f="1d20+${c.perception[0]}" data-l="Initiative (Perception)">${lbl('Initiative')}<span class="v">${sgn(c.perception[0])}</span></button>`;
  } else {
    h = `<div class="cell" style="background:var(--hotbg);border-color:var(--hot)">${lbl('AC')}<span class="v" style="font-size:24px;text-shadow:0 0 10px var(--glow)">${c.ac}</span></div>`
      + cell('Initiative', sgn(c.init), `1d20+${c.init}`, 'Initiative') + cell('Speed', c.speed + ' ft') + cell('Prof', sgn(c.prof))
      + cell('Passive', c.passive) + cell('Spell DC', c.spellDC);
  }
  return `<div class="cells scroll">${h}</div>`;
}

// ================= EFFECTS (slot) =================
function derivedEffects(c) {
  if (!c.pr || !state.me) return [];
  const out = [];
  for (const track of ['paragon', 'renegade']) for (const t of PR_TIERS[track]) if (t.kind === 'passive' && c.pr[track] >= t.v) out.push({ n: `${track === 'paragon' ? 'Paragon' : 'Renegade'} ${t.v} – ${t.name}`, track, tier: t });
  return out;
}
function renderEffectsSlot(c) {
  const list = c.system === 'sf2e' ? SF_CONDITIONS : DND_CONDITIONS;
  const eff = c.effects.map((e, i) => `<span class="chip" ${ro('eff:' + e.n)}>${esc(e.n)}${e.d ? ' · ' + esc(e.d) : ''}<button type="button" data-act="effrm" data-i="${i}" aria-label="Remove ${esc(e.n)}">×</button></span>`).join('');
  const der = derivedEffects(c).map(e => `<span class="chip me" ${ro('pr:' + e.track)} title="Granted by the Paragon/Renegade tracker">${esc(e.n)}</span>`).join('');
  const cond = c.conds.map((x, i) => `<span class="chip" ${ro('cond:' + x.n)}>${esc(x.n)}${x.v != null ? ` <button type="button" data-act="condv" data-i="${i}" data-d="-1" aria-label="Lower ${esc(x.n)}">−</button>${x.v}<button type="button" data-act="condv" data-i="${i}" data-d="1" aria-label="Raise ${esc(x.n)}">+</button>` : ''}<button type="button" data-act="condrm" data-i="${i}" aria-label="Remove ${esc(x.n)}">×</button></span>`).join('');
  return `<div class="row sp">${lbl('Effects')}<span class="mono dimc" style="font-size:12px">${c.effects.length + c.conds.length}</span></div>
    <div class="scroll grow" style="display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start">${eff}${cond}${der}${!eff && !cond && !der ? '<span class="dimc" style="font-size:13px">No active effects.</span>' : ''}</div>
    <select class="sel" data-act="condadd" aria-label="Add a condition"><option value="">+ Add condition…</option>${list.map(n => `<option>${esc(n)}</option>`).join('')}</select>`;
}

// ================= EXTRAS (Mass Effect dossier) =================
function renderExtras(c) {
  const s = c.shields;
  const track = k => {
    const v = c.pr[k], col = k === 'paragon' ? '#4aa8ff' : '#ff4a3a';
    const ticks = [20, 40, 60, 80].map(x => `<span style="position:absolute;left:${x}%;top:-2px;bottom:-2px;width:1px;background:rgba(255,255,255,.35)"></span>`).join('');
    return `<button type="button" class="b" data-act="pin" data-k="pr:${k}" ${ro('pr:' + k)} style="display:flex;flex-direction:column;align-items:stretch;gap:4px;padding:5px 8px;min-height:0;border-color:${col}55">
      <span class="row sp" style="font-size:11px;font-weight:700;letter-spacing:.12em;color:${col}">${k.toUpperCase()}<span class="mono" style="font-size:14px">${v}</span></span>
      <span style="position:relative;height:6px;background:rgba(255,255,255,.08)"><span style="position:absolute;left:0;top:0;bottom:0;width:${v}%;background:${col};box-shadow:0 0 8px ${col}"></span>${ticks}</span></button>`;
  };
  const gel = c.inv.flatMap(x => x.items).find(i => i.n === 'Omni-Gel');
  return `<div class="row sp">${lbl('Dossier')}<span class="chip me">ME</span></div>
    <div ${ro('shield')} style="display:flex;flex-direction:column;gap:4px">
      <div class="row sp"><span class="lbl" style="color:var(--acc)">Shields</span><span class="mono" style="color:#d9f2ff">${s.v} / ${s.max}</span></div>
      ${bar(s.v, s.max, 'a')}
      <div class="row" style="gap:4px"><button type="button" class="b sm" data-act="shield" data-d="-5">−5</button><button type="button" class="b sm" data-act="shield" data-d="${s.regen}">Regen +${s.regen}</button></div>
    </div>
    ${track('paragon')}${track('renegade')}
    <div class="row sp" style="font-size:13px">${lbl('Credits')}<span class="mono brt">₡ ${c.credits.toLocaleString()}</span></div>
    <div class="row sp" style="font-size:13px">${lbl('Omni-Gel')}<span class="mono brt">${gel ? gel.q : 0}</span></div>`;
}

// ================= READOUT =================
function readoutHtml(c, key) {
  if (!key) return `<div class="lbl">Readout</div><p class="dimc" style="font-size:13px;line-height:1.4">Hover or select a weapon, action, feat, skill, item or effect to see its details here.</p>`;
  const [kind, ...rest] = key.split(':'); const name = rest.join(':');
  const block = (title, sub, cost, traits, meta, desc, extra = '') => `
    <div class="row sp"><span class="lbl">${esc(sub)}</span>${cost ? `<span class="cost">${COST_GLYPH[cost] || esc(cost)}</span>` : ''}</div>
    <h3>${esc(title)}</h3>
    ${traits && traits.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${traits.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}
    ${meta && meta.length ? `<dl class="meta">${meta.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
    ${extra}
    ${desc ? `<p>${esc(desc)}</p>` : ''}`;
  if (kind === 'eff') { for (const tr of ['paragon', 'renegade']) { const tier = PR_TIERS[tr].find(x => x.name === name); if (tier) return block(name, `${tr === 'paragon' ? 'Paragon' : 'Renegade'} ${tier.v} · active`, null, [], [], tier.text); } }
  if (kind === 'db' || kind === 'eff') {
    const e = dbEntry(name);
    return block(name, e.kind || 'Effect', e.cost, e.traits, e.meta, e.desc || 'Active effect on this character.');
  }
  if (kind === 'cond') return block(name, 'Condition', null, [], [], COND_TEXT[name] || 'Condition.');
  if (kind === 'skill') {
    const r = c.skills[name] || 'U', a = SF_SKILL_ATTR[name], at = c.attrs[a], pb = r === 'U' ? 0 : RANK_BONUS[r] + c.level;
    const bonus = skillExtra(c, name);
    const meta = [['Attribute', `${a.toUpperCase()} ${sgn(at)}`], ['Proficiency', `${RANK_NAME[r]} ${sgn(pb)}`]];
    bonus.forEach(b => meta.push([b.src, sgn(b.v)]));
    return block(name, 'Skill', null, [], meta, null, `<div class="row">${rollBtn('Roll ' + sgn(skillMod(c, name)), '1d20+' + skillMod(c, name), 'Skill · ' + name)}</div>`);
  }
  if (kind === 'save' || kind === 'def') return block(name, kind === 'save' ? 'Saving Throw' : 'Statistic', null, [], [], 'Click the value in the defenses panel to roll.');
  if (kind === 'shield') {
    const s = c.shields;
    return block('Kinetic Shield', 'Mass Effect · Shields', null, [], [['Shield HP', `${s.v} / ${s.max}`], ['Regen', `${s.regen} per turn`]], dbEntry('Kinetic Shield').desc);
  }
  if (kind === 'pr') {
    const v = c.pr[name], T = name === 'paragon' ? 'Paragon' : 'Renegade';
    const tiers = PR_TIERS[name].map(t => {
      const on = v >= t.v, uses = c.prUses[name][t.v];
      const use = t.kind !== 'passive' ? `<button type="button" class="b sm" data-act="pruse" data-k="${name}" data-t="${t.v}" ${on && uses > 0 ? '' : 'disabled'}>Use ${uses}/1</button>` : '<span class="chip me">Passive</span>';
      return `<div class="tier ${on ? '' : 'off'}"><b class="${on ? 'hot' : ''}">${t.v}</b><span class="grow"><strong class="brt">${esc(t.name)}</strong><br><span class="dimc">${esc(t.text)}</span></span>${use}</div>`;
    }).join('');
    const btns = [1, 2, 5, -1].map(d => `<button type="button" class="b sm" data-act="pr" data-k="${name}" data-d="${d}">${d > 0 ? '+' + d : '−1'}</button>`).join('');
    return `<div class="row sp"><span class="lbl">Mass Effect · Tracker</span><span class="big" style="font-size:22px">${v}</span></div><h3>${T}</h3>
      <div class="row" style="gap:4px;flex-wrap:wrap">${btns}</div><div>${tiers}</div>
      <p class="dimc" style="font-size:12px">Stored in flags.world.${name} (0–100). Tier perks are added to and removed from the actor automatically.</p>`;
  }
  if (kind === 'ab') return block(name.toUpperCase(), 'Attribute', null, [], [], 'Click to roll an ability check.');
  return block(name, kind, null, [], [], '');
}
function skillExtra(c, name) {
  const out = [];
  if (c.pr && state.me) {
    const p = c.pr.paragon, r = c.pr.renegade;
    if (name === 'Diplomacy' && p >= 20) out.push({ src:'Paragon 20 (circ.)', v:1 });
    if ((name === 'Diplomacy' || name === 'Medicine') && p >= 100) out.push({ src:'Paragon 100 (status)', v:1 });
    if (name === 'Intimidation' && r >= 20) out.push({ src:'Renegade 20 (circ.)', v:1 });
    if ((name === 'Intimidation' || name === 'Deception') && r >= 100) out.push({ src:'Renegade 100 (status)', v:1 });
  }
  return out;
}
function skillMod(c, name) {
  const r = c.skills[name] || 'U';
  return c.attrs[SF_SKILL_ATTR[name]] + (r === 'U' ? 0 : RANK_BONUS[r] + c.level) + skillExtra(c, name).reduce((a, b) => a + b.v, 0);
}

// ================= NAV =================
const ICON = {
  character:'M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0M4 21c1-4 4.5-6 8-6s7 2 8 6', details:'M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0M4 21c1-4 4.5-6 8-6s7 2 8 6',
  actions:'M12 3l9 9-9 9-9-9z', inventory:'M6 7h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM9 7V4h6v3M4 13h16',
  spellcasting:'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3', spells:'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3',
  crafting:'M14.5 5.5a4 4 0 0 0 4.9 4.9L11 18.8a2.1 2.1 0 0 1-3-3l8.4-8.4M3 21l3-3', proficiencies:'M5 20V11M12 20V4M19 20v-7',
  feats:'M7 14a5 5 0 1 0 10 0a5 5 0 1 0-10 0M8 3l4 6 4-6', features:'M7 14a5 5 0 1 0 10 0a5 5 0 1 0-10 0M8 3l4 6 4-6',
  effects:'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0M3 12a9 9 0 0 1 9-9M21 12a9 9 0 0 1-9 9', biography:'M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11',
  bastion:'M4 21V9l4 2V7l4 2V5l4 2v4l4-2v12zM9 21v-4h6v4', specialTraits:'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z'
};
const svgIcon = id => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[id] || ICON.character}"/></svg>`;

function renderNav(c, t, L) {
  const tabs = c.system === 'sf2e' ? SF_TABS : DND_TABS, cur = state.tabs[c.id];
  const btn = (id, label, style, cls = '') => `<button type="button" class="navb ${cls} ${id === cur ? 'on' : ''}" data-act="tab" data-k="${id}" aria-label="${esc(label)}" aria-current="${id === cur}" data-tooltip="${esc(label)}" style="${style}">${svgIcon(id)}${cls === 'cam' ? `<span>${esc(label)}</span>` : ''}</button>`;
  if (t === 'omni') {
    const n = tabs.length, mid = (n - 1) / 2, P = L.projection, base = P[1] + P[3] + 12;
    let h = '';
    tabs.forEach(([id, label], i) => {
      const k = (i - mid) / mid, x = 640 - 28 + (i - mid) * 72, y = base + 26 * (1 - k * k);
      h += btn(id, label, `left:${x}px;top:${y}px`);
      if (id === cur) h += `<div class="navlbl" style="left:${x - 17}px;top:${y + 60}px">${esc(label)}</div>`;
    });
    return h;
  }
  if (t === 'wrist') {
    const half = Math.ceil(tabs.length / 2);
    let h = tabs.map(([id, label], i) => btn(id, label, `left:${i < half ? 150 : 1086}px;top:${292 + (i < half ? i : i - half) * 64}px`)).join('');
    const ci = tabs.findIndex(x => x[0] === cur), label = tabs[ci][1];
    h += `<div class="mono" style="position:absolute;left:${ci < half ? 136 : 1072}px;top:${292 + (ci < half ? ci : ci - half) * 64 + 54}px;width:72px;text-align:center;font-size:15px;color:#ff7fcb">${esc(label.toUpperCase())}</div>`;
    return h;
  }
  const N = L.nav, list = tabs.concat(c.system === 'sf2e' ? [['manage', 'Manage']] : []);
  return `<div class="slot cameos" style="left:${N[0]}px;top:${N[1]}px;width:${N[2]}px;height:${N[3]}px;grid-template-rows:repeat(${Math.ceil(list.length / 2)},minmax(0,1fr))">
    ${list.map(([id, label]) => id === 'manage'
      ? `<button type="button" class="navb cam" data-act="manage" aria-label="Manage tabs"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01"/></svg><span>Manage</span></button>`
      : btn(id, label, '', 'cam')).join('')}</div>`;
}
