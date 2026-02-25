# Knowledge Base Standalone Access Guide

## Overview

This guide explains how to access the BudolShap Knowledge Base even when the main application is not open, using a standalone launcher page.

## Quick Access Methods

### Method 1: Direct Launcher Page (Recommended)

1. **Open the launcher page directly:**
   - Local: `http://localhost:3000/documentation/knowledge-base-launcher.html`
   - Or open the file: `documentation/knowledge-base-launcher.html` in your browser

2. **Press the keyboard shortcut:**
   - Windows/Linux: `Ctrl + Shift + K`
   - Mac: `Cmd + Shift + K`

3. **Or click the "Open Knowledge Base" button**

### Method 2: Browser Bookmark

1. Open `knowledge-base-launcher.html` in your browser
2. Bookmark the page (Ctrl+D or Cmd+D)
3. Name it "KB" or "Knowledge Base" for quick access
4. Click the bookmark anytime to open the launcher
5. Press `Ctrl+Shift+K` or click the button

### Method 3: Pin Browser Tab

1. Open `knowledge-base-launcher.html` in a browser tab
2. Right-click the tab → "Pin tab"
3. The tab will stay open and be easily accessible
4. Press `Ctrl+Shift+K` when the tab is active

### Method 4: Desktop Shortcut

1. Create a desktop shortcut with this URL:
   ```
   http://localhost:3000/documentation/knowledge-base-launcher.html
   ```
2. Double-click the shortcut to open the launcher
3. Press `Ctrl+Shift+K` or click the button

## Authentication

### Without Authentication
- Click "Open Knowledge Base" button
- Opens directly (no password required)
- Limited access - some documents may be protected

### With Authentication
- Click "Open with Authentication" button
- Opens main application
- Press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac)
- Enter access code from email
- Full access to all documents including protected ones

## Browser Limitations

**Important Note:** Due to browser security restrictions, keyboard shortcuts can only work when:
- The browser tab/window has focus
- The page is actively loaded

**This means:**
- ✅ Shortcuts work when the launcher page is open and focused
- ❌ Shortcuts do NOT work when the browser is minimized or another app has focus
- ✅ You can always click the button to open the knowledge base

## Recommended Setup

1. **Bookmark the launcher page** for quick access
2. **Pin the tab** if you use it frequently
3. **Use the button** if keyboard shortcuts don't work
4. **Keep the launcher page open** in a background tab for quick access

## File Locations

- **Launcher:** `documentation/knowledge-base-launcher.html`
- **Knowledge Base:** `documentation/knowledge-base.html`
- **Public Access:** `public/documentation/knowledge-base-launcher.html`

## Troubleshooting

### Shortcut Not Working
- Make sure the launcher page tab is active/focused
- Try clicking the button instead
- Check if another application is capturing the shortcut

### Page Not Loading
- Ensure your development server is running (for localhost)
- Check the URL is correct
- Try opening the HTML file directly from the file system

### Authentication Issues
- Use "Open with Authentication" button
- Make sure email is configured in the application
- Check your email for the access code

## Alternative: System-Level Shortcut (Advanced)

For true global keyboard shortcut access (works even when browser is not focused), you would need:
- A browser extension
- A desktop application
- A system-level keyboard shortcut manager

These require additional setup and are beyond the scope of this guide.



