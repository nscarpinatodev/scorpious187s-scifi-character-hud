// ================= DATA =================
const ME_DB = /*ME_DB*/{};

const SF_SKILL_ATTR = { Acrobatics:'dex', Arcana:'int', Athletics:'str', Computers:'int', Crafting:'int', Deception:'cha', Diplomacy:'cha', Intimidation:'cha', Medicine:'wis', Nature:'wis', Occultism:'int', Performance:'cha', Piloting:'dex', Religion:'wis', Society:'int', Stealth:'dex', Survival:'wis', Thievery:'dex' };
const RANK_BONUS = { U:0, T:2, E:4, M:6, L:8 };
const RANK_NAME = { U:'Untrained', T:'Trained', E:'Expert', M:'Master', L:'Legendary' };
const SF_TABS = [['character','Character'],['actions','Actions'],['inventory','Inventory'],['spellcasting','Spells'],['crafting','Crafting'],['proficiencies','Skills'],['feats','Feats'],['effects','Effects'],['biography','Biography']];
const DND_TABS = [['details','Details'],['inventory','Inventory'],['features','Features'],['spells','Spells'],['effects','Effects'],['biography','Biography'],['bastion','Bastion'],['specialTraits','Traits']];

const SF_CONDITIONS = ['Clumsy','Concealed','Dazzled','Drained','Enfeebled','Fatigued','Frightened','Grabbed','Hidden','Off-Guard','Prone','Quickened','Sickened','Slowed','Stunned','Stupefied'];
const SF_VALUED = ['Clumsy','Drained','Enfeebled','Frightened','Sickened','Slowed','Stunned','Stupefied'];
const DND_CONDITIONS = ['Blinded','Charmed','Deafened','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Poisoned','Prone','Restrained','Stunned'];
const COND_TEXT = {
  'Off-Guard':'−2 circumstance penalty to AC.', Frightened:'Status penalty equal to the value on all checks and DCs; drops by 1 at the end of each of your turns.',
  Quickened:'You gain 1 extra action at the start of each turn, usable only as the effect specifies.', Prone:'Off-guard, −2 to attack rolls; the only move actions are Crawl and Stand.',
  Hidden:'Creatures know your space but not exactly where you are; they must succeed at a DC 11 flat check to target you.', Concealed:'Creatures targeting you must succeed at a DC 5 flat check.',
  Sickened:'Status penalty equal to the value on all checks and DCs; you can’t willingly ingest anything.', Slowed:'You lose actions equal to the value at the start of each turn.',
  Stunned:'You can’t act; lose actions equal to the value.', Clumsy:'Status penalty to Dex-based checks and DCs, including AC and Reflex.', Enfeebled:'Status penalty to Str-based rolls and DCs.',
  Drained:'Status penalty to Con-based checks; lose HP equal to level × value.', Fatigued:'−1 status penalty to AC and saves; can’t choose exploration activities.', Grabbed:'Off-guard and immobilized.',
  Dazzled:'Everything is concealed to you.', Stupefied:'Status penalty to Int, Wis and Cha checks and DCs; flat check to cast spells.',
  Poisoned:'Disadvantage on attack rolls and ability checks.', Invisible:'Attacks against you have disadvantage; your attacks have advantage.', Restrained:'Speed 0; attacks against you have advantage; disadvantage on Dex saves.',
  Grappled:'Speed 0; disadvantage on attacks against anyone but the grappler.', Charmed:'Can’t attack the charmer; the charmer has advantage on social checks with you.',
  Blinded:'Automatically fail sight checks; attacks against you have advantage.', Deafened:'Automatically fail hearing checks.', Incapacitated:'No actions, bonus actions or reactions.', Paralyzed:'Incapacitated; attacks within 5 ft are critical hits.'
};

