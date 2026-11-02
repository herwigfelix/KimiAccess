# KimiAccess

[English](README.md) · **Deutsch**

Browser-Erweiterung für Chrome und Brave, die **kimi.ai / kimi.com** für Screenreader bedienbar macht.

> **Sprache:** Beschriftungen, Ansagen und das Einstellungsfenster richten sich nach der **Browsersprache**: Deutsch, wenn der Browser auf Deutsch eingestellt ist, sonst Englisch. Kimis eigene Texte erscheinen in der Sprache, die in Kimi eingestellt ist.

## Installation (Chrome oder Brave)

1. `chrome://extensions` bzw. `brave://extensions` öffnen.
2. **Entwicklermodus** einschalten (Schalter oben rechts).
3. **Entpackte Erweiterung laden** und den Ordner `extension/` auswählen.
4. kimi.ai neu laden.

Über das Erweiterungssymbol „KimiAccess“ in der Symbolleiste öffnen sich die Einstellungen.

## Was das Plugin macht

- **Beschriftet unbeschriftete Bedienelemente.** Kimi baut viele Knöpfe als `<div>` mit Klick-Handler. Das Plugin gibt ihnen eine Rolle (Knopf, Schalter, Menüeintrag, Link), nimmt sie in die Tab-Reihenfolge auf und macht sie per Enter/Leertaste bedienbar. Namen kommen aus gezielten Regeln, aus Tooltips oder aus dem Icon-Namen (`<svg name="…">`).
- **Normaler Chat:** Überschrift vor jeder Nachricht („Du“ / „Kimi“) für die Navigation mit H. Benannte Aktionen (Antwort kopieren, neu generieren, teilen, gute/schlechte Antwort). Gedankengang-Blöcke mit Auf/Zu-Zustand. Codeblöcke mit „Python-Code kopieren“. Chat-Optionen-Menü in der Kopfzeile. Stopp-Knopf richtig benannt und nicht mehr fälschlich als deaktiviert gemeldet.
- **Antworten vorlesen:** „Kimi antwortet“ beim Start, die fertige Antwort ohne Gedankengang am Ende. Wahlweise satzweise schon während des Schreibens oder gar nicht.
- **Kimi Claw (`/bot`):** Terminal-, Dateien- und Einstellungs-Symbol in der Kopfzeile, alle Einträge des Einstellungs-Panels, Online-Status, Bot-ID kopieren. Dateibaum mit Dateinamen („AGENTS.md herunterladen“). Vorschläge im Chat. Statusmeldungen beim Hochfahren („Kimi Claw wacht auf“, „Connecting services…“) und „Denke nach“ / „Tippt…“ werden angesagt.
- **Terminal des Claws:** Neue Ausgaben werden angesagt (xterm läuft dort ohne Screenreader-Modus). Der Fokus geht beim Öffnen in die Eingabe. Escape bleibt beim Terminal (für vim, less usw.), zum Schließen dient Alt+Umschalt+X.
- **Dialoge:** Alle Kimi-Modals werden als Dialog mit Titel und Beschreibung ausgezeichnet. Der Fokus geht beim Öffnen hinein (in ein Eingabefeld, sonst auf den Dialog selbst, **nie automatisch auf „Löschen“**) und beim Schließen zurück, auch über Folgedialoge hinweg. Ist der Auslöser verschwunden (gelöschte Zeile), landet er auf dem ersten Bedienelement der Umgebung, also der Tabelle oder des Abschnitts. Escape schließt.
- **Einstellungsseiten:** Die Schalter (versteckte Checkboxen) werden als echte Schalter mit Zustand und Beschreibung ausgegeben. Dazu kommen „Profilbild ändern“ und ein benanntes Suchfeld.
- **Folien:** Stilkarten als Liste, „Vorschau …“ bzw. „… nachmachen“.
- **Websites („App erstellen“ / Agent):** Kimi hat in der Oberfläche **keine zentrale Liste** der gehosteten Websites (die API kennt zwar `WebsitePublishService/ListWebsites`, die Seite nutzt sie aber nirgends). Jede Website lebt in dem Chat, in dem sie gebaut wurde: Versionskarten im Chat und die Konsole rechts (Vorschau, Code, Datenbank, Speicher, Einstellungen, Teilen). Das Plugin benennt die Kartenknöpfe mit Website und Version („Vorschau: MeineSeite V4“, „Wiederherstellen: MeineSeite V1“) und macht den veröffentlichten Link zu einem Link. Die Versionsmarke „V3“ gilt nicht mehr als Knopf, sie ist nur ein Hover-Tooltip. Außerdem: aktiver Konsolen-Reiter und ausgewählte Datenbanktabelle als „gedrückt“, Datentabelle mit Namen, Code-Editor als „Code von <Datei>“, Vorschau-Iframe benannt, „Dateien dieses Chats (4)“ statt „4“. Im Teilen-Fenster steht der aktuelle Zugriff im Namen („Wer kann zugreifen: Jeder mit dem Link“), und die Domain wird angesagt. Der Fokus geht beim Öffnen hinein und beim Schließen zurück auf „Teilen“, und Escape schließt das Fenster von jedem Knopf aus.
- **Kimi-Code-Konsole (`/code/console`):** Enter im Namensfeld von „Neuen API-Schlüssel erstellen“ erstellt den Schlüssel (Kimi selbst reagiert dort nur auf den Knopf „Neu erstellen“, Enter tat nichts). Die Schlüsseltabelle heißt „API-Schlüssel“, und die Knöpfe je Zeile nennen den Schlüssel („Löschen: Mein Server“). Nach „Fertig“, „Abbrechen“ oder Escape geht der Fokus zurück auf „API-Schlüssel erstellen“, nach dem Löschen eines Schlüssels auf den ersten Knopf der Tabelle (oder auf „API-Schlüssel erstellen“, wenn sie leer ist).
- **Seitenleiste:** „Optionen für <Chat-Titel>“ statt viermal „Mehr“. Außerdem korrigiert das Plugin einen Kimi-Fehler: Ein Wrapper mit `aria-disabled` hat „Mehr“, „Einklappen“ und „Seitenleiste anpassen“ als deaktiviert erscheinen lassen.

