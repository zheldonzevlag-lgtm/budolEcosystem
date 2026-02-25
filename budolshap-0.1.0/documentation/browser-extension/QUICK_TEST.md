# 🧪 Quick Test Guide

## ✅ Pre-Test Checklist

Before testing, make sure:
- [ ] Your dev server is running (`npm run dev`)
- [ ] Knowledge Base is accessible at: `http://localhost:3000/documentation/knowledge-base.html`
- [ ] Chrome or Edge browser is installed

## 🚀 Quick Test Steps

### 1. Create Icons (Optional but Recommended)

**Method A: Use HTML Tool**
1. Open: `documentation/browser-extension/create-icons.html` in browser
2. Click each "Download" button (icon16.png, icon48.png, icon128.png)
3. Save all 3 files in: `documentation/browser-extension/` folder

**Method B: Skip Icons (Extension will still work)**
- Extension will function without icons, just won't show in toolbar

### 2. Load Extension

1. **Open Chrome/Edge**
2. **Go to:** `chrome://extensions/` (or `edge://extensions/`)
3. **Enable Developer Mode** (toggle top-right)
4. **Click "Load unpacked"**
5. **Navigate to:** 
   ```
   C:\Program Files\budolshap\browser-extension
   ```
6. **Click "Select Folder"**

### 3. Verify Extension Loaded

You should see:
- ✅ "BudolShap Knowledge Base Shortcut" in the list
- ✅ Status: "Enabled"
- ✅ No critical errors (warnings about icons are OK)

### 4. Test Keyboard Shortcut

1. **Open any website** (e.g., `google.com`)
2. **Press:** `Ctrl + Shift + K`
3. **Expected:** Knowledge Base opens in new tab!

### 5. Test Extension Icon

1. **Find extension icon** in toolbar (or click puzzle icon → find it)
2. **Click the icon**
3. **Expected:** Popup appears with "Open Knowledge Base" button
4. **Click button**
5. **Expected:** Knowledge Base opens

### 6. Test from Multiple Sites

Try the shortcut from:
- ✅ Google.com
- ✅ YouTube.com  
- ✅ GitHub.com
- ✅ Any other site

**All should work!** 🎉

## 🐛 Common Issues

### "Manifest file is missing"
- **Fix:** Make sure you selected the `browser-extension` folder, not parent folder

### Shortcut doesn't work
- **Fix:** Go to `chrome://extensions/shortcuts` and verify `Ctrl+Shift+K` is assigned

### Knowledge Base doesn't open
- **Check:** Is dev server running? (`npm run dev`)
- **Check:** Can you open `http://localhost:3000/documentation/knowledge-base.html` manually?
- **Fix:** Update URL in `background.js` if needed

### Extension shows errors
- **Check:** Open browser console (F12) for details
- **Verify:** All files are in `browser-extension/` folder
- **Check:** `manifest.json` is valid JSON

## ✅ Success Criteria

If all these work, extension is ready:
- [ ] Extension loads without errors
- [ ] `Ctrl+Shift+K` works from Google.com
- [ ] `Ctrl+Shift+K` works from YouTube.com
- [ ] Extension icon shows popup
- [ ] Clicking popup button opens KB
- [ ] Opening KB twice focuses existing tab (not duplicates)

## 🎯 Next Steps

Once tested successfully:
1. Keep extension enabled
2. Use `Ctrl+Shift+K` from anywhere!
3. Update `background.js` for production when ready



