// Turns the raw 5etools files into the slim lists the app stores.
import { clean, render, esc } from './fmt.js';
export const BASE="https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/";
export const SCH={A:"Abjuration",C:"Conjuration",D:"Divination",E:"Enchantment",V:"Evocation",I:"Illusion",N:"Necromancy",T:"Transmutation"};
export const SZ={T:"Tiny",S:"Small",M:"Medium",L:"Large",H:"Huge",G:"Gargantuan",V:"Varies"};
export const SRC=["PHB","DMG","EEPC","SCAG","VGM","MTF","GGR","ERLW","AI","TCE","MOT","EGW","SCC","VRGR","WBtW","AAG","FTD","MPMM","DSotDQ","XPHB","EFA","LFL"];
export const CAT={G:"General",O:"Origin",FS:"Fighting Style","FS:P":"Fighting Style (Paladin)","FS:R":"Fighting Style (Ranger)",EB:"Epic Boon",D:"Dragonmark",DG:"Dark Gift"};
export function slim(s,lookup){
 const cl=new Set(),lk=lookup&&lookup[s.source.toLowerCase()]?.[s.name.toLowerCase()];
 for(const f of["class","classVariant"])if(lk?.[f])Object.values(lk[f]).forEach(o=>Object.keys(o).forEach(c=>cl.add(c)));
 (s.classes?.fromClassList||[]).forEach(c=>cl.add(c.name));
 const t=s.time?.[0],r=s.range,d=s.duration?.[0],c=s.components||{};
 const range=!r?"":r.type==="point"?(r.distance?.type==="self"?"Self":r.distance?.type==="touch"?"Touch":r.distance?((r.distance.amount||"")+" "+r.distance.type).trim():"Special"):"Self ("+(r.distance?.amount||"")+" "+(r.distance?.type||"")+" "+r.type+")";
 const dur=!d?"":d.type==="instant"?"Instantaneous":d.type==="timed"?(d.concentration?"Concentration, up to ":"")+d.duration.amount+" "+d.duration.type+(d.duration.amount>1?"s":""):d.type==="permanent"?"Until dispelled":"Special";
 const comp=[c.v&&"V",c.s&&"S",c.m&&"M ("+clean(typeof c.m==="string"?c.m:c.m.text||"")+")"].filter(Boolean).join(", ");
 return{name:s.name,source:s.source,level:s.level,school:SCH[s.school]||s.school||"",time:t?t.number+" "+t.unit:"",range,comp,dur,ritual:!!s.meta?.ritual,classes:[...cl].sort(),text:render(s.entries)+(s.entriesHigherLevel?render(s.entriesHigherLevel):"")}}
export function prereq(p){if(!p)return"";return p.map(o=>{const a=[];
 if(o.level)a.push("Level "+(o.level.level||o.level)+(o.level.class?" "+o.level.class.name:"")+"+");
 if(o.ability)a.push(o.ability.map(x=>Object.entries(x).map(([k,v])=>k.toUpperCase()+" "+v).join(" or ")).join(", "));
 if(o.race)a.push(o.race.map(r=>r.name).join(" or "));
 if(o.spellcasting||o.spellcasting2020)a.push("Spellcasting");
 if(o.feat)a.push(o.feat.map(x=>x.split("|")[0]).join(" or "));
 if(o.other)a.push(o.other);
 return a.join(", ")}).filter(Boolean).join("; ")}
export const ABN={str:"Strength",dex:"Dexterity",con:"Constitution",int:"Intelligence",wis:"Wisdom",cha:"Charisma"};
export const orList=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" or "+a[a.length-1];
export function fmtAsi(ab){if(!Array.isArray(ab))return"";const out=[];
 for(const o of ab){if(!o||o.hidden)continue;
  const fixed=Object.keys(ABN).filter(k=>o[k]).map(k=>ABN[k]+" "+(o[k]>0?"+":"")+o[k]);
  if(fixed.length)out.push(fixed.join(", "));
  if(o.choose&&o.choose.from){const c=o.choose,n=c.amount||1,k=c.count||1,sg=(n>0?"+":"")+n,all=Object.keys(ABN).every(x=>c.from.includes(x)),names=c.from.map(x=>ABN[x]||x);
   out.push(all?(k>1?sg+" to "+k+" ability scores of your choice":sg+" to one ability score of your choice"):(k>1?sg+" to "+k+" of: "+orList(names):sg+" to "+orList(names)))}}
 return out.join("; ")}
