# KimiAccess

**English** · [Deutsch](README.de.md)

A browser extension for Chrome and Brave that makes **kimi.ai / kimi.com** (Moonshot AI's Kimi) usable with a screen reader.

Kimi builds many of its controls as plain `<div>`s with click handlers and icons but no accessible name, so screen readers announce nothing, or only "button", for large parts of the interface. KimiAccess adds the missing roles, names, states and keyboard support, and fixes focus handling in dialogs.

> **Language:** the labels the extension adds are **German**, matching Kimi's German interface. Kimi's own texts appear in whatever language you use Kimi in.

## Installation (Chrome or Brave)

1. Download or clone this repository.
2. Open `chrome://extensions` or `brave://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `extension/` folder.
5. Reload kimi.ai.

The extension's toolbar icon, "KimiAccess", opens its settings (how answers are read aloud, message headings).

After updating the files, click the reload button of KimiAccess on the extensions page and reload the Kimi tab.

## What it does

- **Labels unlabeled controls.** Clickable `<div>`s get a role (button, switch, menu item, link), are added to the tab order and can be activated with Enter/Space. Names come from targeted rules, from tooltips or from the icon name (`<svg name="…">`).
- **Regular chat:** a heading before every message ("Du" / "Kimi") for navigating with H. Message actions get names (copy answer, regenerate, share, good/bad answer). Reasoning blocks are collapsible with expanded/collapsed state. Code blocks get "copy Python code". The chat options menu in the header is labeled. The stop button is named correctly and no longer reported as disabled.
- **Reading answers aloud:** announces "Kimi antwortet" (Kimi is answering) when an answer starts and reads the finished answer without the reasoning when it ends. Optionally reads sentence by sentence while it is being written, or stays silent.
- **Kimi Claw (`/bot`):** terminal, files and settings icons in the header, all entries of the settings panel, online status, and copying the bot ID. File tree with file names ("AGENTS.md herunterladen", i.e. download AGENTS.md). Suggestions in the chat. Status messages during startup ("Kimi Claw wacht auf", "Connecting services…") and "thinking" / "typing" are announced.
- **Claw terminal:** new output is announced, because xterm runs there without screen reader mode. Focus moves into the input when the terminal opens. Escape stays with the terminal (for vim, less etc.); use Alt+Shift+X to close it.
- **Dialogs:** all Kimi modals are exposed as dialogs with title and description. Focus moves into the dialog when it opens: into an input field, otherwise onto the dialog itself, **never automatically onto "Delete"**. When the dialog closes, focus returns to where you were, also across follow-up dialogs. If the trigger is gone (for example a deleted table row), focus lands on the first control of the surrounding table or section. Escape closes dialogs.
- **Settings pages:** toggles (hidden checkboxes) are exposed as real switches with state and description, plus "change profile picture" and a labeled search field.
- **Slides:** style cards are exposed as a list, labeled "Preview …" / "Recreate …".
- **Websites (Kimi's website builder):** Kimi's interface has **no central list** of hosted websites. Kimi's API does have `WebsitePublishService/ListWebsites`, but the web app never calls it. Each website lives in the chat it was built in: version cards in the chat, plus the console on the right (Preview, Code, Database, Storage, Settings, Share). KimiAccess:
  - adds the site and version to the card buttons ("Vorschau: MySite V4", "Wiederherstellen: MySite V1", i.e. Preview/Restore) and turns the published URL into a link;
  - stops treating the "V3" version badge as a button, since it only shows a hover tooltip;
  - marks the active console tab and the selected database table as pressed, names the data table, labels the code editor as "Code von <file>" and names the preview iframe;
  - in the Share popover, includes the current access level and the domain in the names, moves focus in on open and back to "Share" on close, and makes Escape close it from every control.
- **Kimi Code console (`/code/console`):** pressing Enter in the name field of the create API key dialog now creates the key. Kimi itself only reacts to the "Create" button there, so Enter silently did nothing. The key table is named, and each row's buttons include the key name ("Löschen: My server", i.e. Delete). Focus returns to "create API key" after Done, Cancel or Escape.
- **Sidebar:** "Optionen für <chat title>" (options for …) instead of a row of identical "More" buttons. It also fixes a Kimi bug where a wrapper with `aria-disabled` made "More", "Collapse" and "Customize sidebar" appear disabled.

## Keyboard shortcuts

All with **Alt + Shift** (Mac: **Option + Shift**):

| Key | Function |
|---|---|
| I | Go to the message input |
| L | Read the last answer aloud |
| M | Jump to the last answer |
| S | Stop the answer |
| X | Close the dialog or side panel (also from inside the terminal) |
| H | Announce the shortcuts |

## Known limitation: Claw chat channels

The **"Channels"** section of Kimi Claw ("connect channel": DingTalk, Lark/Feishu, QQ, WeChat, WeCom) is **compiled out** of the kimi.ai web build. The compiled code always renders an empty placeholder in its place. This is not a screen reader problem: the channels are invisible to everyone on kimi.ai, and the extension cannot label what the page never renders. All five channels are Chinese messengers, so the feature is most likely only built into the Chinese edition (kimi.com / kimi.moonshot.cn). The extension runs there too; those domains are in the manifest. You can set up a Telegram bot or similar in the Claw through the chat or the terminal (OpenClaw configuration).

## Development and testing

`tools/` contains the scripts used to test the extension in **Chrome for Testing**, started with `--remote-debugging-port=9333 --load-extension=extension` and its own profile:

- `node tools/reload.mjs` reloads the extension and the Kimi tab.
- `tools/check.sh` lists clickable elements without a role and unnamed nodes in the accessibility tree. The goal is both lists empty.
- `tools/probe.sh '<JS click>'` clicks something and shows what is new in the accessibility tree.
- `node tools/cdp.mjs eval|ax|shot|nav|type|key …` is the general CDP tool. With `EXT=1`, `eval` runs in the content script's context.
- `node tools/key.mjs KeyL` sends Alt+Shift+key and shows focus and the live announcement.
- `node tools/watchclick.mjs '<selector>'` performs a real mouse click and logs network requests, console output, exceptions and newly opened dialogs.

The most recent announcements are logged in `#kimiaccess-live[data-log]`.

Kimi changes its interface frequently. If something stops being labeled, `tools/check.sh` usually shows where, and most fixes are a single entry in the `RULES` list at the top of `extension/content.js`.

## Disclaimer

KimiAccess is an independent community project and is not affiliated with or endorsed by Moonshot AI. It only changes how the page is exposed to assistive technology. It sends no data anywhere and stores only its own settings (`chrome.storage.sync`).
