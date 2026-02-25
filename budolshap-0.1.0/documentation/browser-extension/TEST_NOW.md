# 🧪 TEST THE EXTENSION NOW

## ⚡ Quick 5-Minute Test

### Step 1: Verify Dev Server is Running
```bash
# Make sure your Next.js dev server is running
# If not, run: npm run dev
```

### Step 2: Test Knowledge Base URL
Open in browser: `http://localhost:3000/documentation/knowledge-base.html`
- ✅ Should load the knowledge base
- ❌ If not, start dev server first

### Step 3: Load Extension in Chrome/Edge

1. **Open Chrome or Edge**

2. **Go to Extensions:**
   - Type in address bar: `chrome://extensions/` (Chrome)
   - Or: `edge://extensions/` (Edge)

3. **Enable Developer Mode:**
   - Toggle switch in **top-right corner**

4. **Load Extension:**
   - Click **"Load unpacked"** button
   - Navigate to: `C:\Program Files\budolshap\browser-extension`
   - Click **"Select Folder"**

5. **Check for Errors:**
   - Look for red error messages
   - Extension should show as "Enabled"
   - Note: Icons are optional - warnings about missing icons are OK

### Step 4: Test the Shortcut! 🎯

1. **Open Google.com** (or any website)

2. **Press:** `Ctrl + Shift + K` (or `Cmd + Shift + K` on Mac)

3. **Expected Result:**
   - ✅ New tab opens
   - ✅ Knowledge Base loads
   - ✅ URL: `http://localhost:3000/documentation/knowledge-base.html`

### Step 5: Test from Different Sites

Try `Ctrl+Shift+K` from:
- ✅ Google.com
- ✅ YouTube.com
- ✅ GitHub.com

**All should open Knowledge Base!**

### Step 6: Test Extension Popup

1. **Find extension icon** in toolbar (or click puzzle icon)
2. **Click the extension**
3. **Click "Open Knowledge Base" button**
4. **Expected:** Knowledge Base opens

## ✅ Success Indicators

If you see these, it's working:
- ✅ Extension loads without critical errors
- ✅ `Ctrl+Shift+K` opens Knowledge Base from Google
- ✅ `Ctrl+Shift+K` works from multiple websites
- ✅ Extension popup shows and works

## 🐛 Troubleshooting

**Extension won't load?**
- Check: Did you select the `browser-extension` folder (not parent)?
- Check: Are all files present? (manifest.json, background.js, popup.html, popup.js)

**Shortcut not working?**
- Go to: `chrome://extensions/shortcuts`
- Find: "BudolShap Knowledge Base Shortcut"
- Verify: `Ctrl+Shift+K` is assigned
- Reassign: If needed, click and set manually

**Knowledge Base doesn't open?**
- Check: Is dev server running? (`npm run dev`)
- Test: Can you open `http://localhost:3000/documentation/knowledge-base.html` manually?
- Fix: Update `useLocal: true` in `background.js` if needed

**Errors in extension?**
- Open: Browser console (F12)
- Check: Error messages
- Verify: All files are in correct location

## 📝 Test Results

After testing, note:
- [ ] Extension loads successfully
- [ ] Shortcut works from Google.com
- [ ] Shortcut works from YouTube.com
- [ ] Extension popup works
- [ ] Any errors encountered?

## 🎉 Ready to Use!

Once tested successfully, you can:
- Use `Ctrl+Shift+K` from **any website**
- Access Knowledge Base instantly
- No need to have BudolShap site open!



