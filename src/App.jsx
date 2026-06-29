import { useState, useMemo } from 'react'
import { DAYS as FALLBACK_DAYS, TRIP } from './data/itinerary'
import { useSheetItinerary } from './hooks/useSheetItinerary'
import { useRoutes } from './hooks/useRoutes'
import { useSheetImages } from './hooks/useSheetImages'
import DaySidebar from './components/DaySidebar'
import Timeline from './components/Timeline'
import MapView from './components/MapView'
import RsvpModal from './components/RsvpModal'
import CostView  from './components/CostView'

export default function App() {
  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [rsvpOpen, setRsvpOpen] = useState(false)
  const [view, setView] = useState('trip') // 'trip' | 'costs'

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
        <div className="header-center">
          <nav className="header-nav">
            <button
              className={`header-nav-btn${view === 'trip'  ? ' header-nav-btn--on' : ''}`}
              onClick={() => setView('trip')}
            >Lịch trình</button>
            <button
              className={`header-nav-btn${view === 'costs' ? ' header-nav-btn--on' : ''}`}
              onClick={() => setView('costs')}
            >Chi phí</button>
          </nav>
        </div>
        <div className="header-right">
          <button className="rsvp-trigger" onClick={() => setRsvpOpen(true)}>
            ✋ Xác nhận tham gia
          </button>
          <p className="trip-desc">{TRIP.description}</p>
        </div>
      </header>

      {rsvpOpen && <RsvpModal onClose={() => setRsvpOpen(false)} />}

      <div className="app-body">
        {view === 'costs' ? (
          <CostView />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}

