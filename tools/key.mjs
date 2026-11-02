// node key.mjs <code> [mods]  – Taste mit Modifikatoren (1=Alt 2=Ctrl 4=Meta 8=Shift) an kimi-Tab
const [code, mods = '9'] = process.argv.slice(2);
const l = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const t = l.find(x => x.type === 'page' && /kimi/.test(x.url));
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const vk = code.startsWith('Key') ? code.charCodeAt(3) : ({ Escape: 27, Enter: 13, Tab: 9 })[code] || 0;
for (const type of ['rawKeyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, code, key: code.startsWith('Key') ? code.slice(3).toLowerCase() : code, windowsVirtualKeyCode: vk, modifiers: Number(mods) });
await new Promise(r => setTimeout(r, 1200));
const r = await send('Runtime.evaluate', { expression: `(document.activeElement.getAttribute('aria-label')||document.activeElement.tagName+'.'+document.activeElement.className)+' || live: '+(document.getElementById('kimiaccess-live')?.innerText||'')`, returnByValue: true });
console.log(r.result.result.value); process.exit(0);