// Paragon/Renegade tiers — mirrors the tracker macro (flags.world.paragon / .renegade, 0–100)
const PR_TIERS = {
  paragon: [
    { v:20, name:'Trusted Presence', kind:'passive', text:'+1 circumstance to Diplomacy checks.' },
    { v:40, name:'Inspiring Voice', kind:'free', text:'Free action, 1/day: fortune on one Diplomacy or Medicine check (keep higher).' },
    { v:60, name:'Beacon of Hope', kind:'one', text:'Action, 1/day: for 1 minute, +2 circumstance to Diplomacy to Make an Impression or Request.' },
    { v:80, name:'Noble Sacrifice', kind:'reaction', text:'Reaction, 1/day. Trigger: an ally within 30 ft would drop to 0 HP. The ally goes to 1 HP; you take damage equal to your level.' },
    { v:100, name:'Living Legend', kind:'passive', text:'+1 status to Diplomacy and Medicine.' }
  ],
  renegade: [
    { v:20, name:'Fearsome Reputation', kind:'passive', text:'+1 circumstance to Intimidation checks.' },
    { v:40, name:'Ruthless Efficiency', kind:'free', text:'Free action, 1/day: fortune on one Intimidation or Deception check (keep higher).' },
    { v:60, name:'Command Through Fear', kind:'one', text:'Action, 1/day: for 1 minute, +2 circumstance to Intimidation when you Coerce.' },
    { v:80, name:'Uncompromising', kind:'one', text:'Action, 1/day: before a Strike this turn, +2 circumstance to attack and treat cover one step lower.' },
    { v:100, name:'Infamous', kind:'passive', text:'+1 status to Intimidation and Deception.' }
  ]
};

