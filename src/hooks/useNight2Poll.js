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

function parseVoteRows(rows) {
  const result = []
  for (const row of rows) {
    const c = row.c ?? []
    // Columns: [Timestamp, name, choice]
    const name   = c[1]?.v
    const choice = c[2]?.v
    if (!name || !choice) continue
    result.push({ name: String(name).trim(), choice: String(choice).trim() })
  }
  return result
}

export function useNight2Poll() {
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(sheetUrl('Khảo sát đêm 2'))
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text() })
      .then(text => {
        const json = parseGviz(text)
        const rows = json?.table?.rows ?? []
        if (!cancelled) setVotes(parseVoteRows(rows))
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [reloadKey])

  const tally = votes.reduce((acc, v) => {
    if (acc[v.choice] !== undefined) acc[v.choice] += 1
    return acc
  }, { show: 0, karaoke: 0, poker: 0 })
  const total = tally.show + tally.karaoke + tally.poker

  function reload() {
    setReloadKey(k => k + 1)
  }

  return { votes, tally, total, loading, error, reload }
}
