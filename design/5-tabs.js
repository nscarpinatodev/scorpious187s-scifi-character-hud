// ================= SF2e / PF2e TABS =================
const SF = {
  character(c) {
    const kv = ([k, v]) => `<div class="kv">${lbl(k)}<b>${esc(v)}</b></div>`;
    const attrs = Object.entries(c.attrs).map(([k, v]) => `<button type="button" class="cell" data-act="roll" data-f="1d20+${v}" data-l="${k.toUpperCase()} check">${lbl(k)}<span class="v">${sgn(v)}</span></button>`).join('');
    const prof = rows => rows.map(([n, r]) => `<div class="li flat"><span class="grow">${esc(n)}</span><span class="mono acc">${esc(r.toUpperCase())}</span></div>`).join('');
    return `<div class="grid3">${c.ident.map(kv).join('')}</div>
      <div class="sec">Attribute Modifiers</div><div class="grid6">${attrs}</div>
      <div class="grid2"><div><div class="sec">Attack Proficiencies</div>${prof(c.attackProf)}</div><div><div class="sec">Defense Proficiencies</div>${prof(c.defenseProf)}</div></div>
      <div class="sec">Details</div><div class="grid3" style="grid-template-columns:repeat(4,minmax(0,1fr))">${c.details.map(kv).join('')}</div>`;
  },
  actions(c) {
    const sub = state.sub[c.id] || 'encounter';
    const subs = ['encounter', 'exploration', 'downtime'].map(s => `<button type="button" class="b sm ${s === sub ? 'on' : ''}" data-act="sub" data-k="${s}">${s}</button>`).join('');
    const act = ([n]) => { const e = dbEntry(n); return `<div class="li"><span class="cost">${COST_GLYPH[e.cost] || ''}</span><span class="grow">${nameBtn(n)}</span>${(e.traits || []).slice(0, 2).map(t => `<span class="chip">${esc(t)}</span>`).join('')}<button type="button" class="b sm ghost" data-act="use" data-k="${esc(n)}">Use</button></div>`; };
    let body = '';
    if (sub === 'encounter') {
      const strikes = c.strikes.map(s => {
        const a = [s.bonus, s.bonus - s.map, s.bonus - 2 * s.map];
        return `<div class="li" style="flex-wrap:wrap;gap:8px 10px;padding:8px 10px">
          <div class="grow" style="min-width:150px;display:flex;flex-direction:column;gap:2px">${nameBtn(s.name)}<span class="sub">${esc(s.meta)}</span></div>
          <div class="row" style="gap:4px">${a.map((v, i) => rollBtn(sgn(v), '1d20+' + v, `Strike · ${s.name}${i ? ` (MAP ${-i * s.map})` : ''}`, i ? '' : 'on')).join('')}</div>
          <div class="row" style="gap:4px"><button type="button" class="b sm ghost" data-act="roll" data-f="${s.dmg}" data-l="Damage · ${esc(s.name)} (${s.type})">Damage <span class="mono brt">${s.dmg}</span></button><button type="button" class="b sm ghost" data-act="roll" data-f="${s.dmg}" data-x="2" data-l="Critical · ${esc(s.name)}">Critical</button></div></div>`;
      }).join('');
      body = `<div class="sec">Strikes</div>${strikes}<div class="sec">Actions</div><div class="grid2">${c.actions.encounter.map(act).join('')}</div><div class="sec">Reactions</div><div class="grid2">${c.actions.reactions.map(act).join('')}</div>`
        + (c.pr && state.me ? prActions(c) : '');
    } else body = `<div class="grid2">${c.actions[sub].map(act).join('')}</div>`;
    return { sub: subs, body };
  },
  inventory(c) {
    const all = c.inv.flatMap(s => s.items), bulk = all.reduce((a, i) => a + (i.c === 'Dropped' ? 0 : i.b * i.q * (i.b < 1 ? 1 : 1)), 0);
    const [enc, max] = c.bulkLimit, bv = Math.round(bulk * 10) / 10;
    const bb = `<div class="row sp">${lbl('Bulk')}<span class="mono" style="font-size:13px;color:${bv >= enc ? 'var(--bad)' : 'var(--text)'}">${bv} · encumbered at ${enc} · max ${max}</span></div>
      <div style="height:10px;display:flex;gap:2px">${Array.from({ length: max }, (_, i) => `<div style="flex:1;background:${i < bv ? (i >= enc ? 'var(--bad)' : 'var(--hot)') : 'var(--line2)'};${i === enc - 1 ? 'box-shadow:2px 0 0 var(--acc)' : ''}"></div>`).join('')}</div>`;
    const sec = c.inv.map((s, si) => `<div class="sec">${esc(s.sec)}</div>` + s.items.map((it, ii) => `<div class="li flat">
        <span class="grow">${nameBtn(it.n)}</span>
        <span class="row" style="gap:3px"><button type="button" class="b sm" data-act="qty" data-s="${si}" data-i="${ii}" data-d="-1" aria-label="Fewer ${esc(it.n)}">−</button><span class="mono" style="width:26px;text-align:center">${it.q}</span><button type="button" class="b sm" data-act="qty" data-s="${si}" data-i="${ii}" data-d="1" aria-label="More ${esc(it.n)}">+</button></span>
        <span class="mono dimc" style="width:34px;text-align:right">${it.b === 0 ? '—' : it.b < 1 ? 'L' : it.b}</span>
        <button type="button" class="b sm" style="width:92px" data-act="carry" data-s="${si}" data-i="${ii}">${esc(it.c)}</button></div>`).join('')).join('');
    return `${bb}<div class="row sp">${lbl('Credits')}<span class="big" style="font-size:20px">₡ ${c.credits.toLocaleString()}</span></div>${sec}`;
  },
  spellcasting(c) {
    return `<div class="empty"><div class="lbl" style="margin-bottom:6px">No spellcasting entries</div>${c.me ? 'Mass Effect biotic and tech powers are feats with actions, so they appear in the Actions and Feats tabs.' : 'This character has no spellcasting.'}<div style="margin-top:12px"><button type="button" class="b sm ghost" data-act="toast" data-k="In Foundry this opens the system's Create Spellcasting Entry dialog.">Create entry</button></div></div>`;
  },
  crafting(c) {
    const m = skillMod(c, 'Crafting');
    return `<div class="row sp">${lbl('Formula Book')}${rollBtn('Crafting ' + sgn(m), '1d20+' + m, 'Skill · Crafting')}</div>`
      + c.formulas.map(([n, lv, dc]) => `<div class="li"><span class="grow">${nameBtn(n)}</span><span class="chip">Level ${lv}</span><span class="mono dimc">DC ${dc}</span><button type="button" class="b sm ghost" data-act="roll" data-f="1d20+${m}" data-l="Craft · ${esc(n)} (DC ${dc})">Craft</button></div>`).join('');
  },
  proficiencies(c) {
    const row = (n, r, v, key) => `<div class="li flat"><span class="rk ${r}">${r}</span><span class="grow"><button type="button" class="nm" style="font-weight:600;font-size:1em" ${ro(key)} data-act="pin" data-k="${esc(key)}">${esc(n)}</button></span>${rollBtn(sgn(v), '1d20+' + v, 'Skill · ' + n)}</div>`;
    const skills = Object.keys(SF_SKILL_ATTR).map(n => row(n, c.skills[n], skillMod(c, n), 'skill:' + n)).join('');
    const lores = c.lores.map(([n, r]) => row(n, r, c.attrs.int + RANK_BONUS[r] + c.level, 'db:' + n)).join('');
    return `<div class="row sp">${lbl('Skills')}<span class="dimc" style="font-size:12px">U untrained · T trained · E expert · M master · L legendary</span></div><div class="grid2">${skills}</div><div class="sec">Lore</div><div class="grid2">${lores}</div>`;
  },
  feats(c) {
    return c.feats.map(([title, rows]) => `<div class="sec">${esc(title)}</div>` + rows.map(([lv, n]) => { const e = dbEntry(n); return `<div class="li">${lv != null ? `<span class="mono dimc" style="width:22px">${lv}</span>` : ''}<span class="grow">${nameBtn(n)}</span>${e.cost ? `<span class="cost">${COST_GLYPH[e.cost]}</span>` : ''}${(e.traits || []).slice(0, 2).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>`; }).join('')).join('');
  },
  effects(c) {
    const eff = c.effects.map((e, i) => `<div class="li"><span class="grow">${nameBtn(e.n, 'eff:' + e.n)}</span><span class="mono dimc">${esc(e.d || 'unlimited')}</span><button type="button" class="b sm" data-act="effrm" data-i="${i}">Remove</button></div>`).join('') || '<p class="dimc">None.</p>';
    const der = derivedEffects(c).map(e => `<div class="li"><span class="grow">${nameBtn(e.n, 'pr:' + e.track)}</span><span class="chip me">Tracker</span></div>`).join('');
    const cond = c.conds.map((x, i) => `<div class="li"><span class="grow">${nameBtn(x.n, 'cond:' + x.n)}</span>${x.v != null ? `<button type="button" class="b sm" data-act="condv" data-i="${i}" data-d="-1" aria-label="Lower">−</button><span class="mono">${x.v}</span><button type="button" class="b sm" data-act="condv" data-i="${i}" data-d="1" aria-label="Raise">+</button>` : ''}<button type="button" class="b sm" data-act="condrm" data-i="${i}">Remove</button></div>`).join('') || '<p class="dimc">None.</p>';
    return `<div class="sec">Effects</div>${eff}${der}<div class="sec">Conditions</div>${cond}`;
  },
  biography(c) {
    return Object.entries(c.bio).map(([k, v]) => `<label class="lbl" for="bio-${k}">${esc(k)}</label><textarea class="ta" id="bio-${k}" data-bio="${esc(k)}">${esc(v)}</textarea>`).join('');
  }
};
function prActions(c) {
  const rows = [];
  for (const k of ['paragon', 'renegade']) for (const t of PR_TIERS[k]) if (t.kind !== 'passive' && c.pr[k] >= t.v) {
    const u = c.prUses[k][t.v];
    rows.push(`<div class="li"><span class="cost">${t.kind === 'reaction' ? '⟲' : t.kind === 'free' ? '◇' : '◆'}</span><span class="grow"><button type="button" class="nm" ${ro('pr:' + k)} data-act="pin" data-k="pr:${k}">${k === 'paragon' ? 'Paragon' : 'Renegade'} ${t.v} – ${esc(t.name)}</button></span><span class="chip me">${u}/1 day</span><button type="button" class="b sm ghost" data-act="pruse" data-k="${k}" data-t="${t.v}" ${u > 0 ? '' : 'disabled'}>Use</button></div>`);
  }
  return rows.length ? `<div class="sec">Paragon / Renegade</div><div class="grid2">${rows.join('')}</div>` : '';
}

