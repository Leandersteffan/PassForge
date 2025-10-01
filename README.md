# PassForge - Password Generator and Strength Checker

PassForge is a **privacy-first Chrome/Edge extension** that helps you create and use strong passwords, right where you need them.  
It runs entirely in your browser: no network requests, no analytics, no data collection.

## ✨ Features
- **Password Generator**  
  Generate secure, random passwords with configurable length and character sets (uppercase, lowercase, digits, symbols). Uses the Web Crypto API for true randomness.

- **Strength Checker**  
  Real-time feedback on password strength with entropy estimation (bits), detection of common passwords, and penalties for patterns, repeats, and sequences.

- **Popup Interface**  
  Access the generator and strength checker directly from the extension toolbar.

- **Inline Badge**  
  See password strength feedback directly next to password fields on any website. One click inserts a secure password automatically.

## Privacy
PassForge processes everything **locally in your browser**.  
- No data is ever sent anywhere.  
- Required permissions are minimal:  
  - `clipboardWrite` - copy generated passwords when you click **Copy**  
  - `<all_urls>` - injects the inline badge only to show strength feedback on password fields  

## Installation
The extension is **available in the Chrome Web Store**.  
For development or testing:
1. Clone this repository.  
2. Open `chrome://extensions` (or `edge://extensions`).  
3. Enable **Developer mode**.  
4. Click **Load unpacked** and select the `passforge/` folder.

## Development
- `manifest.json` - Extension configuration  
- `popup/` - Toolbar popup UI (HTML, CSS, JS)  
- `content/` - Inline badge injected into password fields  
- `common/strength.js` - Shared logic for scoring and generation  
- `assets/` - Icons  

## Roadmap
- Options page for default generator settings (length, symbols, etc.)  
- Badge positioning options (above or beside the field)  
- More advanced strength checks (reversed sequences, extended common password list)  
- Accessibility improvements (ARIA labels, keyboard navigation)  

## 📄 License
MIT License — see [LICENSE](LICENSE) for details.
