// Text helpers: 5etools {@tag} cleanup and entry rendering to simple HTML.
export const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
export function clean(t){let s=String(t).replace(/\{@h\}/g,"Hit: "),prev;
 const f=(_,tag,a)=>{const p=a.split("|");
  if(/^(i|b|bold|italic|note|u|s|strike|underline|sup|sub|small|code|color|font)$/.test(tag))return a;
  if(tag==="scaledamage"||tag==="scaledice")return p[3]||p[2]||p[0];
  if(tag==="dice")return p[1]||p[0];
  if(tag==="damage")return p[0];
  if(tag==="dc")return"DC "+p[0];
  if(tag==="hit")return(+p[0]>=0?"+":"")+p[0];
  if(tag==="atk")return({ms:"Melee Spell Attack:",rs:"Ranged Spell Attack:",mw:"Melee Weapon Attack:",rw:"Ranged Weapon Attack:"})[p[0]]||"Attack:";
  if(tag==="filter"||tag==="book"||tag==="link"||tag==="footnote"||tag==="5etools")return p[0];
  if(tag==="quickref")return p[4]||p[0];
  if(tag==="classFeature")return p[5]||p[0];
  if(tag==="subclassFeature")return p[7]||p[0];
  if(tag==="subclass")return p[4]||p[0];
  return p[2]||p[0]};
 do{prev=s;s=s.replace(/\{@(\w+)\s*([^{}]*)\}/g,f)}while(s!==prev);return s}
export const strip=h=>h.replace(/<\/?p>/g," ");
export function render(e){if(e==null)return"";if(typeof e==="string")return"<p>"+esc(clean(e))+"</p>";
if(Array.isArray(e))return e.map(render).join("");
if(e.type==="list")return"<ul>"+(e.items||[]).map(i=>"<li>"+(typeof i==="string"?esc(clean(i)):(i.name?"<b>"+esc(clean(i.name))+"</b> ":"")+strip(render(i.entries||i.entry||"")))+"</li>").join("")+"</ul>";
if(e.type==="table")return(e.caption?"<p><i>"+esc(clean(e.caption))+"</i></p>":"")+(e.rows||[]).map(r=>"<p>"+r.map(c=>esc(clean(typeof c==="object"?(c.roll?(c.roll.exact??c.roll.min+"-"+c.roll.max):JSON.stringify(c)):c))).join(" — ")+"</p>").join("");
return(e.name?"<p><b>"+esc(clean(e.name))+".</b></p>":"")+render(e.entries||e.entry||"")}
export const ordl=l=>l===0?"Cantrip":l+(["st","nd","rd"][l-1]||"th")+"-level";
export const lvlName=l=>l===0?"Cantrips":"Level "+l;
