# Quick Installation Guide

## Step 1: Create Icons

**Option A: Use the HTML Tool (Easiest)**
1. Open `create-icons.html` in your browser
2. Click each "Download" button to save the icon files
3. Save them in the `browser-extension/` folder

**Option B: Use Simple Colored Squares**
- Create 3 PNG files: `icon16.png`, `icon48.png`, `icon128.png`
- Use any image editor or online tool
- Color: #667eea (purple)
- Or use the emoji 📚 as the icon

## Step 2: Load Extension in Chrome/Edge

1. Open Chrome/Edge
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode** (toggle in top right)
4. Click **"Load unpacked"**
5. Navigate to: `C:\Program Files\budolshap\browser-extension`
6. Click **"Select Folder"**

## Step 3: Test It!

1. Go to **any website** (Google, YouTube, etc.)
2. Press **`Ctrl+Shift+K`** (or `Cmd+Shift+K` on Mac)
3. Knowledge Base should open! 🎉

## Step 4: Configure URL (if needed)

Edit `background.js` and update:
```javascript
const CONFIG = {
    localUrl: 'http://localhost:3000/documentation/knowledge-base.html',
    productionUrl: 'https://your-domain.com/documentation/knowledge-base.html',
    useLocal: true  // Change to false for production
};
```

## Troubleshooting

**Icons missing?**
- Extension will still work, just won't show an icon
- Create simple 16x16, 48x48, 128x128 PNG files
- Or use the `create-icons.html` tool

**Shortcut not working?**
- Go to `chrome://extensions/shortcuts`
- Find "BudolShap Knowledge Base Shortcut"
- Verify `Ctrl+Shift+K` is assigned
- Reassign if needed

**Knowledge Base not opening?**
- Check the URL in `background.js`
- Make sure your dev server is running (for localhost)
- Update `useLocal` to `false` if using production URL

## That's It!

Now you can press `Ctrl+Shift+K` from **any website** to open the Knowledge Base! 🚀