const GENERIC_DB = {
  'Take Cover': { kind:'Basic Action', cost:'1', traits:['basic'], desc:'Press yourself against cover or drop prone behind it. You gain greater cover (+4 circumstance to AC, Reflex and Stealth) until you move or attack. For a Kinetic Shield, taking cover is also what lets a depleted barrier begin recharging.' },
  'Seek': { kind:'Basic Action', cost:'1', traits:['concentrate','secret'], desc:'Scan an area for signs of creatures or objects, rolling Perception against their Stealth DCs.' },
  'Aid': { kind:'Basic Action', cost:'R', traits:['basic'], desc:'Trigger: an ally is about to use an action that requires a skill check or attack roll. Roll to help; on a success they gain a circumstance bonus.' },
  'Reload': { kind:'Basic Action', cost:'1', traits:['manipulate'], desc:'Swap in a fresh thermal clip or battery.' },
  'Search': { kind:'Exploration', cost:null, traits:['concentrate','exploration'], desc:'You Seek meticulously for hidden doors, hazards and objects as you move at half speed.' },
  'Scout': { kind:'Exploration', cost:null, traits:['concentrate','exploration'], desc:'You scout ahead; the party gets +1 circumstance to its next initiative roll.' },
  'Avoid Notice': { kind:'Exploration', cost:null, traits:['exploration'], desc:'Move stealthily at half speed; you roll Stealth for initiative.' },
  'Refocus': { kind:'Exploration', cost:null, traits:['concentrate','exploration'], desc:'Spend 10 minutes to recover focus.' },
  'Earn Income': { kind:'Downtime', cost:null, traits:['downtime'], desc:'Use a trained skill to earn credits over a period of days.' },
  'Treat Wounds': { kind:'Downtime', cost:null, traits:['exploration','healing','manipulate'], desc:'Spend 10 minutes treating a willing living creature, rolling Medicine against DC 15 to restore Hit Points.' },
  'Repair': { kind:'Downtime', cost:null, traits:['exploration','manipulate'], desc:'Spend 10 minutes restoring Hit Points to a damaged item, rolling Crafting.' },
  'Retrain': { kind:'Downtime', cost:null, traits:['downtime'], desc:'Spend a week of downtime to swap a feat, skill increase or class choice.' },
  'Stellar Cannon': { kind:'Weapon', traits:['area','unwieldy'], meta:[['Damage','1d10 fire'],['Range','60 ft'],['Bulk','2']], desc:'Placeholder sample weapon for the prototype.' },
  'Semi-Auto Pistol': { kind:'Weapon', traits:['tech'], meta:[['Damage','1d6 piercing'],['Range','30 ft'],['Bulk','L']], desc:'Placeholder sample weapon for the prototype.' },
  'Combat Knife': { kind:'Weapon', traits:['agile','finesse'], meta:[['Damage','1d4 slashing'],['Bulk','L']], desc:'Placeholder sample weapon for the prototype.' },
  'Suppressing Fire': { kind:'Class Action', cost:'2', traits:['soldier','manipulate'], desc:'Placeholder sample class action: lay down a hail of fire in an area, making targets off-guard and slowing their movement.' },
  'Tactical Heavy Armor': { kind:'Armor', traits:['bulwark'], meta:[['AC bonus','+5'],['Bulk','2']], desc:'Placeholder sample armor.' },
  'Laser Pistol': { kind:'Weapon (firearm)', traits:['ammunition','reload 50'], meta:[['Damage','3d6 radiant'],['Range','40/120 ft'],['Weight','2 lb']], desc:'A sleek handheld emitter. Uses energy cells.' },
  'Mono-Rapier': { kind:'Weapon (martial)', traits:['finesse','vex mastery'], meta:[['Damage','1d8 piercing'],['Weight','2 lb']], desc:'A rapier with a monomolecular edge (reskinned rapier).' },
  'Sneak Attack': { kind:'Class Feature', meta:[['Damage','3d6']], desc:'Once per turn, deal extra damage to one creature you hit with a finesse or ranged attack if you have advantage, or an ally is within 5 feet of it.' },
  'Cunning Action': { kind:'Class Feature', cost:'B', desc:'Bonus action: Dash, Disengage or Hide.' },
  'Uncanny Dodge': { kind:'Class Feature', cost:'R', desc:'Reaction: when an attacker you can see hits you, halve the damage.' },
  'Steady Aim': { kind:'Class Feature', cost:'B', desc:'Bonus action: gain advantage on your next attack this turn if you have not moved; your speed becomes 0.' },
  'Cunning Strike': { kind:'Class Feature', desc:'When you deal Sneak Attack damage, you can forgo dice to add effects such as Poison, Trip or Withdraw.' },
  'Lucky': { kind:'Origin Feat', desc:'You have Luck Points equal to your Proficiency Bonus; spend one to gain advantage on a d20 test or impose disadvantage on an attack against you.' },
  'Alert': { kind:'Origin Feat', desc:'Add your Proficiency Bonus to initiative; you can swap initiative with a willing ally.' },
  'Mage Hand Legerdemain': { kind:'Class Feature', desc:'Your Mage Hand is invisible and can pick locks, stow or retrieve items, and disarm traps at range.' },
  'Shocking Grasp': { kind:'Cantrip', cost:'A', meta:[['Attack','+5'],['Damage','2d8 lightning']], desc:'Lightning springs from your hand; on a hit the target can’t take reactions until its next turn.' },
  'Minor Illusion': { kind:'Cantrip', cost:'A', desc:'Create a sound or an image of an object within 30 feet for 1 minute.' },
  'Mage Hand': { kind:'Cantrip', cost:'A', desc:'A spectral hand appears within 30 feet and manipulates objects.' },
  'Disguise Self': { kind:'1st-level Illusion', cost:'A', desc:'Change your appearance for 1 hour.' },
  'Silent Image': { kind:'1st-level Illusion', cost:'A', meta:[['Duration','Concentration, 10 min']], desc:'Create a visual illusion no larger than a 15-foot cube.' },
  'Shield': { kind:'1st-level Abjuration', cost:'R', desc:'Reaction when hit: +5 AC until the start of your next turn.' },
  'Potion of Healing': { kind:'Consumable', cost:'B', meta:[['Heals','2d4+2']], desc:'A glowing vial that restores Hit Points.' }
};

