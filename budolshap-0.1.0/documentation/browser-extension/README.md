# BudolShap Knowledge Base Browser Extension

A browser extension that provides global keyboard shortcut access to the BudolShap Knowledge Base from any website.

## Features

- ✅ **Global Keyboard Shortcut**: Press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac) from ANY website
- ✅ **Works in Background**: No need to have the BudolShap site open
- ✅ **Smart Tab Management**: Focuses existing KB tab if already open, otherwise opens new one
- ✅ **Quick Access Button**: Click extension icon for quick access
- ✅ **Context Menu**: Right-click anywhere to open Knowledge Base

## Installation

### For Chrome/Edge (Chromium-based browsers)

1. **Open Extension Management:**
   - Chrome: Go to `chrome://extensions/`
   - Edge: Go to `edge://extensions/`

2. **Enable Developer Mode:**
   - Toggle the "Developer mode" switch in the top right

3. **Load the Extension:**
   - Click "Load unpacked"
   - Navigate to: `documentation/browser-extension/`
   - Select the folder and click "Select Folder"

4. **Verify Installation:**
   - You should see the "BudolShap Knowledge Base Shortcut" extension
   - The extension icon should appear in your toolbar

### For Firefox

1. Go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Navigate to `documentation/browser-extension/`
5. Select `manifest.json`

## Configuration

Edit `background.js` to configure URLs:

```javascript
const CONFIG = {
    localUrl: 'http://localhost:3000/documentation/knowledge-base.html',
    productionUrl: 'https://your-domain.com/documentation/knowledge-base.html',
    useLocal: true  // Set to false for production
};
```

## Usage

### Keyboard Shortcut
- **Windows/Linux**: `Ctrl + Shift + K`
- **Mac**: `Cmd + Shift + K`

Press this combination from **any website** to open the Knowledge Base!

### Extension Icon
- Click the extension icon in your browser toolbar
- Click "Open Knowledge Base" button

### Context Menu
- Right-click anywhere on any webpage
- Select "Open Knowledge Base"

## Creating Extension Icons

The extension needs icon files. You can:

1. **Create simple icons** using an online tool
2. **Use placeholder icons** (create 16x16, 48x48, 128x128 PNG files)
3. **Or use emoji icons** (convert emoji to PNG)

Quick icon creation command (if you have ImageMagick):
```bash
# Create placeholder icons
convert -size 16x16 xc:#667eea icon16.png
convert -size 48x48 xc:#667eea icon48.png
convert -size 128x128 xc:#667eea icon128.png
```

Or create simple colored squares with the knowledge base color (#667eea).

## Troubleshooting

### Shortcut Not Working
1. Check if extension is enabled in `chrome://extensions/`
2. Verify the shortcut isn't conflicting with another extension
3. Try reassigning the shortcut in `chrome://extensions/shortcuts`

### Knowledge Base Not Opening
1. Check the URL in `background.js` is correct
2. Ensure your development server is running (for localhost)
3. Check browser console for errors (F12)

### Extension Not Loading
1. Make sure all files are in the `browser-extension/` folder
2. Verify `manifest.json` is valid JSON
3. Check for errors in the extension management page

## Files Structure

```
browser-extension/
├── manifest.json      # Extension configuration
├── background.js      # Service worker (handles shortcuts)
├── popup.html         # Extension popup UI
├── popup.js           # Popup functionality
├── icon16.png         # 16x16 icon
├── icon48.png         # 48x48 icon
├── icon128.png        # 128x128 icon
└── README.md          # This file
```

## Updating the Extension

1. Make changes to the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Changes will be applied immediately

## Production Deployment

For production use:
1. Update `CONFIG.useLocal = false` in `background.js`
2. Set `productionUrl` to your actual domain
3. Package the extension (optional, for distribution)
4. Or keep it as an unpacked extension for personal use

## Security Notes

- The extension only requires minimal permissions (`tabs`, `activeTab`)
- It doesn't access or modify website content
- It only opens tabs with the Knowledge Base URL
- No data is collected or transmitted

## Browser Compatibility

- ✅ Chrome/Chromium (v88+)
- ✅ Microsoft Edge (v88+)
- ✅ Brave Browser
- ✅ Opera
- ✅ Firefox (with manifest v2 conversion if needed)

## Support

For issues or questions, check:
- Extension error logs in `chrome://extensions/`
- Browser console (F12)
- Knowledge Base access guide



