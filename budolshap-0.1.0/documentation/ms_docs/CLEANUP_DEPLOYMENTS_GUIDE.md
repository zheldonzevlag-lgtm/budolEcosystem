# How to Delete Old Vercel Deployments

## ✅ Recommended Method: Use Vercel Dashboard

The easiest and most reliable way to delete old deployments is through the Vercel Dashboard:

### Steps:

1. **Go to your Vercel Dashboard** at https://vercel.com/dashboard
2. **Click on your `budolshap` project**
3. **Click on the "Deployments" tab** (you're already there based on your screenshot)
4. **For each deployment you want to delete:**
   - Click the **three dots menu (•••)** on the right side of the deployment row
   - Select **"Delete"**
   - Confirm the deletion

### Which Deployments to Delete:

Based on your screenshot, I recommend:

#### ✅ **KEEP (3 most recent):**
- **28UseGFj** (14m ago) - Current production ✨
- **6evc2hT4o** (35m ago) - Recent backup
- **9ZQZFE3Uw** (49m ago) - Recent backup

#### 🗑️ **DELETE (older deployments):**
- **6hUyYTuwA** (1h ago)
- **9GTFBDVDV** (1h ago)
- **AMRGKCYdC** (2h ago)
- **6csnxP8Vt** (2h ago)
- **2Fhz6IAkt** (4h ago)

---

## Alternative: CLI Method (If Dashboard Doesn't Work)

If you prefer using the CLI, you need to use the full deployment URL:

```powershell
# List all deployments to see their full URLs
vercel ls

# Delete using the full deployment URL (example format)
vercel rm https://budolshap-6huyytuw-derflanoj2s-projects.vercel.app --yes
```

**Note:** The deployment IDs shown in the dashboard (like `6hUyYTuwA`) are NOT the same as the CLI deployment IDs. You need to match them by timestamp or commit message.

---

## Why Dashboard is Better:

1. ✅ **Visual confirmation** - You can see exactly what you're deleting
2. ✅ **No ID matching needed** - Click and delete
3. ✅ **Safer** - Confirms each deletion
4. ✅ **Shows deployment details** - Age, status, commit message

---

## After Deletion:

Run this to verify:
```powershell
vercel ls
```

You should see only your 3 most recent deployments remaining.
