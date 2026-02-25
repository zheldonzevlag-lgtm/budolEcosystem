'use client'

import { useEffect, useState } from 'react'
import { Save, Image as ImageIcon, Video } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ProductSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [maxProductImages, setMaxProductImages] = useState(12)
  const [maxProductVideos, setMaxProductVideos] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/system/settings')
        const data = await res.json()
        setMaxProductImages(data.maxProductImages ?? 12)
        setMaxProductVideos(data.maxProductVideos ?? 0)
      } catch (e) {
        console.error(e)
        toast.error('Failed to load product settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/internal/system/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxProductImages: Number(maxProductImages),
          maxProductVideos: Number(maxProductVideos),
        })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save settings')
      }
      toast.success('Product settings saved')
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Product Settings</h1>
        <p className="text-slate-500 mb-6">Configure limits for product media uploads used in the Add Product wizard.</p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <ImageIcon size={16} /> Maximum Product Images
            </label>
            <input
              type="number"
              min={0}
              value={maxProductImages}
              onChange={(e) => setMaxProductImages(e.target.value)}
              className="w-40 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Enforced in the Add Product page.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Video size={16} /> Maximum Product Videos
            </label>
            <input
              type="number"
              min={0}
              value={maxProductVideos}
              onChange={(e) => setMaxProductVideos(e.target.value)}
              className="w-40 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Future use: limits video uploads when enabled.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

