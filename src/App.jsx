import { useState, useMemo } from 'react'
import { DAYS as FALLBACK_DAYS, TRIP } from './data/itinerary'
import { useSheetItinerary } from './hooks/useSheetItinerary'
import { useRoutes } from './hooks/useRoutes'
import { useSheetImages } from './hooks/useSheetImages'
import DaySidebar from './components/DaySidebar'
import Timeline from './components/Timeline'
import MapView from './components/MapView'

export default function App() {
  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState(null)

  const { days: sheetDays, loading: itinLoading, error: itinError } = useSheetItinerary()
  const allDays = sheetDays ?? FALLBACK_DAYS

  const rawDay = allDays.find(d => d.id === selectedDay) ?? allDays[0]

  const { segments, segmentMap, loading: routesLoading } = useRoutes(rawDay)
  const { imageMap, linkMap, loading: imagesLoading, error: imagesError, totalImages } = useSheetImages()

  const day = useMemo(() => ({
    ...rawDay,
    activities: rawDay.activities.map(act => ({
      ...act,
      images: imageMap[act.id] ?? [],
      articleLink: linkMap[act.id] ?? null,
    })),
  }), [rawDay, imageMap, linkMap])

  function handleSelectDay(id) {
    setSelectedDay(id)
    setSelectedActivity(null)
  }

  function handleSelectActivity(id) {
    setSelectedActivity(prev => (prev === id ? null : id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="trip-title">{TRIP.title}</h1>
          <span className="trip-dates">{TRIP.subtitle}</span>
        </div>
        <div className="header-right">
          <div className="header-status">
            <ItinStatus loading={itinLoading} error={itinError} isSheet={!!sheetDays} />
            <ImageStatus loading={imagesLoading} error={imagesError} total={totalImages} />
          </div>
          <p className="trip-desc">{TRIP.description}</p>
        </div>
      </header>

      <div className="app-body">
        <DaySidebar
          days={allDays}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
        />
        <Timeline
          day={day}
          segmentMap={segmentMap}
          selectedActivity={selectedActivity}
          onSelectActivity={handleSelectActivity}
        />
        <MapView
          day={day}
          segments={segments}
          routesLoading={routesLoading}
          selectedActivity={selectedActivity}
          onSelectActivity={handleSelectActivity}
        />
      </div>
    </div>
  )
}

function ItinStatus({ loading, error, isSheet }) {
  if (loading) return <span className="img-status img-status--loading">Đang tải lịch trình…</span>
  if (error) return null // silently fall back to hardcoded, no noise
  if (isSheet) return <span className="img-status img-status--ok">📋 Sheet</span>
  return null
}

function ImageStatus({ loading, error, total }) {
  if (loading) return <span className="img-status img-status--loading">Đang tải ảnh…</span>
  if (error) return (
    <span className="img-status img-status--error" title={error}>⚠ Ảnh lỗi</span>
  )
  if (total > 0) return <span className="img-status img-status--ok">📷 {total} ảnh</span>
  return null
}
