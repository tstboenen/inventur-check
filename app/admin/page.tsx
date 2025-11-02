'use client';
import { useEffect, useState } from 'react';


export default function AdminPage(){
const [pin, setPin] = useState('');
const [cfg, setCfg] = useState({ start: '', end: '', preText: '', liveText: '', info: '' });
const [msg, setMsg] = useState('');


useEffect(()=>{ fetch('/api/config').then(r=>r.json()).then(c=>{
setCfg({
start: c.start ? c.start.slice(0,16) : '',
end: c.end ? c.end.slice(0,16) : '',
preText: c.preText||'', liveText: c.liveText||'', info: c.info||''
});
}); },[]);


const save = async()=>{
setMsg('Speichere…');
const body = {
start: cfg.start ? new Date(cfg.start).toISOString() : null,
end: cfg.end ? new Date(cfg.end).toISOString() : null,
preText: cfg.preText, liveText: cfg.liveText, info: cfg.info,
tz: 'Europe/Berlin', v: 2
};
const r = await fetch(`/api/config?pin=${encodeURIComponent(pin)}`,{
method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body)
});
if(r.ok){ setMsg('Gespeichert.'); } else { setMsg('Fehler: '+r.status); }
};


return (
<main>
<h1 style={{fontWeight:800}}>Inventur‑Check · Admin</h1>
<p style={{opacity:.8}}>Serverseitige Speicherung in Vercel KV. Kein LocalStorage.</p>


<label>Admin‑PIN</label>
<input value={pin} onChange={e=>setPin(e.target.value)} type="password" placeholder="••••••" style={inputStyle} />


<label>Start</label>
<input value={cfg.start} onChange={e=>setCfg({...cfg,start:e.target.value})} type="datetime-local" style={inputStyle} />


<label>Ende (optional)</label>
<input value={cfg.end} onChange={e=>setCfg({...cfg,end:e.target.value})} type="datetime-local" style={inputStyle} />


<label>Text vor Start</label>
<textarea value={cfg.preText} onChange={e=>setCfg({...cfg,preText:e.target.value})} style={areaStyle} />


<label>Text nach Start</label>
<textarea value={cfg.liveText} onChange={e=>setCfg({...cfg,liveText:e.target.value})} style={areaStyle} />


<label>Zusatzinfo</label>
<textarea value={cfg.info} onChange={e=>setCfg({...cfg,info:e.target.value})} style={areaStyle} />


<div style={{display:'flex', gap:8, marginTop:10}}>
<button onClick={save} style={btnStyle}>Speichern</button>
</div>
<p>{msg}</p>
</main>
);
}


const inputStyle: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid rgba(148,163,184,.26)', background:'#0d1424', color:'#e6eeff' };
const areaStyle: React.CSSProperties = { ...inputStyle, minHeight:90 } as any;
const btnStyle: React.CSSProperties = { padding:'10px 14px', borderRadius:12, border:'1px solid rgba(148,163,184,.26)', background:'#1d4ed8', color:'#fff', fontWeight:700 };