export function procFeats(d){return(d.feat||[]).filter(f=>!f.reprintedAs&&f.entries).map(f=>({key:f.name+"|"+f.source,name:f.name,source:f.source,cat:CAT[f.category]||"Feat",pre:prereq(f.prerequisite),asi:fmtAsi(f.ability),ab:(f.ability||[]).filter(Boolean),rep:!!f.repeatable,text:render(f.entries)}))}
export const fmtSize=s=>(Array.isArray(s)?s:[s]).filter(Boolean).map(x=>SZ[x]||x).join(" or ");
export const fmtSpeed=s=>{if(s==null)return"";if(typeof s==="number")return s+" ft.";const w=s.walk&&(typeof s.walk==="number"?s.walk:s.walk.number);return Object.entries(s).map(([k,v])=>{const n=v===true?w:typeof v==="number"?v:v&&v.number;return n?k+" "+n+" ft.":""}).filter(Boolean).join(", ")};
export function modEntries(ents,mods){if(!mods)return ents;ents=ents.slice();for(const m of[].concat(mods)){const it=m.items==null?[]:[].concat(m.items);
 if(m.mode==="appendArr")ents.push(...it);else if(m.mode==="prependArr")ents.unshift(...it);
 else if(m.mode==="insertArr")ents.splice(m.index??ents.length,0,...it);
 else if(m.mode==="replaceArr"){const i=ents.findIndex(e=>(e&&e.name)===m.replace||e===m.replace);if(i>=0)ents.splice(i,1,...it);else ents.push(...it)}
 else if(m.mode==="removeArr"){const n=[].concat(m.names||m.items||[]);ents=ents.filter(e=>!n.includes(e&&e.name||e))}}
 return ents}
export function res(r,find,d=0){if(!r._copy||d>5)return r;const b=find(r._copy);if(!b)return r;const base=res(b,find,d+1);
 const o={...base,...r};delete o._copy;o.reprintedAs=r.reprintedAs;o.entries=r.entries||modEntries(base.entries||[],r._copy._mod&&r._copy._mod.entries);return o}
const cellStr=c=>c==null?"":typeof c==="object"?(c.roll?String(c.roll.exact!=null?c.roll.exact:c.roll.min+"-"+c.roll.max):c.entry?String(c.entry):""):String(c);
// a trait that says "choose one" with a list of named options or a table becomes {choice:{opts:[{name,text}]}}
function traitOf(e){const ents=e.entries||e.entry||[],arr=Array.isArray(ents)?ents:[ents];
 const li=arr.find(x=>x&&x.type==="list"&&(x.items||[]).length>1&&x.items.every(i=>i&&i.name&&(i.entries||i.entry)));
 const tb=arr.find(x=>x&&x.type==="table"&&x.colLabels&&(x.rows||[]).length>1);
 const intro=arr.filter(x=>typeof x==="string").join(" ");
 if((li||tb)&&/choose|select|pick/i.test(intro)){const pre=arr.filter(x=>x!==li&&x!==tb);
  if(li)return{name:e.name,text:render(pre),choice:{opts:li.items.map(i=>({name:clean(i.name),text:render(i.entries||i.entry)}))}};
  const cl=tb.colLabels.map(c=>clean(String(c)));
  return{name:e.name,text:render(pre),choice:{opts:tb.rows.map(r=>({name:clean(cellStr(r[0])),text:"<p>"+r.map((c,i)=>i?"<b>"+esc(cl[i])+":</b> "+esc(clean(cellStr(c))):"").filter(Boolean).join("</p><p>")+"</p>"}))}}}
 return{name:e.name,text:render(e.entries||e.entry||"")}}
export function procSpecies(d){const all=d.race||[],subs=d.subrace||[],out=[];
 const fr=c=>all.find(x=>x.name===c.name&&x.source===c.source),fs=c=>subs.find(x=>x.name===c.name&&x.source===c.source&&(!c.raceName||x.raceName===c.raceName));
 const mk=(name,source,size,speed,ents,ab)=>{const notes=[],traits=[];
  (ents||[]).forEach(e=>{if(e&&typeof e==="object"&&e.name)traits.push(traitOf(e));else notes.push(render(e))});
  if(traits.length||notes.length)out.push({key:name+"|"+source,name,source,size:fmtSize(size),speed:fmtSpeed(speed),notes:notes.join(""),traits,ab:(ab||[]).filter(o=>o&&!o.hidden)})};
 all.forEach(r0=>{const r=res(r0,fr);if(r.reprintedAs||!r.entries)return;mk(r.name,r.source,r.size,r.speed,r.entries,r.ability)});
 subs.forEach(s0=>{const s=res(s0,fs);if(s.reprintedAs||!s.name)return;const b0=all.find(x=>x.name===s.raceName&&x.source===s.raceSource);if(!b0)return;const b=res(b0,fr);
  const ow=new Set((s.entries||[]).map(e=>e&&e.data&&e.data.overwrite).filter(Boolean));
  mk(b.name+" ("+s.name+")",s.source,s.size||b.size,s.speed||b.speed,(b.entries||[]).filter(e=>!(e&&e.name&&ow.has(e.name))).concat(s.entries||[]),(b.ability||[]).concat(s.ability||[]))});
 const rk=x=>{const i=SRC.indexOf(x);return i<0?4:i},best={};
 out.forEach(p=>{const b=best[p.name];if(!b||rk(p.source)>rk(b.source))best[p.name]=p});
 return Object.values(best).sort((a,b)=>a.name.localeCompare(b.name))}
