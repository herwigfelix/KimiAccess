// Führt JS auf chrome://extensions aus (developerPrivate/management verfügbar)
const P = 9333; const expr = process.argv.slice(2).join(' ');
const ver = await (await fetch(`http://127.0.0.1:${P}/json/version`)).json();
const ws = new WebSocket(ver.webSocketDebuggerUrl); let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const t = await send('Target.createTarget', { url: 'chrome://extensions/', background: true });
const a = await send('Target.attachToTarget', { targetId: t.result.targetId, flatten: true });
await new Promise(r => setTimeout(r, 1200));
const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }, a.result.sessionId);
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1));
await send('Target.closeTarget', { targetId: t.result.targetId }); process.exit(0);
