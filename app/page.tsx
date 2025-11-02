import "server-only";
const s = sec % 60;
const pad = (n:number)=>String(n).padStart(2,'0');
return `${pad(d)}d : ${pad(h)}h : ${pad(m)}m : ${pad(s)}s`;
}


export default async function Page() {
const cfg = await getConfig();
const nowIso = new Date().toISOString(); // revalidate none; JS läuft am Client nicht bei Server Components


return (
<main>
<h1 style={{fontWeight: 800, margin: 0}}>Inventur‑Check</h1>
<p id="text" data-pre={cfg.preText} data-live={cfg.liveText}>{cfg.preText || ""}</p>
<div id="countdown" style={{fontVariantNumeric: "tabular-nums", fontSize: 22, fontWeight: 700}}>–</div>
<p id="info" style={{color: "#8aa0c7", maxWidth: 520}}>{cfg.info || ""}</p>
<div id="status" style={{marginTop: 20, padding: "8px 16px", borderRadius: 999, background: "#0e1628", border: "1px solid rgba(148,163,184,.2)"}}>Status: –</div>


<script dangerouslySetInnerHTML={{__html: `
(function(){
const textEl = document.getElementById('text');
const cdEl = document.getElementById('countdown');
const statusEl = document.getElementById('status');
const pre = textEl?.getAttribute('data-pre') || '';
const live = textEl?.getAttribute('data-live') || '';


function fmt(ms){
const sec = Math.max(0, Math.floor(ms/1000));
const d = Math.floor(sec/86400);
const h = Math.floor((sec%86400)/3600);
const m = Math.floor((sec%3600)/60);
const s = sec%60;
const pad = (n)=>String(n).padStart(2,'0');
return `${pad(d)}d : ${pad(h)}h : ${pad(m)}m : ${pad(s)}s`;
}


async function load(){
const r = await fetch('/api/config', {cache:'no-store'});
const cfg = await r.json();
return cfg;
}


async function tick(){
const cfg = await load();
const start = cfg.start ? new Date(cfg.start) : null;
const end = cfg.end ? new Date(cfg.end) : null;
const now = new Date();
if(!start){
textEl.textContent = pre || '–';
cdEl.textContent = '–';
statusEl.textContent = 'Status: –';
statusEl.style.background = '#0e1628';
return;
}
if(now < start){
textEl.textContent = pre || '–';
cdEl.textContent = 'Countdown bis Start: ' + fmt(start-now);
statusEl.textContent = 'Status: wartet';
statusEl.style.background = '#0e1628';
} else if(end && now < end){
textEl.textContent = live || 'Die Inventur ist gestartet.';
cdEl.textContent = 'Läuft… Restzeit bis Ende: ' + fmt(end-now);
statusEl.textContent = 'Status: läuft';
statusEl.style.background = 'linear-gradient(180deg,#16a34a,#15803d)';
} else if(end && now >= end){
textEl.textContent = live || 'Die Inventur ist gestartet.';
cdEl.textContent = 'Beendet';
statusEl.textContent = 'Status: beendet';
statusEl.style.background = 'linear-gradient(180deg,#dc2626,#b91c1c)';
} else {
textEl.textContent = live || 'Die Inventur ist gestartet.';
cdEl.textContent = 'Gestartet';
statusEl.textContent = 'Status: gestartet';
statusEl.style.background = 'linear-gradient(180deg,#16a34a,#15803d)';
}
}


tick();
setInterval(tick, 1000);
})();
`}} />
</main>
);
}