export function expand(e,look,d){d=d||0;if(Array.isArray(e))return e.map(x=>expand(x,look,d));if(!e||typeof e!=="object"||d>4)return e;
 if(e.type==="refSubclassFeature"||e.type==="refClassFeature"){const sc=e.type==="refSubclassFeature",p=(sc?e.subclassFeature:e.classFeature).split("|");
  const x=sc?look.sf[[p[0],p[1],p[2]||"PHB",p[3],p[4]||"PHB",p[5]].join("|").toLowerCase()]:look.cf[[p[0],p[1],p[2]||"PHB",p[3]].join("|").toLowerCase()];
  return x?{type:"entries",name:x.name,entries:expand(x.entries,look,d+1)}:null}
 const o={...e};if(o.entries)o.entries=expand(o.entries,look,d+1);if(o.entry)o.entry=expand(o.entry,look,d+1);if(o.items)o.items=expand(o.items,look,d+1);return o}
const tcell=v=>{if(v==null)return"—";if(typeof v!=="object")return clean(String(v));
 if(v.type==="dice")return(v.toRoll||[]).map(d=>d.number+"d"+d.faces).join("+");if(v.type==="bonus")return"+"+v.value;
 if(v.type==="bonusSpeed")return v.value?"+"+v.value+" ft.":"—";return"—"};
// the class table: one column per label (Rages, Second Wind, Focus Points…) with 20 values, plus numeric spell slot rows
function tblOf(c){const cols=[];let sp=null;
 for(const g of c.classTableGroups||[]){const rows=g.rows||g.rowsSpellProgression;if(!rows)continue;if(g.rowsSpellProgression)sp=g.rowsSpellProgression;
  (g.colLabels||[]).forEach((l,i)=>cols.push({l:clean(String(l)),v:rows.map(r=>tcell(r[i]))}))}
 return{cols,sp}}
// optional features: metamagic, eldritch invocations, maneuvers, fighting styles, infusions, pact boons...
export function procOpts(d){const rank={XPHB:0,TCE:1,PHB:2},by=new Map();
 const pre=p=>(p||[]).map(o=>{const a=[];if(o.level)a.push("Level "+(o.level.level||o.level));if(o.pact)a.push("Pact of the "+o.pact);
  if(o.spell)a.push(o.spell.map(x=>clean(typeof x==="string"?x.split("#")[0]:x.entrySummary||x.entry||"")).join(", "));
  if(o.feature)a.push(o.feature.map(x=>clean(String(x))).join(", "));if(o.patron)a.push(o.patron+" patron");
  if(o.otherSummary)a.push(clean(o.otherSummary.entrySummary||o.otherSummary.entry||""));else if(o.other)a.push(clean(String(o.other)));return a.filter(Boolean).join(", ")}).filter(Boolean).join("; ");
 for(const f of d.optionalfeature||[]){if(f.reprintedAs||!f.entries||!f.featureType||/^UA|^AU$/.test(f.source))continue;
  const types=f.featureType,id=f.name+"|"+types.join(","),o=by.get(id);if(o&&(rank[o.source]??9)<=(rank[f.source]??9))continue;
  const lv=((f.prerequisite||[]).find(p=>p.level)||{}).level;const text=render(f.entries);
  by.set(id,{key:f.name+"|"+f.source,name:f.name,source:f.source,types,pre:pre(f.prerequisite),lvl:lv?(lv.level||lv):0,rep:/Repeatable/i.test(JSON.stringify(f.entries)),text})}
 return[...by.values()].sort((a,b)=>a.name.localeCompare(b.name))}
