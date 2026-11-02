// Lädt die entpackte Erweiterung neu und danach den kimi-Tab
const P = 9333;
const ver = await (await fetch(`http://127.0.0.1:${P}/json/version`)).json();
const ws = new WebSocket(ver.webSocketDebuggerUrl); let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const t = await send('Target.createTarget', { url: 'chrome://extensions/', background: true });
const tid = t.result.targetId;
const at = await send('Target.attachToTarget', { targetId: tid, flatten: true }); const sid = at.result.sessionId;
await new Promise(r => setTimeout(r, 1200));
const r = await send('Runtime.evaluate', { expression: `new Promise(res=>chrome.developerPrivate.getExtensionsInfo(l=>{const e=l.find(x=>x.name==='KimiAccess'); chrome.developerPrivate.reload(e.id,{failQuietly:false},()=>res(e.id+' neu geladen '+(chrome.runtime.lastError?.message||'')))}))`, awaitPromise: true, returnByValue: true }, sid);
console.log(r.result?.result?.value || JSON.stringify(r));
await send('Target.closeTarget', { targetId: tid });
const list = await (await fetch(`http://127.0.0.1:${P}/json/list`)).json();
for (const p of list.filter(x => x.type === 'page' && /kimi/.test(x.url))) {
  const a = await send('Target.attachToTarget', { targetId: p.id, flatten: true });
  await send('Page.reload', {}, a.result.sessionId);
}
await new Promise(r => setTimeout(r, 4000));
process.exit(0);
