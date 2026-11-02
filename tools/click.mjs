// node click.mjs '<css-selector>' [index] – echter Mausklick (CDP Input) auf Elementmitte
const [sel, idx = '0'] = process.argv.slice(2);
const l = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const t = l.find(x => x.type === 'page' && /kimi/.test(x.url));
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const r = await send('Runtime.evaluate', { expression: `(()=>{const e=document.querySelectorAll(${JSON.stringify(sel)})[${idx}]; e.scrollIntoView({block:'center'}); const b=e.getBoundingClientRect(); return [b.left+b.width/2,b.top+b.height/2]})()`, returnByValue: true });
const [x, y] = r.result.result.value;
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
console.log('geklickt', x, y); process.exit(0);
