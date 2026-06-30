import { useState, useEffect } from 'react'

const SHEET_ID = '1enQVTfxvsb5WNbO9R39lZkHSqXG1ZwhcEEIg8xO8QQs'

function sheetUrl(name) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(name)}`
}

function parseGviz(text) {
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('parse error')
  return JSON.parse(text.slice(start, end + 1))
}

function parseFeedbackRows(rows) {
  const result = []
  for (const row of rows) {
    const c = row.c ?? []
    // Columns: [Timestamp, name, rating, opinion, places]
    const name   = c[1]?.v
    const rating = c[2]?.v
    if (!name) continue
    result.push({
      name:   String(name).trim(),
      rating: typeof rating === 'number' ? rating : null,
    })
  }
  return result
}

export function useSheetFeedback() {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(sheetUrl('Phản hồi'))
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text() })
      .then(text => {
        const json = parseGviz(text)
        const rows = json?.table?.rows ?? []
        const parsed = parseFeedbackRows(rows)
        if (!cancelled) setParticipants(parsed)
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const count = participants.length
  const ratings = participants.map(p => p.rating).filter(r => r !== null)
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
    : null

  return { participants, count, avgRating, loading, error }
}