const optProg=(...src)=>{const p=src.find(x=>x&&x.length);return(p||[]).map(o=>{let c=[];if(Array.isArray(o.progression))c=Array.from({length:20},(_,i)=>o.progression[i]||0);else{let cur=0;for(let l=1;l<=20;l++){if(o.progression&&o.progression[l]!=null)cur=o.progression[l];c.push(cur)}}return{name:o.name,types:o.featureType||[],counts:c}})};
export function procClasses(files){const out=[];
 for(const f of files){const cfm={},sfm={},look={cf:cfm,sf:sfm};
  (f.classFeature||[]).forEach(x=>{cfm[[x.name,x.className,x.classSource,x.level].join("|").toLowerCase()]=x});
  (f.subclassFeature||[]).forEach(x=>{sfm[[x.name,x.className,x.classSource,x.subclassShortName,x.subclassSource,x.level].join("|").toLowerCase()]=x});
  for(const c of f.class||[]){if(c.reprintedAs||c.isSidekick||/^UA/.test(c.source))continue;
   const feats=[];(c.classFeatures||[]).forEach(r=>{const p=(typeof r==="string"?r:r.classFeature).split("|");
    const x=cfm[[p[0],p[1],p[2]||"PHB",p[3]].join("|").toLowerCase()];if(x)feats.push({name:x.name,level:x.level,text:render(expand(x.entries,look))})});
   const subs=(f.subclass||[]).filter(s=>s.className===c.name&&s.classSource===c.source&&!s.reprintedAs&&!/^UA/.test(s.source)).map(s=>{const sf=[];
    (s.subclassFeatures||(s._copy&&((f.subclass||[]).find(b=>b!==s&&b.name===s._copy.name&&b.source===s._copy.source&&b.className===s._copy.className&&(!s._copy.classSource||b.classSource===s._copy.classSource)&&b.subclassFeatures)||{}).subclassFeatures)||[]).forEach(ref=>{const p=ref.split("|");const x=sfm[[p[0],p[1],p[2]||"PHB",p[3],p[4]||"PHB",p[5]].join("|").toLowerCase()];if(x)sf.push({name:x.name,level:x.level,text:render(expand(x.entries,look))})});
    const bsub=s._copy&&(f.subclass||[]).find(b=>b!==s&&b.name===s._copy.name&&b.source===s._copy.source&&b.className===s._copy.className);
    return{name:s.name,short:s.shortName,source:s.source,prog:s.casterProgression||(bsub&&bsub.casterProgression)||"",abil:s.spellcastingAbility||(bsub&&bsub.spellcastingAbility)||"",caster:!!(s.casterProgression||(bsub&&bsub.casterProgression)),opt:optProg(s.optionalfeatureProgression,bsub&&bsub.optionalfeatureProgression),features:sf}}).filter((s,i,a)=>s.source==="XPHB"||!a.some(o=>o.name===s.name&&o.source==="XPHB")).sort((a,b)=>a.name.localeCompare(b.name));
   out.push({name:c.name,source:c.source,prog:c.casterProgression||"",abil:c.spellcastingAbility||"",tbl:tblOf(c),caster:!!(c.casterProgression||c.spellcastingAbility),opt:optProg(c.optionalfeatureProgression),features:feats,subs})}}
 return out.sort((a,b)=>a.name.localeCompare(b.name))}

// mundane weapons from items-base.json (newest printing of each name wins)
export const WPROP={F:'Finesse',V:'Versatile',T:'Thrown',L:'Light',H:'Heavy','2H':'Two-handed',A:'Ammunition',R:'Reach',LD:'Loading',S:'Special',AF:'Ammunition'};
export const DMGT={S:'slashing',P:'piercing',B:'bludgeoning'};
export function procWeapons(d){const rank={XPHB:0,XDMG:1,PHB:2,DMG:3},by=new Map();
 for(const i of d.baseitem||[]){if(!i.weapon||i.reprintedAs||!(i.source in rank)||!i.dmg1||/^(Net)$/.test(i.name))continue;
  const o=by.get(i.name);if(o&&rank[o.source]<=rank[i.source])continue;
  const code=x=>String(x).split("|")[0];
  by.set(i.name,{key:i.name+"|"+i.source,name:i.name,source:i.source,cat:i.weaponCategory||"",rng:String(i.type||"").startsWith("R"),dmg:i.dmg1,dmg2:i.dmg2||"",dt:DMGT[i.dmgType]||i.dmgType||"",
   props:(i.property||[]).map(code),range:i.range||"",mastery:(i.mastery||[]).map(code)})}
 return[...by.values()].sort((a,b)=>a.name.localeCompare(b.name))}
