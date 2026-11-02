// Findet anklickbare Elemente ohne Rolle/Namen (Vue-Handler, cursor:pointer)
const NATIVE = 'a[href],button,input,select,textarea,summary,[role=button],[role=link],[role=menuitem],[role=tab],[role=option],[role=switch],[role=checkbox],[role=radio],[role=menuitemcheckbox],[role=menuitemradio],[role=combobox],[role=treeitem]';
const out = [];
const desc = el => {
  const cls = (el.getAttribute('class')||'').split(/\s+/).slice(0,4).join('.');
  const svg = el.querySelector('svg use')?.getAttribute('xlink:href') || el.querySelector('svg use')?.getAttribute('href') || el.querySelector('svg')?.getAttribute('name') || el.querySelector('svg')?.getAttribute('class') || '';
  const img = el.querySelector('img')?.getAttribute('src')?.split('/').pop()?.slice(0,40) || '';
  return `${el.tagName.toLowerCase()}.${cls} text="${(el.innerText||'').trim().replace(/\s+/g,' ').slice(0,50)}" aria="${el.getAttribute('aria-label')||''}" title="${el.getAttribute('title')||''}" svg="${svg}" img="${img}"`;
};
const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
for (const el of document.querySelectorAll('body *')) {
  if (!visible(el) || el.closest(NATIVE) || el.closest('[data-ka],[data-ka-plain],[aria-hidden=true]')) continue;
  const vei = el._vei && Object.keys(el._vei).filter(k => /^on(Click|Mousedown|Pointerdown|Mouseup|Touchstart)/i.test(k) && el._vei[k]?.value);
  const ptr = getComputedStyle(el).cursor === 'pointer' && getComputedStyle(el.parentElement).cursor !== 'pointer';
  if (((vei && vei.length) || ptr) && !el.querySelector('button,a[href],[role=button]')) out.push(`${vei&&vei.length?'[vue:'+vei.join(',')+']':'[ptr]'} ${desc(el)}`);
}
// Native Bedienelemente ohne zugänglichen Namen (grobe Heuristik)
for (const el of document.querySelectorAll(NATIVE)) {
  if (!visible(el) || el.closest('[aria-hidden=true]')) continue;
  const name = (el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')||el.innerText||el.getAttribute('title')||el.getAttribute('placeholder')||el.querySelector('img[alt]')?.alt||'').trim();
  if (!name && !(el.labels && el.labels.length)) out.push(`[NONAME ${el.getAttribute('role')||el.tagName}] ${desc(el)}`);
}
return out.join('\n');
