// Kleines CDP-Werkzeug: node cdp.mjs <cmd> [arg]
//   eval <js|@file>    JS im kimi-Tab auswerten (await möglich), Ergebnis als JSON
//   ax                 Accessibility-Tree (unbenannte interaktive Knoten markiert)
//   shot <file>        Screenshot
//   nav <url>          navigieren
//   tabs               Tabs auflisten
//   reload-ext         Erweiterung neu laden (über chrome://extensions)
import fs from 'node:fs';
const PORT = 9333;
const [cmd, ...rest] = process.argv.slice(2);
const arg = rest.join(' ');
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const pages = list.filter(t => t.type === 'page');
if (cmd === 'tabs') { for (const t of pages) console.log(t.id, t.url, '|', t.title); process.exit(0); }
const want = process.env.TAB;
const tab = pages.find(t => want ? t.url.includes(want) : /kimi\.(ai|com)/.test(t.url)) || pages[0];
const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0; const pend = new Map();
const ctxs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.executionContextCreated') ctxs.push(m.params.context); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
async function evaluate(expr) {
  const p = { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true };
  if (process.env.EXT) { // im Content-Script-Kontext der Erweiterung auswerten
    await send('Runtime.enable'); await new Promise(r => setTimeout(r, 300));
    // Nach vielen Erweiterungs-Reloads gibt es leere Alt-Kontexte → den aktiven (mit window.__ka) nehmen
    for (const c of ctxs.filter(c => c.name === 'KimiAccess' && c.auxData?.frameId === tab.id).reverse()) {
      const t = await send('Runtime.evaluate', { expression: 'typeof window.__ka', contextId: c.id, returnByValue: true });
      if (t.result?.result?.value === 'object') { p.contextId = c.id; break; }
    }
    if (!p.contextId) return { error: 'aktiver KimiAccess-Kontext nicht gefunden' };
  }
  const r = await send('Runtime.evaluate', p);
  if (r.result?.exceptionDetails) return { error: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text };
  return r.result?.result?.value;
}
if (cmd === 'eval') {
  let js = arg.startsWith('@') ? fs.readFileSync(arg.slice(1), 'utf8') : arg;
  const v = await evaluate(`(async()=>{${js}})()`);
  console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 1));
} else if (cmd === 'type') {
  await send('Input.insertText', { text: arg });
} else if (cmd === 'key') {
  const map = { Enter: [13, '\r'], Tab: [9, ''], Escape: [27, ''], ArrowDown: [40, ''], ArrowUp: [38, ''], ArrowLeft: [37, ''], ArrowRight: [39, ''], Space: [32, ' '] };
  const [code, text] = map[arg] || [0, ''];
  const mods = Number(process.env.MODS || 0);
  const k = arg === 'Space' ? ' ' : arg;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: arg === 'Space' ? 'Space' : arg, windowsVirtualKeyCode: code, text, modifiers: mods });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: arg === 'Space' ? 'Space' : arg, windowsVirtualKeyCode: code, modifiers: mods });
} else if (cmd === 'shot') {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(arg || 'shot.png', Buffer.from(r.result.data, 'base64')); console.log('ok');
} else if (cmd === 'nav') {
  await send('Page.navigate', { url: arg }); await new Promise(r => setTimeout(r, 3000)); console.log('ok');
} else if (cmd === 'ax') {
  await send('Accessibility.enable');
  const r = await send('Accessibility.getFullAXTree');
  const nodes = r.result.nodes; const byId = new Map(nodes.map(n => [n.nodeId, n]));
  const interactive = new Set(['button','link','textbox','checkbox','radio','switch','combobox','menuitem','tab','option','searchbox','slider','menuitemcheckbox','menuitemradio','listbox','treeitem']);
  const out = [];
  const walk = (n, d) => {
    const role = n.role?.value, name = n.name?.value || '';
    const show = !n.ignored && role && !['generic','none','InlineTextBox','StaticText','LineBreak'].includes(role);
    if (show) {
      const flag = interactive.has(role) && !name.trim() ? '  <<< OHNE NAME' : '';
      const props = (n.properties||[]).filter(p => ['expanded','checked','pressed','selected','focusable','disabled'].includes(p.name)).map(p => `${p.name}=${p.value.value}`).join(' ');
      if (!process.env.ONLY || flag) out.push(`${'  '.repeat(d)}${role} "${name.slice(0,80)}"${props ? ' ['+props+']' : ''}${flag}`);
    }
    for (const c of n.childIds || []) { const ch = byId.get(c); if (ch) walk(ch, show ? d + 1 : d); }
  };
  walk(nodes[0], 0); console.log(out.join('\n'));
}
ws.close(); process.exit(0);
