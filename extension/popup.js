// Einstellungen von KimiAccess (chrome.storage.sync, vom Content-Script live übernommen)
const DEFAULTS = { speak: 'end', headings: true };
const status = document.getElementById('status');

chrome.storage.sync.get(DEFAULTS, v => {
  const r = document.querySelector(`input[name=speak][value="${v.speak}"]`);
  if (r) r.checked = true;
  document.getElementById('headings').checked = v.headings;
});

function saved() {
  status.textContent = 'Gespeichert';
  setTimeout(() => { status.textContent = ''; }, 1500);
}

for (const r of document.querySelectorAll('input[name=speak]')) {
  r.addEventListener('change', () => chrome.storage.sync.set({ speak: r.value }, saved));
}
document.getElementById('headings').addEventListener('change', e => chrome.storage.sync.set({ headings: e.target.checked }, saved));