// ================= D&D 5e TABS =================
const DND = {
  details(c) {
    const ab = c.abil.map(([k, s, sp]) => { const m = mod5(s), sv = m + (sp ? c.prof : 0); return `<div class="cell" style="padding:8px 4px;gap:4px">${lbl(k)}
      <button type="button" class="b roll" style="font-size:22px;min-height:36px" data-act="roll" data-f="1d20+${m}" data-l="${k.toUpperCase()} check">${sgn(m)}</button>
      <span class="mono dimc" style="font-size:13px">${s}</span>
      <button type="button" class="b sm" data-act="roll" data-f="1d20+${sv}" data-l="${k.toUpperCase()} save">${sp ? '●' : '○'} save ${sgn(sv)}</button></div>`; }).join('');
    const sk = c.skills.map(([n, a, p]) => { const s = c.abil.find(x => x[0] === a)[1], v = mod5(s) + p * c.prof; return `<div class="li flat" style="min-height:32px"><span style="width:14px;color:${p === 2 ? 'var(--hot)' : p ? 'var(--acc)' : 'var(--line)'}">${p === 2 ? '◆' : p ? '●' : '○'}</span><span class="grow">${esc(n)}</span><span class="mono dimc" style="width:30px">${a.toUpperCase()}</span>${rollBtn(sgn(v), '1d20+' + v, 'Skill · ' + n)}</div>`; }).join('');
    return `<div class="grid6">${ab}</div><div style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:16px"><div><div class="sec">Skills</div><div class="grid2" style="gap:0 12px">${sk}</div></div>
      <div><div class="sec">Traits</div>${c.traits.map(([k, v]) => `<div class="kv" style="margin-bottom:6px">${lbl(k)}<b style="font-size:13px">${esc(v)}</b></div>`).join('')}</div></div>`;
  },
  inventory(c) {
    const cur = Object.entries(c.currency).map(([k, v]) => `<div class="kv" style="align-items:center">${lbl(k)}<b class="mono">${v}</b></div>`).join('');
    const w = c.inv5.flatMap(s => s.items).reduce((a, i) => a + i.w * i.q, 0);
    const atk = c.attacks.map(a => `<div class="li"><span class="grow">${nameBtn(a.name)}</span>${rollBtn(sgn(a.bonus), '1d20+' + a.bonus, 'Attack · ' + a.name, 'on')}<button type="button" class="b sm ghost" data-act="roll" data-f="${a.dmg}" data-l="Damage · ${esc(a.name)} (${a.type})">${a.dmg}</button></div>`).join('');
    const sec = c.inv5.map((s, si) => `<div class="sec">${esc(s.sec)}</div>` + s.items.map((it, ii) => `<div class="li flat"><span class="grow">${nameBtn(it.n)}</span>
      <span class="row" style="gap:3px"><button type="button" class="b sm" data-act="qty5" data-s="${si}" data-i="${ii}" data-d="-1" aria-label="Fewer">−</button><span class="mono" style="width:26px;text-align:center">${it.q}</span><button type="button" class="b sm" data-act="qty5" data-s="${si}" data-i="${ii}" data-d="1" aria-label="More">+</button></span>
      <span class="mono dimc" style="width:44px;text-align:right">${it.w} lb</span>
      ${it.use ? `<button type="button" class="b sm ghost" data-act="consume" data-s="${si}" data-i="${ii}">Use</button>` : `<button type="button" class="b sm ${it.eq ? 'on' : ''}" data-act="equip" data-s="${si}" data-i="${ii}" aria-pressed="${it.eq}">${it.eq ? 'Equipped' : 'Equip'}</button>`}</div>`).join('')).join('');
    return `<div class="grid3" style="grid-template-columns:repeat(4,minmax(0,1fr))">${cur}</div>
      <div class="row sp">${lbl('Encumbrance')}<span class="mono" style="font-size:13px">${Math.round(w)} / ${c.weight[1]} lb</span></div>${bar(w, c.weight[1])}
      <div class="sec">Attacks</div>${atk}${sec}`;
  },
  features(c) {
    return c.features.map(([t, rows]) => `<div class="sec">${esc(t)}</div>` + rows.map(([n, uses, roll], fi) => { const e = dbEntry(n); return `<div class="li"><span class="cost">${COST_GLYPH[e.cost] || ''}</span><span class="grow">${nameBtn(n)}</span>
      ${uses ? `<span class="pips">${Array.from({ length: uses[1] }, (_, i) => `<button type="button" class="pip ${i < uses[0] ? 'on' : ''}" data-act="feat" data-k="${esc(n)}" data-i="${i}" aria-label="${esc(n)} use ${i + 1}"></button>`).join('')}</span>` : ''}
      ${roll ? `<button type="button" class="b sm ghost" data-act="roll" data-f="${roll}" data-l="${esc(n)}">${roll}</button>` : ''}</div>`; }).join('')).join('');
  },
  spells(c) {
    const slots = Object.entries(c.slots).map(([lv, [v, m]]) => `<div class="kv" style="flex-direction:row;align-items:center;gap:10px">${lbl(`Level ${lv} slots`)}<span class="pips">${Array.from({ length: m }, (_, i) => `<button type="button" class="pip ${i < v ? 'on' : ''}" data-act="slot" data-k="${lv}" data-i="${i}" aria-label="Slot ${i + 1}"></button>`).join('')}</span></div>`).join('');
    const head = `<div class="row" style="gap:10px;flex-wrap:wrap"><div class="kv">${lbl('Ability')}<b>Intelligence</b></div><div class="kv">${lbl('Spell attack')}<b class="mono">${sgn(c.spellAtk)}</b></div><div class="kv">${lbl('Save DC')}<b class="mono">${c.spellDC}</b></div>${slots}</div>`;
    const lists = c.spells.map(([lv, names]) => `<div class="sec">${lv ? `Level ${lv}` : 'Cantrips'}</div>` + names.map(n => { const e = dbEntry(n); return `<div class="li"><span class="cost">${COST_GLYPH[e.cost] || ''}</span><span class="grow">${nameBtn(n)}</span><button type="button" class="b sm ghost" data-act="cast" data-k="${esc(n)}" data-l="${lv}">Cast</button></div>`; }).join('')).join('');
    return head + lists;
  },
  effects: SF.effects,
  biography: SF.biography,
  bastion(c) {
    const b = c.bastion;
    return `<div class="row sp"><div class="kv">${lbl('Bastion')}<b style="font-size:17px">${esc(b.name)}</b></div><div class="kv">${lbl('Defenders')}<b class="mono">${b.defenders}</b></div></div>
      <div class="sec">Special Facilities</div>${b.special.map(([n, o]) => `<div class="li"><span class="grow brt" style="font-weight:700">${esc(n)}</span><span class="chip">Order: ${esc(o)}</span><button type="button" class="b sm ghost" data-act="toast" data-k="${esc(n)}: ${esc(o)} order issued. In Foundry this runs the system's bastion turn.">Issue order</button></div>`).join('')}
      <div class="sec">Basic Facilities</div><div style="display:flex;gap:6px;flex-wrap:wrap">${b.basic.map(n => `<span class="chip">${esc(n)}</span>`).join('')}</div>`;
  },
  specialTraits(c) {
    return `<div class="sec">Special Traits</div>` + Object.entries(c.flags).map(([k, v]) => `<div class="li flat"><span class="grow">${esc(k)}</span><button type="button" class="b sm ${v ? 'on' : ''}" data-act="flag" data-k="${esc(k)}" aria-pressed="${v}">${v ? 'On' : 'Off'}</button></div>`).join('');
  }
};
const TAB_SRC = { sf2e:'sf2e · tabs/', dnd5e:'dnd5e · parts/' };
