/*
 * KimiAccess – macht kimi.ai / kimi.com für Screenreader bedienbar.
 *
 * Die Seite ist eine Vue-App, die viele Bedienelemente als <div>/<p> mit
 * Klick-Handler baut. Dieses Skript ändert fast nur Attribute (role, aria-*,
 * tabindex). Eigene Knoten gibt es nur zwei: die Live-Regionen direkt an
 * <body> (außerhalb von #app) und je Nachricht eine unsichtbare <h3> als
 * erstes Kind von .segment – dort ändert Vue die Kinderliste nicht.
 */
(() => {
  'use strict';
  if (window.__kimiAccess) return;
  window.__kimiAccess = true;

  // ---------------------------------------------------------------------------
  // Sprache: Browsersprache Deutsch → deutsche Beschriftungen, sonst englische
  // ---------------------------------------------------------------------------
  let uiLang = navigator.language || 'en';
  try { uiLang = chrome.i18n.getUILanguage() || uiLang; } catch { /* außerhalb der Erweiterung */ }
  const DE = /^de\b/i.test(uiLang);
  const L = (de, en) => (DE ? de : en);
  // werden auch als Selektor genutzt (Stopp-Kürzel, Senden-Erkennung)
  const STOP_LABEL = L('Antwort stoppen', 'Stop answer');
  const SEND_LABEL = L('Senden', 'Send');

  // ---------------------------------------------------------------------------
  // Icon-Namen (Attribut name="" an <svg class="iconify">) → [deutsch, englisch]
  // ---------------------------------------------------------------------------
  const ICON_LABELS = {
    Add: ['Hinzufügen', 'Add'], AddConversation: ['Neuer Chat', 'New chat'], Add_member: ['Mitglied hinzufügen', 'Add member'],
    Close: ['Schließen', 'Close'], Close_f: ['Schließen', 'Close'], BaseClose: ['Schließen', 'Close'], CloseIconIn_f: ['Schließen', 'Close'],
    Copy: ['Kopieren', 'Copy'], CopyFromClipboard: ['Aus Zwischenablage einfügen', 'Paste from clipboard'],
    Code: ['Code', 'Code'], Folder: ['Dateien', 'Files'], FileFolder: ['Dateien', 'Files'], Setting: ['Einstellungen', 'Settings'], Settings: ['Einstellungen', 'Settings'],
    Down: ['Nach unten', 'Down'], Down_b: ['Nach unten', 'Down'], Up: ['Nach oben', 'Up'], ChevronDown: ['Aufklappen', 'Expand'], ChevronRight: ['Weiter', 'Next'],
    ChevronLeft: ['Zurück', 'Back'], Left: ['Zurück', 'Back'], Left_b: ['Zurück', 'Back'], Right: ['Weiter', 'Next'], Right_b: ['Weiter', 'Next'],
    Edit: ['Bearbeiten', 'Edit'], Delete: ['Löschen', 'Delete'], Refresh: ['Aktualisieren', 'Refresh'], Refresh_b: ['Neu starten', 'Restart'],
    Share: ['Teilen', 'Share'], Share_a: ['Teilen', 'Share'], Download: ['Herunterladen', 'Download'], Upload: ['Hochladen', 'Upload'], Link: ['Link', 'Link'],
    More: ['Mehr', 'More'], Ellipsis: ['Mehr Optionen', 'More options'], Menu: ['Menü', 'Menu'], Magnify: ['Suchen', 'Search'], Search: ['Suchen', 'Search'],
    Expand: ['Erweitern', 'Expand'], Collapse: ['Einklappen', 'Collapse'], FullScreen: ['Vollbild', 'Full screen'], FitScreen: ['An Fenster anpassen', 'Fit to window'],
    Eye: ['Anzeigen', 'Show'], EyeOff: ['Verbergen', 'Hide'], Check: ['Bestätigen', 'Confirm'], Checkmark: ['Bestätigen', 'Confirm'], Info: ['Info', 'Info'],
    Clip: ['Datei anhängen', 'Attach file'], Diagnosis: ['KI-Diagnose', 'AI diagnosis'], MCP: ['Konfiguration', 'Configuration'], Save: ['Sichern', 'Save'],
    Document: ['Dokument', 'Document'], Document_b: ['Dokument', 'Document'], Message: ['Feedback', 'Feedback'], Gift: ['Geschenk', 'Gift'],
    Like: ['Gefällt mir', 'Like'], Dislike: ['Gefällt mir nicht', 'Dislike'], Good: ['Gefällt mir', 'Like'], Bad: ['Gefällt mir nicht', 'Dislike'],
    ThumbUp: ['Gefällt mir', 'Like'], ThumbDown: ['Gefällt mir nicht', 'Dislike'], Stop: ['Stoppen', 'Stop'], Send: ['Senden', 'Send'],
    ArrowUp: ['Senden', 'Send'], Enter: ['Senden', 'Send'], Voice: ['Spracheingabe', 'Voice input'], Microphone: ['Spracheingabe', 'Voice input'], Mic: ['Spracheingabe', 'Voice input'],
    Sidebar: ['Seitenleiste', 'Sidebar'], Pin: ['Anheften', 'Pin'], Unpin: ['Lösen', 'Unpin'], Star: ['Favorit', 'Favorite'], Calendar: ['Kalender', 'Calendar'],
    Clock: ['Zeit', 'Time'], History: ['Verlauf', 'History'], Browser: ['Browser', 'Browser'], Image: ['Bild', 'Image'], InsertImage: ['Bild einfügen', 'Insert image'],
    Location: ['Ort', 'Location'], Memory: ['Erinnerung', 'Memory'], Translate: ['Übersetzen', 'Translate'], Play: ['Abspielen', 'Play'], Pause: ['Pause', 'Pause'],
    Volume: ['Vorlesen', 'Read aloud'], Speaker: ['Vorlesen', 'Read aloud'], Retry: ['Erneut versuchen', 'Try again'], Regenerate: ['Neu generieren', 'Regenerate'],
    Update: ['Aktualisieren', 'Update'], MoveForward: ['Zurücksetzen', 'Reset'], Kimiclaw: ['Kimi Claw', 'Kimi Claw'], WebBridge: ['Kimi WebBridge', 'Kimi WebBridge'],
    UpperRight: ['Öffnen', 'Open'], Flag: ['Melden', 'Report'], Comment: ['Kommentar', 'Comment'], Commands: ['Befehle', 'Commands'], Log: ['Protokoll', 'Log'],
  };

  // ---------------------------------------------------------------------------
  // Gezielte Regeln für bekannte Kimi-Bausteine.
  // label: String oder Funktion(el) → String; role: Rolle für Nicht-Natives.
  // ---------------------------------------------------------------------------
  const RULES = [
    // Claw-Chat: Kopfzeilen-Symbole
    { sel: '.header-action:has(svg[name="Code"])', label: 'Terminal' },
    { sel: '.header-action:has(svg[name="Folder"])', label: L('Dateien', 'Files') },
    { sel: '.header-action:has(svg[name="Setting"])', label: L('Claw-Einstellungen', 'Claw settings') },
    { sel: '.bot-intro-id-copy', label: L('Bot-ID kopieren', 'Copy bot ID') },
    { sel: '.bot-config-header .icon-button:has(svg[name="Close"])', label: L('Einstellungen schließen', 'Close settings') },
    { sel: '.to-bottom', label: L('Zum Ende des Chats springen', 'Jump to end of chat') },
    { sel: '.toolkit-trigger-btn', label: L('Dateien und Skills hinzufügen', 'Add files and skills') },
    { sel: '.toolkit-item', role: 'menuitem' },
    { sel: '.bot-actions-menu-item', role: 'button' },
    { sel: '.recommend-prompt-item', role: 'button', label: el => L('Vorschlag: ', 'Suggestion: ') + txt(el) },
    // Seitenleiste: „Mehr“ je Chat mit Chat-Titel
    { sel: '.next-sidebar-history-item__more', force: true,
      label: el => L('Optionen für ', 'Options for ') + (txt(el.closest('.next-sidebar-history-item')?.querySelector('.next-sidebar-history-item__title')) || 'Chat') },
    // Normaler Chat: Kopfzeile, Nachrichten-Aktionen, Gedankengang, Code
    { sel: 'header.chat-header-content > svg', role: 'button', force: true, label: L('Chat-Optionen', 'Chat options'),
      apply: el => { const h = el.parentElement; setAttr(el, 'aria-haspopup', 'menu'); setAttr(el, 'aria-expanded', h.getAttribute('aria-expanded') || 'false'); } },
    { sel: '.segment-avatar .avatar', hide: true },
    { sel: '.segment-user-actions .simple-button:has(svg[name="Edit"])', force: true, label: L('Nachricht bearbeiten', 'Edit message') },
    { sel: '.segment-user-actions .simple-button:has(svg[name="Copy"])', force: true, label: L('Nachricht kopieren', 'Copy message') },
    { sel: '.segment-user-actions .simple-button:has(svg[name^="Share"])', force: true, label: L('Nachricht teilen', 'Share message') },
    { sel: '.segment-assistant-actions .icon-button:has(svg[name="Copy"])', force: true, label: L('Antwort kopieren', 'Copy answer') },
    { sel: '.segment-assistant-actions .icon-button:has(svg[name^="Refresh"])', force: true, label: L('Antwort neu generieren', 'Regenerate answer') },
    { sel: '.segment-assistant-actions .icon-button:has(svg[name^="Share"])', force: true, label: L('Antwort teilen', 'Share answer') },
    { sel: '.segment-assistant-actions .icon-button:has(svg[name^="Like"])', force: true, label: L('Gute Antwort', 'Good answer') },
    { sel: '.segment-assistant-actions .icon-button:has(svg[name^="Dislike"])', force: true, label: L('Schlechte Antwort', 'Bad answer') },
    { sel: '.toolcall-title-container.is-expandable', role: 'button', force: true,
      label: el => (el.closest('.thinking-container') ? L('Gedankengang: ', 'Reasoning: ') : L('Werkzeug: ', 'Tool: ')) + txt(el.querySelector('.toolcall-title-name-text') || el),
      apply: el => setAttr(el, 'aria-expanded', String(!!el.closest('.toolcall-container')?.classList.contains('is-expanded'))) },
    { sel: '.segment-code', role: 'group', noKey: true, force: true, label: el => L('Codeblock ', 'Code block ') + txt(el.querySelector('.segment-code-lang')) },
    { sel: '.segment-code-header .icon-button', role: 'button', force: true, label: el => L('', 'Copy ') + txt(el.closest('.segment-code').querySelector('.segment-code-lang')) + L('-Code kopieren', ' code') },
    // Tooltip-Kinder liefern sonst doppelte Namen; vorher ins aria-label des Knopfs übernehmen
    { sel: '.kimi-tooltip[role=tooltip]', apply: el => {
      const host = el.parentElement?.closest('button,[role=button],[data-ka]');
      if (!host) return;
      if (!host.getAttribute('aria-label') && txt(el)) host.setAttribute('aria-label', txt(el));
      setAttr(el, 'aria-hidden', 'true');
    } },
    // Claw: Dateibaum und Dateivorschau
    { sel: '.file-folder-item-row[role=treeitem]', force: true,
      label: el => fileName(el) + (el.classList.contains('file-folder-item-row--folder') ? L(', Ordner', ', folder') : '') },
    { sel: '.file-folder-item-download', force: true, label: el => L('', 'Download ') + fileName(el.closest('[role=treeitem]')) + L(' herunterladen', '') },
    { sel: '.file-preview-header-actions .icon-button:has(svg[name="Copy"])', force: true, label: el => L('Inhalt von ' + previewName(el) + ' kopieren', 'Copy contents of ' + previewName(el)) },
    { sel: '.file-preview-header-actions .icon-button:has(svg[name="Download"])', force: true, label: el => L(previewName(el) + ' herunterladen', 'Download ' + previewName(el)) },
    { sel: '.file-preview-content', role: 'region', noKey: true, force: true, label: el => L('Vorschau ', 'Preview ') + previewName(el) },
    // Claw: Terminal
    { sel: '.xterm-helper-textarea', force: true, label: L('Terminal-Eingabe', 'Terminal input') },
    { sel: '.terminal-container', role: 'region', noKey: true, label: 'Terminal' },
    // Folien: Stilkarten – Klick öffnet die Vorschau, „Nachmachen“ übernimmt den Stil.
    // Die Karte selbst enthält weitere Knöpfe, daher wird die Beschriftungszeile zum Knopf.
    { sel: '.ppt-style-selector', role: 'list', noKey: true, label: L('Folienstile', 'Slide styles') },
    { sel: '.ppt-style-selector > .style-card', role: 'listitem', noKey: true },
    { sel: '.style-card .style-card-label', role: 'button', force: true,
      label: el => L('Vorschau ', 'Preview ') + (txt(el.querySelector('.label-name')) || txt(el)) + (el.closest('.style-card').classList.contains('selected') ? L(', ausgewählt', ', selected') : '') },
    { sel: '.style-card .card-action', force: true, label: el => L(txt(el.closest('.style-card').querySelector('.label-name')) + ' nachmachen', 'Recreate ' + txt(el.closest('.style-card').querySelector('.label-name'))) },
    { sel: '.style-card .select-mask, .style-card .select-badge', hide: true },
    // Einstellungen
    // Schalter: <label class="switch"><input type=checkbox hidden>… – das Label wird zum switch
    { sel: 'label.switch', role: 'switch', force: true,
      label: el => {
        const row = el.closest('.settings-row') || el.parentElement?.parentElement;
        return txt(row?.querySelector('.settings-row__label, [class*=label]:not(.switch), [class*=title]')) || L('Schalter', 'Switch');
      },
      apply: el => {
        const inp = el.querySelector('input[type=checkbox]');
        if (inp) { setAttr(el, 'aria-checked', String(inp.checked)); if (inp.disabled) setAttr(el, 'aria-disabled', 'true'); }
        const desc = el.closest('.settings-row')?.querySelector('.settings-row__desc');
        if (desc) { if (!desc.id) desc.id = 'ka-d-' + Math.random().toString(36).slice(2, 8); setAttr(el, 'aria-describedby', desc.id); }
      } },
    { sel: 'label.account-profile__avatar', role: 'button', force: true, label: L('Profilbild ändern', 'Change profile picture') },
    // /bot Startseite
    { sel: '.action-title-link', role: 'link' },
    { sel: '.action-card', role: 'group', noKey: true, label: el => txt(el.querySelector('h1,h2,h3,h4,[class*=title]')) || '' },
    // Hauptchat / Seitenleiste
    { sel: '.user-info-container', role: 'button', label: el => L('Benutzermenü: ', 'User menu: ') + txt(el) },
    { sel: '.membership-upgrade', role: 'link' },
    { sel: '.current-model', role: 'button', force: true, label: el => L('Modell wählen, aktuell ', 'Choose model, current: ') + txt(el) },
    { sel: '.arrow-action .arrow', hide: true },
    { sel: '.send-button-container.stop', role: 'button', force: true, label: STOP_LABEL,
      apply: el => el.removeAttribute('aria-disabled') },
    { sel: '.send-button-container:not(.stop)', role: 'button', force: true, label: SEND_LABEL },
    { sel: '.rive-doodle-frame', role: 'button', label: 'Kimi Doodle' },
    { sel: '.bot-status-tag--alive', role: 'img', label: 'online', force: true },
    { sel: '.bot-status-tag:not(.bot-status-tag--alive)', role: 'img', label: 'offline', force: true },
    // Websites („App erstellen“/Agent): Karten im Chat, Konsole rechts, Teilen-Popover.
    // Eine zentrale Website-Liste gibt es bei Kimi nicht – jede Website lebt in ihrem Chat.
    { sel: '.chat-header-actions .icon:has(svg[name="Clip"])', role: 'button', force: true,
      label: el => L('Dateien dieses Chats', 'Files in this chat') + (txt(el.querySelector('.file-count')) ? ` (${txt(el.querySelector('.file-count'))})` : '') },
    // „V3“ zeigt nur per Hover einen Tooltip – kein Knopf, die Version steckt im Kartennamen
    { sel: '.preview-card .version-tag', plain: true },
    { sel: '.website-preview-card .published-url', role: 'link', force: true, label: el => L('Veröffentlichte Website öffnen: ', 'Open published website: ') + txt(el) },
    // „Vorschau“/„Wiederherstellen“ gibt es je Karte – Kartentitel (mit Version) anhängen
    { sel: '.preview-card .action-button', force: true,
      label: el => txt(el) + ': ' + txt(el.closest('.preview-card').querySelector('.content > .title')) },
    { sel: '.bubble-tabs .bubble-tab', apply: el => setAttr(el, 'aria-pressed', String(el.classList.contains('selected'))) },
    { sel: 'iframe.code-frame', apply: el => { if (!el.title) el.title = L('Website-Vorschau', 'Website preview'); } },
    { sel: '.visibility-trigger', force: true, label: el => L('Wer kann zugreifen: ', 'Who can access: ') + txt(el) },
    { sel: '.domain-section .domain-value', force: true,
      label: el => L('Domain bearbeiten: ', 'Edit domain: ') + txt(el) + txt(el.closest('.domain-field')?.querySelector('.domain-suffix')) },
    { sel: '.domain-section .domain-input', apply: el => describeBy(el, el.closest('.domain-field')?.querySelector('.domain-suffix')) },
    { sel: '.website-settings-page .settings-section-title', apply: el => { setAttr(el, 'role', 'heading'); setAttr(el, 'aria-level', '2'); } },
    { sel: '.database .table-item', role: 'button', apply: el => setAttr(el, 'aria-pressed', String(el.classList.contains('selected'))) },
    { sel: '.database .data-table', force: true, label: el => L('Tabelle ', 'Table ') + txt(el.closest('.database').querySelector('.main-title')) },
    // Kimi-Code-Konsole: API-Schlüssel-Tabelle, „Bearbeiten“/„Löschen“ je Zeile mit Schlüsselname
    { sel: '.api-keys-section .data-table', force: true, label: () => L('API-Schlüssel', 'API keys') },
    { sel: '.api-keys-section .action-btn', force: true, label: el => {
      const cells = el.closest('tr')?.cells || [];
      const name = txt(cells[2]);
      return (el.classList.contains('action-btn-delete') ? L('Löschen', 'Delete') : L('Bearbeiten', 'Edit')) + ': ' +
        (name && name !== '-' ? name : L('Schlüssel ', 'key ') + txt(cells[1]) + L(' (ohne Namen)', ' (unnamed)'));
    } },
    // Monaco-Editor im Code-Reiter (Kimi lässt das englische „Editor content“ stehen)
    { sel: '.monaco-code-viewer .native-edit-context[role=textbox], .monaco-code-viewer textarea.inputarea', force: true,
      label: el => L('Code von ', 'Code of ') + previewName(el) },
  ];

  // Elemente, die schon von Haus aus bedienbar sind
  const NATIVE_SEL = 'a[href],button,input,select,textarea,summary,[contenteditable="true"],[role=button],[role=link],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=tab],[role=option],[role=switch],[role=checkbox],[role=radio],[role=combobox],[role=treeitem],[role=slider]';
  const KEY_ROLES = new Set(['button', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'option', 'switch', 'checkbox', 'radio', 'treeitem']);

  const txt = el => (el ? (el.innerText || el.textContent || '') : '').replace(/\s+/g, ' ').trim();
  const fileName = row => (row && (row.querySelector('.file-folder-item-name')?.getAttribute('title') || txt(row.querySelector('.file-folder-item-name')))) || L('Datei', 'File');
  const previewName = el => {
    const p = el.closest('.file-preview')?.querySelector('.file-preview-path');
    if (!p) return L('Datei', 'File');
    const parent = txt(p.querySelector('.file-preview-path-parent'));
    return txt(p).slice(parent.length).trim() || txt(p);
  };
  const isVisible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

  function humanize(name) {
    return name.replace(/_(a|b|f|cl|s)$/i, '').replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  }

  function iconLabel(el) {
    const svg = el.matches('svg') ? el : el.querySelector('svg[name]');
    const n = svg && svg.getAttribute('name');
    if (!n) return '';
    return ICON_LABELS[n]?.[DE ? 0 : 1] || humanize(n);
  }

  function hasName(el) {
    if (el.getAttribute('aria-label')?.trim()) return true;
    if (el.getAttribute('aria-labelledby')) return true;
    if (txt(el)) return true;
    if (el.querySelector('img[alt]:not([alt=""])')) return true;
    return false;
  }

  function deriveName(el) {
    return (
      el.getAttribute('title') ||
      el.getAttribute('data-tooltip') ||
      el.getAttribute('data-testid')?.replace(/[-_]/g, ' ') ||
      iconLabel(el) ||
      el.querySelector('img[alt]')?.alt ||
      ''
    ).trim();
  }

  // Attribut nur setzen, wenn es sich ändert (verhindert Mutations-Schleifen)
  function setAttr(el, k, v) { if (el.getAttribute(k) !== v) el.setAttribute(k, v); }
  function describeBy(el, desc) {
    if (!desc) return;
    if (!desc.id) desc.id = 'ka-d-' + Math.random().toString(36).slice(2, 8);
    setAttr(el, 'aria-describedby', desc.id);
  }

  function makeOperable(el, role, { noKey = false } = {}) {
    if (!el.closest(NATIVE_SEL) || el.hasAttribute('data-ka')) {
      // SVG-Icons bringen role="img" mit – wenn das Icon selbst klickbar ist, überschreiben
      if (role && (!el.getAttribute('role') || (el.tagName.toLowerCase() === 'svg' && el.getAttribute('role') === 'img'))) setAttr(el, 'role', role);
      if (!noKey && KEY_ROLES.has(el.getAttribute('role')) && !el.hasAttribute('tabindex')) setAttr(el, 'tabindex', '0');
      setAttr(el, 'data-ka', '1');
    }
  }

  function label(el, name, force) {
    if (!name) return;
    if (force || !hasName(el)) setAttr(el, 'aria-label', name);
  }

  // Deaktivierte Klickflächen (Kimi markiert sie per Klasse/Opacity)
  function syncDisabled(el) {
    if (el.matches('.send-button-container.stop')) return;
    const cls = el.className && typeof el.className === 'string' ? el.className : '';
    const disabled = /(^|\s)(\S*-)?disabled(\s|$)/.test(cls) || el.getAttribute('disabled') !== null;
    if (disabled) setAttr(el, 'aria-disabled', 'true');
    else if (el.getAttribute('aria-disabled') === 'true' && el.hasAttribute('data-ka')) el.removeAttribute('aria-disabled');
  }

  // Kimi setzt aria-disabled auf Wrapper-divs (deaktivierte Kontextmenü-Auslöser);
  // Chrome vererbt das an alle Knöpfe darin → die wirken für Screenreader tot.
  function fixInheritedDisabled(root) {
    for (const el of root.querySelectorAll('[aria-disabled=true]:not([data-ka]):not(button):not([role])')) {
      if (!el.querySelector('button,a[href],[role=button],[role=link],[role=menuitem]')) continue;
      for (const a of ['aria-disabled', 'aria-haspopup', 'aria-expanded', 'aria-controls']) el.removeAttribute(a);
    }
  }
  function syncAllDisabled() { for (const el of document.querySelectorAll('[data-ka]')) syncDisabled(el); }

  // ---------------------------------------------------------------------------
  // Durchläufe
  // ---------------------------------------------------------------------------
  function applyRules(root) {
    for (const r of RULES) {
      let list;
      try { list = root.querySelectorAll(r.sel); } catch { continue; }
      for (const el of list) {
        if (r.hide) { setAttr(el, 'aria-hidden', 'true'); setAttr(el, 'tabindex', '-1'); setAttr(el, 'data-ka-hidden', '1'); continue; }
        // plain: hat cursor:pointer, ist aber nicht bedienbar → normaler Text bleiben
        if (r.plain) { for (const a of ['role', 'tabindex', 'data-ka']) el.removeAttribute(a); setAttr(el, 'data-ka-plain', '1'); continue; }
        if (r.role) { makeOperable(el, r.role, r); syncDisabled(el); }
        const name = typeof r.label === 'function' ? r.label(el) : r.label;
        label(el, name, r.force);
        if (r.apply) r.apply(el);
      }
    }
  }

  // Heuristik: alles mit cursor:pointer, das nicht schon bedienbar ist
  function applyHeuristics(root) {
    const cands = root.querySelectorAll('div,span,p,li,img,svg,label,i,h1,h2,h3,h4,h5,h6');
    for (const el of cands) {
      if (el.closest('#kimiaccess-live') || el.closest(NATIVE_SEL)) {
        if (!el.hasAttribute('data-ka')) continue;
      }
      if (el.closest('[data-ka-hidden], [data-ka-plain]')) continue;
      if (el.parentElement && el.parentElement.closest('[data-ka]') && !el.hasAttribute('data-ka')) continue;
      if (el.closest('.markdown, .markdown-container, [class*=markdown], .cm-editor, .xterm, canvas')) continue;
      const cs = getComputedStyle(el);
      if (cs.cursor !== 'pointer') continue;
      if (el.parentElement && getComputedStyle(el.parentElement).cursor === 'pointer') continue;
      if (!isVisible(el)) continue;
      // Ein Kind, das selbst schon natives Bedienelement ist (z. B. <button> in Karte) → Container nicht zum Button machen
      if (el.querySelector(NATIVE_SEL.replace(/,\[contenteditable="true"\]/, ''))) continue;
      makeOperable(el, el.tagName === 'A' ? 'link' : 'button');
      label(el, deriveName(el));
      syncDisabled(el);
    }
  }

  // Native Bedienelemente ohne Namen (Buttons nur mit Icon, Links nur mit Bild)
  function fixNativeNames(root) {
    for (const el of root.querySelectorAll('button,a[href],[role=button],[role=menuitem],[role=tab],[role=link]')) {
      if (hasName(el)) continue;
      label(el, deriveName(el));
    }
    // Icons in benannten Bedienelementen sind Dekoration
    for (const svg of root.querySelectorAll('svg.iconify[role=img]:not([aria-hidden])')) {
      if (svg.hasAttribute('data-ka')) continue; // das SVG ist selbst der Knopf
      const host = svg.parentElement?.closest('[data-ka],button,a,[role=button],[role=menuitem],[role=link]');
      if (host) setAttr(svg, 'aria-hidden', 'true');
    }
    for (const img of root.querySelectorAll('[role=menuitem] img[alt], button img[alt], [role=button] img[alt], a[href] img[alt]')) {
      const host = img.closest('[role=menuitem],button,[role=button],a[href]');
      if (txt(host)) setAttr(img, 'aria-hidden', 'true');
    }
    // Bilder ohne alt: dekorativ, außer sie sind selbst die Klickfläche
    for (const img of root.querySelectorAll('img:not([alt])')) setAttr(img, 'alt', '');
  }

  // Eingabefelder (Lexical/ProseMirror contenteditable) ohne Namen
  function fixInputs(root) {
    for (const ed of root.querySelectorAll('[contenteditable="true"],textarea,input:not([type=hidden])')) {
      if (ed.closest('[aria-hidden=true]')) continue; // z. B. Monacos IME-Hilfsfeld
      if (ed.getAttribute('aria-label') || [...(ed.labels || [])].some(l => txt(l))) continue;
      let ph = ed.getAttribute('placeholder') || ed.getAttribute('data-placeholder') || '';
      for (let box = ed.parentElement, i = 0; !ph && box && i < 4; box = box.parentElement, i++) {
        ph = txt(box.querySelector('[class*=placeholder]'));
      }
      if (!ph && !ed.isContentEditable) {
        // Rückfall: Feldbeschriftung in der Nähe oder Titel des umgebenden Dialogs
        const near = ed.closest('[class*=form-item], [class*=field], .settings-row')?.querySelector('label, [class*=label]');
        const dlg = ed.closest('[role=dialog]');
        ph = txt(near) || (dlg && txt(document.getElementById(dlg.getAttribute('aria-labelledby')))) || '';
      }
      if (ed.isContentEditable) label(ed, ph ? L('Nachricht: ', 'Message: ') + ph : L('Nachricht an Kimi', 'Message to Kimi'));
      else label(ed, ph || ed.getAttribute('name') || '', true);
      if (ed.isContentEditable) {
        setAttr(ed, 'role', 'textbox');
        setAttr(ed, 'aria-multiline', 'true');
      }
    }
  }

  // Dialoge: role=dialog, aria-modal, Titel, Fokus hinein und zurück
  // Kimi legt alle Modals in eine .modal-mask; die Maske selbst wird zum Dialog
  const DIALOG_SEL = '.modal-mask, .modal-container, .modal-content, .km-modal, .kimi-modal, .create-kimi-claw-modal, .drawer-content';
  let lastFocusBeforeDialog = null;
  // Kimi setzt den Fokus oft selbst in den Dialog (autofocus), bevor fixDialogs läuft →
  // das zuletzt fokussierte Element außerhalb von Dialogen laufend mitschreiben
  let lastFocusOutside = null;
  document.addEventListener('focusin', e => {
    if (!e.target.closest?.(DIALOG_SEL + ', [role=dialog], [role=alertdialog]')) lastFocusOutside = e.target;
  }, true);
  const openDialogs = new Set();
  let focusContexts = []; // Container um den Auslöser, innen nach außen
  function restoreDialogFocus() {
    const a = document.activeElement;
    if (a && a !== document.body && a.isConnected && isVisible(a)) return; // Kimi hat den Fokus selbst gesetzt
    if (lastFocusBeforeDialog?.isConnected) {
      lastFocusBeforeDialog.focus({ preventScroll: true });
      // Kimi entfernt die gelöschte Zeile oft erst nach dem Schließen → nachprüfen
      const t = lastFocusBeforeDialog;
      for (const ms of [600, 1500, 3000]) setTimeout(() => {
        if (!t.isConnected && openDialogs.size === 0 && (document.activeElement === document.body || !document.activeElement)) restoreDialogFocus();
      }, ms);
      return;
    }
    // Auslöser ist weg (gelöschte Zeile) → erstes Bedienelement der nächstgelegenen Umgebung
    for (const c of focusContexts) {
      if (!c.isConnected) continue;
      const f = [...c.querySelectorAll('button:not([disabled]), a[href], input:not([type=hidden]), [tabindex="0"]')].find(isVisible);
      if (f) { f.focus({ preventScroll: true }); return; }
    }
  }
  function fixDialogs(root) {
    for (const d of document.querySelectorAll(DIALOG_SEL)) {
      if (!isVisible(d) || d.parentElement?.closest('[role=dialog],[role=alertdialog]')) continue;
      if (!d.getAttribute('role')) setAttr(d, 'role', 'dialog');
      setAttr(d, 'aria-modal', 'true');
      const title = [...d.querySelectorAll('.title, h1, h2, h3, h4, [class*=title]')].find(t => isVisible(t) && txt(t));
      if (title && !d.getAttribute('aria-label')) {
        if (!title.id) title.id = 'ka-t-' + Math.random().toString(36).slice(2, 8);
        setAttr(d, 'aria-labelledby', title.id);
      }
      const body = d.querySelector('.body, [class*=content]:not([class*=title])');
      if (body && body !== d && txt(body).length < 600) {
        if (!body.id) body.id = 'ka-d-' + Math.random().toString(36).slice(2, 8);
        setAttr(d, 'aria-describedby', body.id);
      }
      if (!openDialogs.has(d)) {
        openDialogs.add(d);
        // Bei einem Folgedialog (z. B. „API-Key speichern“ nach „Erstellen“) bleibt der
        // ursprüngliche Auslöser erhalten, weil der Fokus zwischendurch nur in Dialogen war
        if (openDialogs.size === 1 && lastFocusOutside?.isConnected) {
          lastFocusBeforeDialog = lastFocusOutside;
          // Umgebung merken: nach „Löschen“ verschwindet die Zeile samt Auslöser
          focusContexts = [];
          for (let c = lastFocusOutside.parentElement; c && c !== document.body; c = c.parentElement) {
            if (c.matches('table, [role=list], ul, ol, section, [class*=section], main')) focusContexts.push(c);
          }
        }
        if (!d.contains(document.activeElement)) {
          // Eingabefeld, sonst den Dialog selbst – nie automatisch auf „Löschen“/„Bestätigen“
          const f = [...d.querySelectorAll('textarea, input:not([type=hidden]):not([type=file]), [contenteditable=true]')].find(isVisible)
            || d.querySelector('.xterm-helper-textarea');
          if (!d.hasAttribute('tabindex')) d.setAttribute('tabindex', '-1');
          setTimeout(() => (f || d).focus({ preventScroll: true }), 50);
        }
      }
    }
    for (const d of [...openDialogs]) {
      if (!d.isConnected || !isVisible(d)) {
        openDialogs.delete(d);
        if (openDialogs.size === 0) restoreDialogFocus();
      }
    }
  }

  // Nicht-modale Popover (z. B. „Teilen“ einer Website): Kimi lässt den Fokus beim
  // Öffnen auf dem Auslöser und beim Schließen auf <body> fallen
  const openPopovers = new Map(); // Popover → Auslöser
  function fixPopovers() {
    for (const p of document.querySelectorAll('.kimi-popover-positioner[role=dialog]')) {
      if (openPopovers.has(p) || !isVisible(p)) continue;
      const trigger = p.id ? document.querySelector(`[aria-controls="${p.id}"]`) : null;
      openPopovers.set(p, trigger);
      // nur wenn der Nutzer es gerade über den Auslöser geöffnet hat (kein Hover-Popover)
      if (trigger && trigger.contains(document.activeElement)) {
        // Inhalt wird beim Einblenden noch ausgetauscht → einige Male versuchen
        let tries = 0;
        const go = () => {
          if (!p.isConnected || p.contains(document.activeElement) || !trigger.contains(document.activeElement)) return;
          const f = [...p.querySelectorAll('button, a[href], input:not([type=hidden]), [tabindex="0"]')].find(isVisible);
          if (f) f.focus({ preventScroll: true });
          if (!p.contains(document.activeElement) && ++tries < 10) setTimeout(go, 100);
        };
        setTimeout(go, 50);
      }
    }
    for (const [p, trigger] of openPopovers) {
      if (p.isConnected && isVisible(p)) continue;
      openPopovers.delete(p);
      const a = document.activeElement;
      if ((!a || a === document.body || !a.isConnected) && trigger?.isConnected) trigger.focus({ preventScroll: true });
    }
  }

  // Schwebende Menüs (Popover/Dropdown) als Menü kennzeichnen
  function fixMenus(root) {
    for (const m of root.querySelectorAll('[role=menu]')) {
      for (const it of m.querySelectorAll('div,li,span')) {
        if (it.getAttribute('role') || it.closest('[role=menu]') !== m) continue;
        // nur echte Einträge: Klassen-Token endet auf menu-item/option, kein Container mit Rollen darin
        const tokens = typeof it.className === 'string' ? it.className.split(/\s+/) : [];
        if (!tokens.some(t => /(^|-)(menu-item|option|dropdown-item)$/.test(t))) continue;
        if (it.querySelector('[role]:not(svg):not(img)')) continue;
        makeOperable(it, 'menuitem');
        label(it, deriveName(it));
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Live-Regionen: Fortschritt, Toasts, Antworten
  // ---------------------------------------------------------------------------
  let politeEl, assertiveEl;
  function ensureLive() {
    if (politeEl && politeEl.isConnected) return;
    const wrap = document.createElement('div');
    wrap.id = 'kimiaccess-live';
    wrap.style.cssText = 'position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;';
    politeEl = document.createElement('div'); politeEl.setAttribute('aria-live', 'polite'); politeEl.setAttribute('role', 'status');
    assertiveEl = document.createElement('div'); assertiveEl.setAttribute('aria-live', 'assertive'); assertiveEl.setAttribute('role', 'alert');
    wrap.append(politeEl, assertiveEl);
    document.body.appendChild(wrap);
  }
  let lastSaid = '', lastSaidAt = 0;
  function announce(msg, assertive = false) {
    msg = (msg || '').trim();
    if (!msg) return;
    const now = Date.now();
    if (msg === lastSaid && now - lastSaidAt < 3000) return;
    lastSaid = msg; lastSaidAt = now;
    ensureLive();
    const el = assertive ? assertiveEl : politeEl;
    el.textContent = '';
    setTimeout(() => { el.textContent = msg; }, 60);
    // Verlauf der letzten Ansagen (für Tests/Fehlersuche)
    const wrap = el.parentElement, log = JSON.parse(wrap.dataset.log || '[]');
    log.push(msg.slice(0, 300)); wrap.dataset.log = JSON.stringify(log.slice(-15));
  }

  // Text-Elemente beobachten, deren Inhalt sich ändert und angesagt werden soll
  const WATCH_TEXT = [
    { sel: '.avatar-subtitle, .avatar-title, .bot-intro-operation-tip, .typing-indicator__status', assertive: false },
    { sel: '.km-message, .km-toast, [class*=message-notice], [class*=toast], .kimi-message', assertive: false, toast: true },
  ];
  const seenText = new WeakMap();
  function watchTexts(root) {
    for (const w of WATCH_TEXT) {
      for (const el of document.querySelectorAll(w.sel)) {
        if (el.closest('#kimiaccess-live')) continue;
        if (w.toast && el.parentElement?.closest(w.sel)) continue;
        const t = txt(el);
        if (t && seenText.get(el) !== t) { seenText.set(el, t); if (isVisible(el)) announce(t, w.assertive); }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Tastatur: Enter/Leertaste lösen unsere Ersatz-Buttons aus
  // ---------------------------------------------------------------------------
  function synthClick(el) {
    const r = el.getBoundingClientRect();
    const o = { bubbles: true, cancelable: true, composed: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0 };
    el.dispatchEvent(new PointerEvent('pointerdown', { ...o, pointerType: 'mouse', isPrimary: true }));
    el.dispatchEvent(new MouseEvent('mousedown', o));
    el.dispatchEvent(new PointerEvent('pointerup', { ...o, pointerType: 'mouse', isPrimary: true }));
    el.dispatchEvent(new MouseEvent('mouseup', o));
    el.dispatchEvent(new MouseEvent('click', o)); // SVG-Elemente haben kein .click()
  }
  // Zustände wie input.checked ändern sich ohne DOM-Mutation → nach jeder Bedienung neu abgleichen
  // (nicht bei jedem Tastendruck im Eingabefeld – dort ändert sich kein Zustand)
  for (const ev of ['click', 'change', 'keyup']) {
    document.addEventListener(ev, e => {
      if (ev === 'keyup' && (e.target.isContentEditable || e.target.matches?.('input,textarea'))) return;
      setTimeout(() => run(), 120);
    }, true);
  }

  document.addEventListener('keydown', e => {
    const el = e.target;
    if (!(el instanceof HTMLElement) || !el.hasAttribute('data-ka')) return;
    if (el.matches('button,a[href],input,textarea,select')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (el.getAttribute('aria-disabled') === 'true') return;
      e.preventDefault(); e.stopPropagation();
      synthClick(el);
    }
  }, true);

  // ---------------------------------------------------------------------------
  // Tastenkürzel (Alt+Umschalt, auf dem Mac Option+Umschalt; e.code, weil
  // Option auf dem Mac Sonderzeichen in e.key erzeugt)
  // ---------------------------------------------------------------------------
  function topDialog() {
    const ds = [...document.querySelectorAll('[role=dialog]')].filter(isVisible);
    return ds[ds.length - 1] || null;
  }
  function closeButtonIn(root) {
    if (!root) return null;
    const cands = [...root.querySelectorAll('[aria-label*="chließen"], [aria-label^="Close" i], [data-ka] svg[name^="Close"], button svg[name^="Close"], svg[name^="Close"], [data-testid$=cancel]')];
    for (const c of cands) {
      const el = c.closest('[data-ka],button,[role=button]') || c;
      if (isVisible(el)) return el;
    }
    return null;
  }
  function closeTop() {
    const d = topDialog();
    const panel = document.querySelector('.bot-panel, .bot-file-panel, [class*=side-panel]');
    const btn = closeButtonIn(d) || closeButtonIn(panel);
    if (btn) { synthClick(btn); announce(L('Geschlossen', 'Closed')); return true; }
    announce(L('Nichts zum Schließen', 'Nothing to close'));
    return false;
  }
  function focusInput() {
    const ed = [...document.querySelectorAll('.chat-input [contenteditable=true], [contenteditable=true][role=textbox], [contenteditable=true]')].find(isVisible);
    if (ed) { ed.focus(); return true; }
    announce(L('Kein Eingabefeld gefunden', 'No input field found')); return false;
  }
  const SHORTCUTS = {
    KeyX: [L('Dialog oder Seitenbereich schließen', 'Close dialog or side panel'), closeTop],
    KeyI: [L('Zum Eingabefeld', 'Go to message input'), focusInput],
    KeyL: [L('Letzte Antwort vorlesen', 'Read last answer'), () => readLastAnswer()],
    KeyM: [L('Zur letzten Antwort springen', 'Jump to last answer'), () => focusLastAnswer()],
    KeyS: [L('Antwort stoppen', 'Stop answer'), () => { const b = document.querySelector(`[aria-label="${STOP_LABEL}"]`); if (b) synthClick(b); else announce(L('Keine laufende Antwort', 'No answer in progress')); }],
    KeyH: [L('Tastenkürzel ansagen', 'Announce shortcuts'), () => announce(L('KimiAccess Tastenkürzel, jeweils mit Alt und Umschalt: ', 'KimiAccess shortcuts, each with Alt and Shift: ') +
      Object.entries(SHORTCUTS).map(([k, [d]]) => k.slice(3) + ' ' + d).join('. '))],
  };
  document.addEventListener('keydown', e => {
    if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
    const s = SHORTCUTS[e.code];
    if (!s) return;
    e.preventDefault(); e.stopPropagation();
    s[1]();
  }, true);

  // Escape schließt den obersten Dialog, wenn die Seite es nicht selbst tut (Terminal ausgenommen)
  // Popover ohne Schließen-Knopf (Teilen): Kimi stoppt Escape auf manchen Knöpfen darin →
  // in der Capture-Phase vormerken und notfalls über den Auslöser zuklappen.
  // In Eingabefeldern bricht Escape nur die Bearbeitung ab.
  let swallowedEsc = null; // Escape, das nie bis window (Bubble-Phase) durchkam
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const pop = e.target.closest?.('.kimi-popover-positioner[role=dialog]');
    if (!pop || e.target.matches('input,textarea')) return;
    swallowedEsc = e;
    setTimeout(() => {
      const t = openPopovers.get(pop);
      if (swallowedEsc === e && pop.isConnected && isVisible(pop) && t?.isConnected) { synthClick(t); t.focus({ preventScroll: true }); }
      swallowedEsc = null;
    }, 150);
  }, true);
  window.addEventListener('keydown', e => { if (e === swallowedEsc) swallowedEsc = null; });
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented || e.target.closest?.('.xterm, .kimi-popover-positioner')) return;
    const d = topDialog();
    if (!d) return;
    setTimeout(() => {
      if (d.isConnected && isVisible(d) && topDialog() === d) { const b = closeButtonIn(d); if (b) synthClick(b); }
    }, 150);
  });

  // Enter in Namensfeldern, auf die Kimi nicht reagiert, löst den Hauptknopf des Dialogs aus
  // (z. B. „Neuen API-Schlüssel erstellen“ in der Kimi-Code-Konsole)
  const ENTER_SUBMIT = '.key-name-input';
  window.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.isComposing || e.defaultPrevented || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    if (!e.target.matches?.(ENTER_SUBMIT)) return;
    const btn = e.target.closest('[role=dialog], .modal-mask')?.querySelector('.modal-actions .kimi-button.primary');
    if (!btn || btn.disabled || !isVisible(btn)) return;
    e.preventDefault();
    btn.click();
  });

  // ---------------------------------------------------------------------------
  // Chat: Nachrichten als Überschrift + Abschnitt, Antworten ansagen
  // ---------------------------------------------------------------------------
  const settings = { speak: 'end', headings: true };
  try {
    chrome.storage?.sync.get(settings, v => Object.assign(settings, v));
    chrome.storage?.onChanged.addListener(ch => { for (const k in ch) settings[k] = ch[k].newValue; });
  } catch { /* außerhalb der Erweiterung */ }

  const SEG_SEL = '.segment.segment-user, .segment.segment-assistant';
  const segId = seg => seg.dataset.msgId || seg.closest('[data-archer-id]')?.dataset.archerId || '';
  // Nur der eigentliche Antworttext – Gedankengang und Werkzeug-Blöcke ausgenommen
  const answerText = seg => {
    const parts = [...seg.querySelectorAll('.segment-content .markdown')]
      .filter(m => !m.closest('.toolcall-container, .toolcall-flow, .thinking-container') && !m.parentElement.closest('.markdown'));
    return parts.map(txt).filter(Boolean).join('\n');
  };
  const lastAnswer = () => [...document.querySelectorAll('.segment.segment-assistant')].filter(segId).pop();
  // Claw zeigt einen Tipp-Indikator, der normale Chat einen Stopp-Knopf
  const isTyping = () => !!document.querySelector('.typing-indicator__status, .typing-indicator, .send-button-container.stop');

  const SR_ONLY = 'position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
  function fixMessages(root) {
    for (const seg of root.querySelectorAll(SEG_SEL)) {
      const user = seg.classList.contains('segment-user');
      const who = user ? L('Du', 'You') : (seg.querySelector('.segment-avatar img')?.alt || 'Kimi');
      if (!segId(seg)) continue;
      for (const img of seg.querySelectorAll('.segment-avatar img')) setAttr(img, 'aria-hidden', 'true');
      if (!settings.headings) { seg.querySelector(':scope > h3[data-ka-own]')?.remove(); continue; }
      {
        // Eigene, unsichtbare Überschrift als erstes Kind (der Avatar ist bei eigenen Nachrichten display:none)
        let h = seg.querySelector(':scope > h3[data-ka-own]');
        if (!h) {
          h = document.createElement('h3');
          h.setAttribute('data-ka-own', '');
          h.style.cssText = SR_ONLY;
          seg.prepend(h);
        }
        if (h.textContent !== who) h.textContent = who;
      }
    }
  }

  // Eine Antwort gilt als neu, wenn sie kurz nach dem Absenden auftaucht.
  // Beim Laden eines Chats nachgeladene ältere Antworten werden so nicht vorgelesen.
  const ansState = new Map();
  let lastSendAt = 0;
  const markSend = () => { lastSendAt = Date.now(); };
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.target.isContentEditable) markSend();
  }, true);
  document.addEventListener('click', e => { if (e.target.closest?.(`.send-button-container, .send-button, [aria-label="${SEND_LABEL}"]`)) markSend(); }, true);
  window.__ka = { ansState, settings, get lastSendAt() { return lastSendAt; } };

  function trackAnswers() {
    for (const seg of document.querySelectorAll('.segment.segment-assistant')) {
      const id = segId(seg);
      if (!id) continue;
      if (ansState.has(id)) continue;
      const fresh = lastSendAt && Date.now() - lastSendAt < 120000;
      ansState.set(id, fresh ? { spoken: 0, text: '', done: false, changed: Date.now() } : { done: true });
      if (fresh && !document.querySelector('.typing-indicator')) announce(L('Kimi antwortet', 'Kimi is answering'));
    }
    const seg = lastAnswer();
    const st = seg && ansState.get(segId(seg));
    if (!st || st.done) return;
    const t = answerText(seg);
    if (t !== st.text) { st.text = t; st.changed = Date.now(); }
    if (settings.speak === 'stream') {
      // Fertige Sätze schon während des Schreibens ansagen
      const upto = Math.max(t.lastIndexOf('. '), t.lastIndexOf('! '), t.lastIndexOf('? '), t.lastIndexOf('\n'));
      if (upto + 1 > st.spoken) { announce(t.slice(st.spoken, upto + 1)); st.spoken = upto + 1; }
    }
  }
  // Regelmäßig prüfen, ob die laufende Antwort fertig ist (Text stabil, kein Tipp-Indikator)
  setInterval(() => {
    const seg = lastAnswer();
    const st = seg && ansState.get(segId(seg));
    if (!st || st.done) return;
    const t = answerText(seg);
    if (t !== st.text) { st.text = t; st.changed = Date.now(); return; }
    if (!t || isTyping() || Date.now() - st.changed < 1500) return;
    st.done = true;
    if (settings.speak === 'off') announce(L('Antwort fertig', 'Answer complete'));
    else {
      const rest = t.slice(settings.speak === 'stream' ? st.spoken : 0).trim();
      if (rest.length > 6000) announce(L(`Antwort fertig, ${t.length} Zeichen. Alt Umschalt M springt hin. `, `Answer complete, ${t.length} characters. Alt Shift M jumps there. `) + rest.slice(0, 1500));
      else announce(rest || L('Antwort fertig', 'Answer complete'));
    }
  }, 700);

  function readLastAnswer() {
    const seg = lastAnswer();
    if (!seg) { announce(L('Keine Antwort gefunden', 'No answer found')); return; }
    announce(answerText(seg) || txt(seg.querySelector('.segment-content')) || L('Leere Antwort', 'Empty answer'));
  }
  function focusLastAnswer() {
    const seg = lastAnswer();
    if (!seg) { announce(L('Keine Antwort gefunden', 'No answer found')); return; }
    const target = seg.querySelector(':scope > h3[data-ka-own]') || seg;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    seg.scrollIntoView({ block: 'start' });
    target.focus();
  }

  // ---------------------------------------------------------------------------
  // Terminal (xterm, DOM-Renderer ohne screenReaderMode): neue Zeilen ansagen
  // ---------------------------------------------------------------------------
  const termState = new WeakMap();
  let lastTermKey = 0;
  document.addEventListener('keydown', e => { if (e.target.classList?.contains('xterm-helper-textarea')) lastTermKey = Date.now(); }, true);
  const termLines = rows => {
    const l = [...rows.children].map(r => r.textContent.replace(/\u00a0/g, ' ').trimEnd());
    while (l.length && !l[l.length - 1]) l.pop();
    return l;
  };
  function diffTerm(rows) {
    const st = termState.get(rows);
    const cur = termLines(rows);
    const prevC = st.prev.slice(0, -1), curC = cur.slice(0, -1);
    let fresh = curC;
    for (let s = 0; s <= prevC.length; s++) {
      const keep = prevC.slice(s);
      if (keep.every((x, i) => curC[i] === x)) { fresh = curC.slice(keep.length); break; }
    }
    const last = cur[cur.length - 1] || '';
    const out = fresh.filter(Boolean);
    // Letzte Zeile (Prompt/Cursor) nur ansagen, wenn nicht gerade getippt wird
    if (last !== (st.prev[st.prev.length - 1] || '') && Date.now() - lastTermKey > 700) out.push(last);
    st.prev = cur;
    if (out.length) announce(out.join('\n'));
  }
  function watchTerminals() {
    for (const rows of document.querySelectorAll('.xterm-rows')) {
      if (termState.has(rows)) continue;
      const st = { prev: termLines(rows), t: 0 };
      termState.set(rows, st);
      new MutationObserver(() => { clearTimeout(st.t); st.t = setTimeout(() => diffTerm(rows), 400); })
        .observe(rows, { subtree: true, childList: true, characterData: true });
    }
  }

  // ---------------------------------------------------------------------------
  // Hauptschleife
  // ---------------------------------------------------------------------------
  function run(root = document.body) {
    if (!root) return;
    try {
      applyRules(root);
      fixInputs(root);
      fixMenus(root);
      applyHeuristics(root);
      fixNativeNames(root);
      fixDialogs(root);
      fixPopovers();
      fixMessages(root);
      syncAllDisabled();
      fixInheritedDisabled(root);
      watchTexts(root);
      watchTerminals();
      trackAnswers();
    } catch (err) { console.warn('[KimiAccess]', err); }
  }

  let scheduled = false;
  const mo = new MutationObserver(muts => {
    // eigene Attribut-Änderungen ignorieren
    if (muts.every(m => m.type === 'attributes' && /^(aria-|role|tabindex|data-ka|alt)/.test(m.attributeName))) return;
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; run(); }, 150);
  });

  function start() {
    run();
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'disabled'] });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  window.__ka.run = run; // für die Testwerkzeuge (Content-Script-Kontext)
  window.__ka.openPopovers = openPopovers;
})();
