import { useState, useEffect } from 'react'

const SPREADSHEET_ID = '1enQVTfxvsb5WNbO9R39lZkHSqXG1ZwhcEEIg8xO8QQs'
const SHEET_NAME = 'Images'

/**
 * Convert bất kỳ Google Drive share URL nào thành link ảnh trực tiếp.
 *
 * Input (các dạng user hay copy):
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID
 *
 * Output:
 *   https://lh3.googleusercontent.com/d/FILE_ID
 *   (CDN công khai của Google, không bị redirect auth)
 */
function normalizeDriveUrl(raw) {
  const url = raw.trim()

  // /file/d/ID/...
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`

  // ?id=ID hoặc &id=ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch && url.includes('drive.google.com'))
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`

  return url
}

async function fetchSheetImages() {
  const endpoint =
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq` +
    `?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`

  const res = await fetch(endpoint)
  if (!res.ok) throw new Error(`HTTP ${res.status} — kiểm tra sheet đã "Anyone can view" chưa`)

  const text = await res.text()

  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start === -1) throw new Error('Phản hồi lạ — có thể sheet chưa public')

  const data = JSON.parse(text.slice(start, end + 1))

  if (data.status === 'error') {
    const msg = data.errors?.[0]?.detailed_message
      ?? data.errors?.[0]?.message
      ?? 'Lỗi Google Sheets'
    throw new Error(msg)
  }

  const rows = data.table?.rows ?? []
  const map  = {}

  const linkMap = {} // { [activity_id]: firstNonEmptyLink }

  for (const row of rows) {
    const cells      = row.c ?? []
    const activityId = cells[0]?.v?.toString().trim()
    const rawUrl     = cells[1]?.v?.toString().trim()
    const caption    = cells[2]?.v?.toString().trim() ?? ''
    const articleUrl = cells[3]?.v?.toString().trim() ?? ''

    if (!activityId) continue

    // Article link — keep first non-empty value per activity
    if (articleUrl && !linkMap[activityId]) {
      linkMap[activityId] = articleUrl
    }

    if (!rawUrl) continue
    const url = normalizeDriveUrl(rawUrl)
    if (!map[activityId]) map[activityId] = []
    map[activityId].push({ url, caption })
  }

  return { imageMap: map, linkMap }
}

export function useSheetImages() {
  const [data, setData]     = useState(null)  // null = loading
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    fetchSheetImages()
      .then(result => { setData(result); setLoading(false) })
      .catch(err => {
        console.error('[Images sheet]', err.message)
        setError(err.message)
        setData({ imageMap: {}, linkMap: {} })
        setLoading(false)
      })
  }, [])

  const imageMap = data?.imageMap ?? {}
  const linkMap  = data?.linkMap  ?? {}
  const totalImages = Object.values(imageMap).reduce((s, arr) => s + arr.length, 0)

  return { imageMap, linkMap, loading, error, totalImages }
}
