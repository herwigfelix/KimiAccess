// Einstellungen von KimiAccess (chrome.storage.sync, vom Content-Script live übernommen)
const DEFAULTS = { speak: 'end', headings: true };
const status = document.getElementById('status');

// Texte in der Browsersprache (_locales)
for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = chrome.i18n.getMessage(el.dataset.i18n);
document.documentElement.lang = chrome.i18n.getMessage('langCode');

chrome.storage.sync.get(DEFAULTS, v => {
  const r = document.querySelector(`input[name=speak][value="${v.speak}"]`);
  if (r) r.checked = true;
  document.getElementById('headings').checked = v.headings;
});

function saved() {
  status.textContent = chrome.i18n.getMessage('saved');
  setTimeout(() => { status.textContent = ''; }, 1500);
}

for (const r of document.querySelectorAll('input[name=speak]')) {
  r.addEventListener('change', () => chrome.storage.sync.set({ speak: r.value }, saved));
}
document.getElementById('headings').addEventListener('change', e => chrome.storage.sync.set({ headings: e.target.checked }, saved));
