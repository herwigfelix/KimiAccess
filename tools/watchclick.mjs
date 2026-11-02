// node watchclick.mjs '<css-selector>' [wartezeit ms] – echter Mausklick, protokolliert Netzwerk, Konsole, Exceptions und neue Dialoge
const [sel, wait = '3000'] = process.argv.slice(2);
const l = await (await fetch('http://127.0.0.1:9333/json/list')).json();
const t = l.find(x => x.type === 'page' && /kimi/.test(x.url));
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const pend = new Map(); const log = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  const p = m.params;
  if (m.method === 'Network.requestWillBeSent' && !/\.(js|css|png|svg|woff2?)(\?|$)/.test(p.request.url)) log.push(`REQ ${p.request.method} ${p.request.url.slice(0, 160)}`);
  if (m.method === 'Network.responseReceived' && /apiv2|api\//.test(p.response.url)) log.push(`RES ${p.response.status} ${p.response.url.slice(0, 160)}`);
  if (m.method === 'Runtime.consoleAPICalled') log.push(`CONSOLE.${p.type} ${p.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300)}`);
  if (m.method === 'Runtime.exceptionThrown') log.push(`EXCEPTION ${(p.exceptionDetails.exception?.description || p.exceptionDetails.text).slice(0, 500)}`);
  if (m.method === 'Log.entryAdded') log.push(`LOG.${p.entry.level} ${p.entry.text.slice(0, 300)}`);
};
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Network.enable'); await send('Runtime.enable'); await send('Log.enable');
await new Promise(r => setTimeout(r, 300)); log.length = 0;
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.result.value;
const before = await ev(`document.querySelectorAll('[role=dialog],[role=alertdialog],.kimi-modal,.kimi-dialog').length`);
const [x, y] = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({block:'center'}); const b=e.getBoundingClientRect(); return [b.left+b.width/2,b.top+b.height/2]})()`);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
await new Promise(r => setTimeout(r, Number(wait)));
const after = await ev(`[...document.querySelectorAll('[role=dialog],[role=alertdialog],.kimi-modal,.kimi-dialog')].filter(e=>e.offsetParent||e.getClientRects().length).map(e=>e.className+' | '+e.innerText.slice(0,300))`);
console.log(`Klick bei ${Math.round(x)},${Math.round(y)}; Dialoge vorher ${before}, sichtbar nachher:`, JSON.stringify(after, null, 1));
console.log(log.join('\n') || '(keine Netzwerk-/Konsolenereignisse)');
process.exit(0);
