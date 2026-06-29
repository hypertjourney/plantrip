import { useState, useEffect } from 'react'

const SHEET_ID = '1enQVTfxvsb5WNbO9R39lZkHSqXG1ZwhcEEIg8xO8QQs'
// Fetch by gid=0 (first sheet) regardless of sheet name
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=0`

const TYPE_MAP = {
  'Di chuyển':  'transport',
  'Lưu trú':    'accommodation',
  'Ăn uống':    'food',
  'Tham quan':  'attraction',
}

const DAY_META = {
  1: { date: 'Thứ 6, 17/7',      label: 'Ngày 1', accent: '#C48B1A', emoji: '🌅' },
  2: { date: 'Thứ 7, 18/7',      label: 'Ngày 2', accent: '#1878A8', emoji: '🚣' },
  3: { date: 'Chủ nhật, 19/7',   label: 'Ngày 3', accent: '#237E38', emoji: '🏔️' },
}

// Handle both string "14:00" and gviz time-serial (fraction of 24h)
function parseTime(v) {
  if (!v && v !== 0) return ''
  if (typeof v === 'string') return v.trim()
  const mins = Math.round(v * 1440)
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function str(v) {
  return v == null ? '' : String(v).trim()
}

function num(v) {
  return typeof v === 'number' && isFinite(v) ? v : null
}

function parseRows(rows) {
  // Group by day number (col B = index 1)
  const byDay = {}

  for (const row of rows) {
    if (!row.c) continue
    const c = row.c

    const id      = str(c[0]?.v)
    const dayNum  = typeof c[1]?.v === 'number' ? c[1].v : parseInt(c[1]?.v)
    const time    = parseTime(c[2]?.v)
    const endTime = parseTime(c[3]?.v)
    const type    = TYPE_MAP[str(c[4]?.v)] ?? 'attraction'
    const title   = str(c[5]?.v)
    const subtitle = str(c[6]?.v)
    const lat     = num(c[7]?.v)
    const lng     = num(c[8]?.v)
    const travelMode = str(c[9]?.v)
    const description = str(c[10]?.v)
    const tips    = str(c[11]?.v)

    // Skip rows with no day or no title
    if (!dayNum || !title) continue

    const activity = {
      id: id || `d${dayNum}-${Date.now()}`,
      time,
      endTime,
      type,
      title,
      subtitle,
      description,
      tips,
      coords: lat && lng ? [lat, lng] : null,
      travelToNext: travelMode ? { distance: '', time: '', mode: travelMode } : null,
      images: [],
    }

    if (!byDay[dayNum]) byDay[dayNum] = []
    byDay[dayNum].push(activity)
  }

  // Build DAYS array using fixed metadata + sheet activities
  const days = Object.keys(DAY_META)
    .map(Number)
    .map(dayNum => {
      const activities = byDay[dayNum] ?? []
      // Auto-generate summary from attraction names
      const attractions = activities.filter(a => a.type === 'attraction')
      const summary = attractions.length
        ? attractions.map(a => a.title).join(' · ')
        : activities.slice(0, 3).map(a => a.title).join(' · ')

      return {
        ...DAY_META[dayNum],
        id: dayNum,
        summary,
        activities,
      }
    })

  return days
}

export function useSheetItinerary() {
  const [days, setDays] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchItinerary() {
      try {
        const res = await fetch(SHEET_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()

        // Strip gviz wrapper: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start === -1 || end === -1) throw new Error('Không parse được dữ liệu')

        const json = JSON.parse(text.slice(start, end + 1))
        const rows = json?.table?.rows

        if (!rows?.length) throw new Error('Sheet trống hoặc chưa có dữ liệu')

        const parsed = parseRows(rows)

        // Only use sheet data if at least one day has activities
        const hasData = parsed.some(d => d.activities.length > 0)
        if (!hasData) throw new Error('Chưa có hoạt động nào trong sheet')

        if (!cancelled) {
          setDays(parsed)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchItinerary()
    return () => { cancelled = true }
  }, [])

  return { days, loading, error }
}
