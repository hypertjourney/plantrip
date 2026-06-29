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

function cell(c, i) {
  return c?.[i]?.v ?? null
}

function parseBudgetRows(rows) {
  return rows
    .map(r => {
      const c = r.c ?? []
      const total = cell(c, 6)
      if (total == null && !cell(c, 2)) return null
      return {
        day:      cell(c, 0),
        category: cell(c, 1) ?? '',
        item:     cell(c, 2) ?? '',
        unitPrice:cell(c, 3) ?? 0,
        qty:      cell(c, 4) ?? 1,
        unit:     cell(c, 5) ?? '',
        total:    typeof total === 'number' ? total : 0,
        note:     cell(c, 7) ?? '',
      }
    })
    .filter(Boolean)
    .filter(r => r.item && r.total > 0)
}

function parseActualRows(rows) {
  return rows
    .map(r => {
      const c = r.c ?? []
      const amount = cell(c, 4)
      if (!cell(c, 2)) return null
      return {
        day:      cell(c, 0),
        category: cell(c, 1) ?? '',
        item:     cell(c, 2) ?? '',
        paidBy:   cell(c, 3) ?? '',
        amount:   typeof amount === 'number' ? amount : 0,
        note:     cell(c, 5) ?? '',
      }
    })
    .filter(Boolean)
    .filter(r => r.item)
}

async function fetchSheet(name, parser) {
  const res  = await fetch(sheetUrl(name))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = parseGviz(await res.text())
  return parser(json?.table?.rows ?? [])
}

export function useSheetCosts() {
  const [budget,  setBudget]  = useState([])
  const [actual,  setActual]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchSheet('Dự trù',   parseBudgetRows),
      fetchSheet('Thực tế',  parseActualRows),
    ])
      .then(([b, a]) => {
        if (cancelled) return
        setBudget(b)
        setActual(a)
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const budgetTotal = budget.reduce((s, r) => s + r.total,  0)
  const actualTotal = actual.reduce((s, r) => s + r.amount, 0)

  return { budget, actual, budgetTotal, actualTotal, loading, error }
}
