// School and class symbols used as card backgrounds, plus their colors.
export const svg=p=>'<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
export const rays=(n,r1,r2)=>Array.from({length:n},(_,i)=>{const a=i*2*Math.PI/n,c=Math.cos(a),s=Math.sin(a);return"M"+(32+r1*c).toFixed(1)+" "+(32+r1*s).toFixed(1)+"L"+(32+r2*c).toFixed(1)+" "+(32+r2*s).toFixed(1)}).join("");
export const gearPath=(n,ri,ro)=>{let d="";const p=2*Math.PI/n;for(let i=0;i<n;i++){[[-.30,ri],[-.17,ro],[.17,ro],[.30,ri]].forEach(([k,r],j)=>{const t=i*p+k*p;d+=(i+j?"L":"M")+(32+r*Math.cos(t)).toFixed(1)+" "+(32+r*Math.sin(t)).toFixed(1)})}return d+"Z"};
export const SPARK='<path d="M32 6C34 24 40 30 58 32 40 34 34 40 32 58 30 40 24 34 6 32 24 30 30 24 32 6Z"/>';
export const ICON={
 Abjuration:svg('<path d="M32 6L54 14V32C54 46 44 56 32 60 20 56 10 46 10 32V14Z"/><path d="M32 16V50M20 28H44"/>'),
 Conjuration:svg('<path d="M32 8A24 24 0 1 1 8 32"/><path d="M32 19A13 13 0 1 1 19 32"/><circle cx="32" cy="32" r="3" fill="currentColor"/>'),
 Divination:svg('<path d="M4 32C14 14 50 14 60 32 50 50 14 50 4 32Z"/><circle cx="32" cy="32" r="9"/><circle cx="32" cy="32" r="3" fill="currentColor"/>'),
 Enchantment:svg('<path d="M32 56C10 40 6 26 12 18 18 10 28 12 32 20 36 12 46 10 52 18 58 26 54 40 32 56Z"/>'),
 Evocation:svg('<path d="M32 6C34 18 48 24 48 38 48 50 40 58 32 58 22 58 16 50 16 40 16 32 22 28 24 20 28 24 30 26 32 6Z"/><path d="M32 58C26 54 26 46 32 40 38 46 38 54 32 58Z"/>'),
 Illusion:svg('<circle cx="23" cy="32" r="16"/><circle cx="41" cy="32" r="16"/>'),
 Necromancy:svg('<path d="M32 6C18 6 10 16 10 28 10 36 14 40 18 42V52H46V42C50 40 54 36 54 28 54 16 46 6 32 6Z"/><circle cx="24" cy="30" r="5"/><circle cx="40" cy="30" r="5"/><path d="M32 36L29 44H35ZM26 52V47M32 52V47M38 52V47"/>'),
 Transmutation:svg('<path d="M12 30A20 20 0 0 1 48 20M50 8V22H36"/><path d="M52 34A20 20 0 0 1 16 44M14 56V42H28"/>'),
 Artificer:svg('<path d="'+gearPath(8,17,26)+'"/><circle cx="32" cy="32" r="7"/>'),
 Barbarian:svg('<path d="M32 8V58"/><path d="M32 14C20 10 10 16 8 26 18 28 26 26 32 24"/><path d="M32 14C44 10 54 16 56 26 46 28 38 26 32 24"/>'),
 Bard:svg('<path d="M38 8V44"/><ellipse cx="28" cy="46" rx="10" ry="7"/><path d="M38 8C46 12 52 20 50 30"/>'),
 Cleric:svg('<circle cx="32" cy="32" r="11"/><path d="'+rays(8,17,27)+'"/>'),
 Druid:svg('<path d="M10 54C10 26 28 10 54 10 54 36 40 56 10 54Z"/><path d="M10 54L40 24"/>'),
 Fighter:svg('<path d="M14 54L52 10M18.5 36.5L30.7 46.9M50 54L12 10M45.5 36.5L33.3 46.9"/>'),
 Monk:svg('<circle cx="32" cy="32" r="23"/><path d="M32 9C18 20 46 44 32 55"/><circle cx="32" cy="20" r="3" fill="currentColor"/><circle cx="32" cy="44" r="3" fill="currentColor"/>'),
 Paladin:svg('<path d="M32 6L54 14V32C54 46 44 56 32 60 20 56 10 46 10 32V14Z"/><g transform="translate(0 -2)"><circle cx="32" cy="32" r="6"/><path d="'+rays(8,10,16)+'"/></g>'),
 Ranger:svg('<path d="M20 8C44 20 44 44 20 56M20 8V56"/><path d="M8 32H56M56 32L47 25M56 32L47 39"/>'),
 Rogue:svg('<path d="M32 6L39 34H25Z"/><path d="M19 34H45M32 34V50"/><circle cx="32" cy="55" r="4"/>'),
 Sorcerer:svg(SPARK),
 Warlock:svg('<circle cx="32" cy="32" r="24"/><path d="M32 10L44.9 49.8 11.1 25.2H52.9L19.1 49.8Z"/>'),
 Wizard:svg('<path d="M30 8C34 20 42 36 48 46H16C22 36 28 22 30 8Z"/><ellipse cx="32" cy="50" rx="26" ry="7"/><circle cx="31" cy="30" r="2.5" fill="currentColor"/>'),
 _:svg(SPARK)};
export const COL={Abjuration:"#3b6fb6",Conjuration:"#b8860b",Divination:"#5f5bc4",Enchantment:"#c2528b",Evocation:"#d2562b",Illusion:"#7b4fa8",Necromancy:"#3f8a5a",Transmutation:"#8a6d3b",
 Artificer:"#a0652a",Barbarian:"#c0392b",Bard:"#b5589b",Cleric:"#c9a227",Druid:"#4f8a3c",Fighter:"#8c6d4f",Monk:"#2f8f9d",Paladin:"#d4a017",Ranger:"#3f7f4f",Rogue:"#5b5b6e",Sorcerer:"#cc3355",Warlock:"#7b3fa0",Wizard:"#3a60b5"};
