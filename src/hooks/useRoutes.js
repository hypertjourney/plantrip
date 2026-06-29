import { useState, useEffect } from 'react'

async function fetchOsrm(fromCoords, toCoords) {
  const [lat1, lon1] = fromCoords
  const [lat2, lon2] = toCoords
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${lon1},${lat1};${lon2},${lat2}` +
      `?geometries=geojson&overview=full`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.length) return null
    const route = data.routes[0]
    return {
      // OSRM returns [lon, lat]; Leaflet needs [lat, lon]
      path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceM: Math.round(route.distance),
      durationS: Math.round(route.duration),
    }
  } catch {
    return null
  }
}

export function useRoutes(day) {
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const acts = day.activities
    const pairs = []
    for (let i = 0; i < acts.length - 1; i++) {
      if (acts[i].coords && acts[i + 1].coords) {
        pairs.push({
          fromId: acts[i].id,
          toId: acts[i + 1].id,
          from: acts[i].coords,
          to: acts[i + 1].coords,
        })
      }
    }

    if (!pairs.length) {
      setSegments([])
      return
    }

    setLoading(true)
    setSegments([])

    Promise.all(
      pairs.map(p =>
        fetchOsrm(p.from, p.to).then(r =>
          r ? { ...r, fromId: p.fromId, toId: p.toId } : null
        )
      )
    ).then(results => {
      setSegments(results.filter(Boolean))
      setLoading(false)
    })
  }, [day.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Indexed by "fromId-toId" for O(1) lookup in Timeline / MapView
  const segmentMap = {}
  segments.forEach(s => {
    segmentMap[`${s.fromId}-${s.toId}`] = s
  })

  return { segments, segmentMap, loading }
}

export function fmtDistance(m) {
  if (!m && m !== 0) return ''
  if (m < 1000) return `${m} m`
  return `${(m / 1000).toFixed(1)} km`
}

export function fmtDuration(s) {
  if (!s && s !== 0) return ''
  const min = Math.round(s / 60)
  if (min < 60) return `${min} phút`
  const h = Math.floor(min / 60)
  const rem = min % 60
  return rem ? `${h}h ${rem}p` : `${h} giờ`
}
