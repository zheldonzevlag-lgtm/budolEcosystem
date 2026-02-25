# Testing the Browser Extension

## Step-by-Step Testing Guide

### Step 1: Create Icons First

**Quick Method - Use the HTML Tool:**
1. Open `create-icons.html` in your browser (should open automatically)
2. Click "Download icon16.png"
3. Click "Download icon48.png"  
4. Click "Download icon128.png"
5. Save all three files in: `documentation/browser-extension/`

**Or create simple placeholder icons:**
- Create 3 PNG files (16x16, 48x48, 128x128 pixels)
- Use any color (purple #667eea recommended)
- Name them: `icon16.png`, `icon48.png`, `icon128.png`

### Step 2: Verify Files

Check that these files exist in `documentation/browser-extension/`:
- ✅ manifest.json
- ✅ background.js
- ✅ popup.html
- ✅ popup.js
- ✅ icon16.png (or skip if not created yet)
- ✅ icon48.png (or skip if not created yet)
- ✅ icon128.png (or skip if not created yet)

### Step 3: Load Extension in Chrome/Edge

1. **Open Chrome or Edge browser**

2. **Go to Extensions page:**
   - Chrome: Type `chrome://extensions/` in address bar
   - Edge: Type `edge://extensions/` in address bar
   - Or: Menu → Extensions → Manage Extensions

3. **Enable Developer Mode:**
   - Toggle the switch in the top-right corner

4. **Load the Extension:**
   - Click "Load unpacked" button
   - Navigate to: `C:\Program Files\budolshap\browser-extension`
   - Click "Select Folder"

5. **Verify Installation:**
   - You should see "BudolShap Knowledge Base Shortcut" in the extensions list
   - Status should be "Enabled"
   - If icons are missing, you'll see a warning but it will still work

### Step 4: Test the Keyboard Shortcut

1. **Open any website** (e.g., google.com, youtube.com)

2. **Press the shortcut:**
   - Windows/Linux: `Ctrl + Shift + K`
   - Mac: `Cmd + Shift + K`

3. **Expected Result:**
   - A new tab should open with the Knowledge Base
   - URL should be: `http://localhost:3000/documentation/knowledge-base.html`

### Step 5: Test Extension Icon

1. **Look for the extension icon** in your browser toolbar
2. **Click the icon**
3. **Expected Result:**
   - A popup should appear
   - Shows "Knowledge Base" with shortcut info
   - Has "Open Knowledge Base" button

4. **Click "Open Knowledge Base" button**
5. **Expected Result:**
   - Knowledge Base should open in a new tab

### Step 6: Test Smart Tab Management

1. **Open Knowledge Base** using the shortcut
2. **Navigate to a different website** (e.g., google.com)
3. **Press `Ctrl+Shift+K` again**
4. **Expected Result:**
   - Should focus the existing Knowledge Base tab (not open a new one)

### Step 7: Test from Different Websites

Test the shortcut from various sites:
- ✅ Google.com
- ✅ YouTube.com
- ✅ GitHub.com
- ✅ Any other website

**Expected:** Knowledge Base should open from all of them!

## Troubleshooting

### Extension Not Loading
- **Error:** "Manifest file is missing or unreadable"
  - **Solution:** Make sure you selected the `browser-extension` folder, not a parent folder

- **Error:** "Service worker registration failed"
  - **Solution:** Check `background.js` for syntax errors
  - Open browser console (F12) to see detailed errors

### Shortcut Not Working
- **Check:** Go to `chrome://extensions/shortcuts`
- **Verify:** "BudolShap Knowledge Base Shortcut" is listed
- **Check:** `Ctrl+Shift+K` is assigned
- **Reassign:** If needed, click and set the shortcut manually

### Knowledge Base Not Opening
- **Check:** Is your dev server running? (`npm run dev`)
- **Check:** URL in `background.js` - is `useLocal: true`?
- **Test:** Try opening `http://localhost:3000/documentation/knowledge-base.html` manually

### Icons Missing
- **Impact:** Extension will work, just no icon in toolbar
- **Solution:** Create icons using `create-icons.html` or any image editor
- **Quick Fix:** Extension will still function without icons

## Expected Behavior Summary

✅ **Shortcut works from any website**
✅ **Opens Knowledge Base in new tab**
✅ **Focuses existing tab if already open**
✅ **Extension icon shows popup**
✅ **Works with browser in focus (not minimized)**

## Next Steps After Testing

If everything works:
1. ✅ Keep extension enabled
2. ✅ Use `Ctrl+Shift+K` from anywhere!
3. ✅ Update `background.js` for production URL when ready

If issues found:
1. Check browser console for errors
2. Verify all files are in correct location
3. Check extension permissions
4. Review error messages in extension management page