function freshChars() {
  return {
  asha: {
    id:'asha', system:'sf2e', me:true, name:'Asha Rourke', level:6, xp:[640,1000], sub:'Human · Alliance Biotic · Vanguard · Biotic Prodigy',
    hp:{ v:71, max:84, temp:0 }, hero:2, dying:0, wounded:0, doomed:0,
    ac:25, classDC:22, speed:25, saves:{ fort:[13,'E'], ref:[10,'T'], will:[11,'E'] }, perception:[11,'E'], senses:'—',
    attrs:{ str:4, dex:2, con:2, int:0, wis:1, cha:3 },
    ident:[['Ancestry','Human'],['Heritage','Alliance Biotic'],['Background','Biotic Prodigy'],['Class','Vanguard'],['Key Attribute','Strength'],['Languages','Common, Asari']],
    details:[['Age','31'],['Height','1.75 m'],['Homeworld','Mindoir'],['Deity','—']],
    attackProf:[['Simple Weapons','Trained'],['Martial Weapons','Trained'],['Unarmed Attacks','Trained']], defenseProf:[['Light Armor','Trained'],['Medium Armor','Trained'],['Unarmored','Trained']],
    skills:{ Acrobatics:'T', Arcana:'U', Athletics:'E', Computers:'U', Crafting:'U', Deception:'U', Diplomacy:'T', Intimidation:'E', Medicine:'U', Nature:'U', Occultism:'U', Performance:'U', Piloting:'T', Religion:'U', Society:'T', Stealth:'U', Survival:'T', Thievery:'U' },
    lores:[['Alliance Military Lore','T']],
    strikes:[
      { name:'M-23 Eviscerator', meta:'Shotgun · Scatter 5 · 15 ft', bonus:11, map:5, dmg:'3d8+6', type:'piercing' },
      { name:'M-11 Suppressor', meta:'Pistol · Tech · 50 ft', bonus:11, map:5, dmg:'2d6+2', type:'piercing' },
      { name:'Fist', meta:'Agile · Nonlethal', bonus:13, map:4, dmg:'1d4+6', type:'bludgeoning' }
    ],
    actions:{ encounter:[['Biotic Charge'],['Nova'],['Shockwave'],['Pull'],['Adrenaline Rush'],['Fortification'],['Take Cover'],['Reload']], reactions:[['Aid']], exploration:[['Search'],['Scout'],['Avoid Notice']], downtime:[['Earn Income'],['Treat Wounds'],['Retrain']] },
    credits:4820, bulkLimit:[9,14],
    inv:[
      { sec:'Weapons', items:[{ n:'M-23 Eviscerator', q:1, b:2, c:'Held 2' },{ n:'M-11 Suppressor', q:1, b:1, c:'Worn' }] },
      { sec:'Armor', items:[{ n:'Colossus Armor (M)', q:1, b:2, c:'Worn' },{ n:'Kinetic Shield', q:1, b:1, c:'Worn' }] },
      { sec:'Consumables', items:[{ n:'Medi-Gel', q:3, b:0.1, c:'Worn' },{ n:'Omni-Gel', q:6, b:0, c:'Worn' }] }
    ],
    formulas:[['Omni-Gel',0,14],['Medi-Gel',1,15]],
    feats:[
      ['Ancestry Features', [[null,'Adaptive Resilience'],[null,'Ambitious Striving']]],
      ['Ancestry Feats', [[1,'Tenacious Survivor'],[5,'Battle-Hardened']]],
      ['Class Feats', [[1,'Biotic Charge'],[1,'Nova'],[2,'Adrenaline Rush'],[2,'Fortification'],[4,'Shockwave'],[6,'Pull']]],
      ['Class Features', [[1,'Vanguard'],[1,'Vanguard Mastery'],[1,'Combat Training'],[1,'Fitness'],[1,'Weapon Mastery (Shotguns)'],[2,'Biotic Mastery'],[4,'Improved Fitness'],[4,'Improved Combat Training'],[4,'Improved Weapon Mastery (Shotguns)'],[6,'Improved Biotic Mastery']]],
      ['Background', [[null,'Biotic Prodigy']]]
    ],
    effects:[{ n:'Biotic Barrier', d:'1 min' }], conds:[{ n:'Quickened', v:null }],
    bio:{ Appearance:'Close-cropped dark hair, N7-grey armour scuffed at the knees, a faint blue shimmer when she is angry.', Backstory:'Survived the batarian raid on Mindoir at eleven; her biotics manifested the same night. Recruited by the Alliance at seventeen.', Allies:'Lt. Cmdr. Okafor (Alliance Intelligence)', Enemies:'Batarian Hegemony slaver cells' },
    shields:{ v:30, max:30, regen:10 }, pr:{ paragon:62, renegade:18 }, prUses:{ paragon:{40:1,60:1,80:1}, renegade:{40:1,60:1,80:1} }
  },
  dana: {
    id:'dana', system:'sf2e', me:false, name:'Dana Holt', level:4, xp:[210,1000], sub:'Human · Versatile · Soldier · Mercenary',
    hp:{ v:47, max:58, temp:5 }, hero:1, dying:0, wounded:0, doomed:0,
    ac:23, classDC:20, speed:25, saves:{ fort:[11,'E'], ref:[7,'T'], will:[9,'E'] }, perception:[9,'E'], senses:'Low-light vision',
    attrs:{ str:4, dex:1, con:3, int:0, wis:1, cha:0 },
    ident:[['Ancestry','Human'],['Heritage','Versatile Human'],['Background','Mercenary'],['Class','Soldier'],['Key Attribute','Constitution'],['Languages','Common']],
    details:[['Age','34'],['Height','1.80 m'],['Homeworld','[HOMEWORLD]'],['Deity','—']],
    attackProf:[['Simple Weapons','Expert'],['Martial Weapons','Expert'],['Unarmed Attacks','Trained']], defenseProf:[['Heavy Armor','Trained'],['Medium Armor','Trained'],['Unarmored','Trained']],
    skills:{ Acrobatics:'U', Arcana:'U', Athletics:'E', Computers:'T', Crafting:'U', Deception:'U', Diplomacy:'U', Intimidation:'T', Medicine:'T', Nature:'U', Occultism:'U', Performance:'U', Piloting:'T', Religion:'U', Society:'U', Stealth:'U', Survival:'T', Thievery:'U' },
    lores:[['Mercenary Lore','T']],
    strikes:[
      { name:'Stellar Cannon', meta:'Area · Unwieldy · 60 ft', bonus:10, map:5, dmg:'1d10+2', type:'fire' },
      { name:'Semi-Auto Pistol', meta:'Tech · 30 ft', bonus:8, map:5, dmg:'1d6+1', type:'piercing' },
      { name:'Combat Knife', meta:'Agile · Finesse', bonus:10, map:4, dmg:'1d4+4', type:'slashing' }
    ],
    actions:{ encounter:[['Suppressing Fire'],['Take Cover'],['Reload'],['Seek']], reactions:[['Aid']], exploration:[['Search'],['Scout']], downtime:[['Earn Income'],['Repair']] },
    credits:12450, bulkLimit:[9,14],
    inv:[
      { sec:'Weapons', items:[{ n:'Stellar Cannon', q:1, b:2, c:'Held 2' },{ n:'Semi-Auto Pistol', q:1, b:0.1, c:'Worn' },{ n:'Combat Knife', q:1, b:0.1, c:'Worn' }] },
      { sec:'Armor', items:[{ n:'Tactical Heavy Armor', q:1, b:2, c:'Worn' }] },
      { sec:'Consumables', items:[{ n:'Medpatch', q:2, b:0.1, c:'Worn' },{ n:'Frag Grenade', q:3, b:0.1, c:'Worn' },{ n:'Standard Battery', q:4, b:0.1, c:'Stowed' }] },
      { sec:'Equipment', items:[{ n:'Comm Unit', q:1, b:0.1, c:'Worn' },{ n:'Engineering Toolkit', q:1, b:1, c:'Stowed' }] }
    ],
    formulas:[['Medpatch',1,15],['Frag Grenade',1,15]],
    feats:[
      ['Ancestry Feats', [[1,'Natural Ambition']]],
      ['Class Feats', [[1,'Suppressing Fire'],[2,'[CLASS FEAT]'],[4,'[CLASS FEAT]']]],
      ['Skill Feats', [[2,'Assurance (Athletics)'],[4,'Battle Medicine']]],
      ['General Feats', [[3,'Toughness']]]
    ],
    effects:[{ n:'Suppressed', d:'1 rd' }], conds:[],
    bio:{ Appearance:'[APPEARANCE]', Backstory:'[BACKSTORY]', Allies:'', Enemies:'' },
    shields:null, pr:null
  },
  vex: {
    id:'vex', system:'dnd5e', me:false, name:'Vex Kaori', level:5, xp:[7600,14000], sub:'Human · Criminal · Rogue 5 (Arcane Trickster)',
    hp:{ v:31, max:38, temp:0 }, hd:{ v:4, max:5, die:'d8' }, death:{ s:0, f:0 }, insp:true, exh:0,
    ac:16, init:7, speed:30, prof:3, passive:14, spellDC:13, spellAtk:5,
    abil:[['str',8,false],['dex',18,true],['con',14,false],['int',14,true],['wis',12,false],['cha',12,false]],
    skills:[['Acrobatics','dex',1],['Animal Handling','wis',0],['Arcana','int',0],['Athletics','str',0],['Deception','cha',1],['History','int',0],['Insight','wis',0],['Intimidation','cha',0],['Investigation','int',1],['Medicine','wis',0],['Nature','int',0],['Perception','wis',1],['Performance','cha',0],['Persuasion','cha',0],['Religion','int',0],['Sleight of Hand','dex',2],['Stealth','dex',2],['Survival','wis',0]],
    traits:[['Senses','Passive Perception 14'],['Languages','Common, Thieves’ Cant, Elvish'],['Tools','Thieves’ Tools, Hacking Rig'],['Armor','Light'],['Weapons','Simple, Martial (finesse or light)']],
    attacks:[{ name:'Laser Pistol', bonus:7, dmg:'3d6+4', type:'radiant' },{ name:'Mono-Rapier', bonus:7, dmg:'1d8+4', type:'piercing' }],
    currency:{ pp:0, gp:412, sp:30, cp:0 }, weight:[34,120],
    inv5:[
      { sec:'Weapons', items:[{ n:'Laser Pistol', q:1, w:2, eq:true },{ n:'Mono-Rapier', q:1, w:2, eq:true }] },
      { sec:'Equipment', items:[{ n:'Studded Leather', q:1, w:13, eq:true },{ n:'Thieves’ Tools', q:1, w:1, eq:false },{ n:'Burglar’s Pack', q:1, w:13, eq:false }] },
      { sec:'Consumables', items:[{ n:'Potion of Healing', q:2, w:0.5, eq:false, use:'2d4+2' },{ n:'Energy Cell', q:38, w:0, eq:false }] }
    ],
    features:[
      ['Rogue', [['Sneak Attack',null,'3d6'],['Cunning Action'],['Steady Aim'],['Cunning Strike'],['Uncanny Dodge'],['Mage Hand Legerdemain']]],
      ['Species & Feats', [['Alert'],['Lucky',[3,3]]]]
    ],
    slots:{ 1:[3,3] }, spells:[[0,['Mage Hand','Minor Illusion','Shocking Grasp']],[1,['Disguise Self','Silent Image','Shield']]],
    effects:[{ n:'Steady Aim', d:'this turn' }], conds:[],
    bio:{ Appearance:'Chrome-streaked undercut, mirrored visor pushed up on her forehead.', Backstory:'Ran data for the Magenta Syndicate until a job went sideways.', Ideals:'Nobody owns the signal.', Flaws:'Can’t resist a locked door.' },
    bastion:{ name:'The Neon Loft', special:[['Storehouse','Trade'],['Workshop','Craft']], basic:['Bedroom','Kitchen'], defenders:0 },
    flags:{ 'Reliable Talent':false, 'Jack of All Trades':false, 'Remarkable Athlete':false, 'Observant':false, 'Elven Accuracy':false, 'Powerful Build':false, 'Alert (initiative)':true },
    shields:null, pr:null
  }
  };
}
