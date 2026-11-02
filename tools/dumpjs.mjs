// Speichert alle im kimi-Tab geparsten Skripte in einen Ordner (zum Durchsuchen)
import fs from 'node:fs';
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const tab = list.find(t => t.type === 'page' && /kimi/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl); let id = 0; const pend = new Map(); const scripts = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Debugger.scriptParsed' && m.params.url) scripts.push(m.params); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Debugger.enable'); await new Promise(r => setTimeout(r, 1500));
let n = 0;
for (const s of scripts) { const r = await send('Debugger.getScriptSource', { scriptId: s.scriptId }); const name = s.url.split('/').pop().split('?')[0] || ('s' + s.scriptId); fs.writeFileSync(`${out}/${name}`, r.result?.scriptSource || ''); n++; }
await send('Debugger.disable'); console.log(n, 'Skripte'); process.exit(0);