## Tastenkürzel

Alle mit **Alt + Umschalt** (Mac: **Option + Umschalt**):

| Taste | Funktion |
|---|---|
| I | Zum Eingabefeld |
| L | Letzte Antwort vorlesen |
| M | Zur letzten Antwort springen |
| S | Antwort stoppen |
| X | Dialog oder Seitenbereich schließen (auch aus dem Terminal heraus) |
| H | Tastenkürzel ansagen |

## Bekannte Grenze: Chat-Kanäle des Claws

Der Abschnitt **„Kanäle“** mit „Kanal verbinden“ (DingTalk, Lark/Feishu, QQ, WeChat, WeCom) ist in der Web-Version von kimi.ai **fest ausgebaut**. Im kompilierten Code wird an seiner Stelle immer nur ein leerer Platzhalter gerendert (`(C(B),d(``,!0))`). Es liegt also nicht am Screenreader: Die Kanäle sind auf kimi.ai für niemanden sichtbar, und das Plugin kann nichts beschriften, was die Seite nicht anzeigt. Da alle fünf Kanäle chinesische Messenger sind, ist die Funktion vermutlich nur in der chinesischen Ausgabe (kimi.com / kimi.moonshot.cn) eingebaut. Dort würde das Plugin ebenfalls laufen, die Domains sind im Manifest enthalten. Einen Telegram-Bot o. Ä. kann man im Claw über den Chat oder das Terminal einrichten (OpenClaw-Konfiguration).

## Entwicklung und Tests

`tools/` enthält die Werkzeuge, mit denen das Plugin in **Chrome for Testing** (in `.cft/`, gestartet mit `--remote-debugging-port=9333 --load-extension=extension`) geprüft wurde:

- `node tools/reload.mjs` lädt die Erweiterung und den Kimi-Tab neu.
- `tools/check.sh` listet Klickflächen ohne Rolle und unbenannte Knoten im Accessibility-Baum (Ziel: beide leer).
- `tools/probe.sh '<JS-Klick>'` klickt etwas an und zeigt, was neu im Accessibility-Baum ist.
- `node tools/cdp.mjs eval|ax|shot|nav|type|key …` ist das allgemeine CDP-Werkzeug. Mit `EXT=1` läuft `eval` im Kontext des Content-Scripts.
- `node tools/key.mjs KeyL` sendet Alt+Umschalt+Taste und zeigt Fokus und Live-Ansage.

Der Verlauf der letzten Ansagen steht in `#kimiaccess-live[data-log]`.
