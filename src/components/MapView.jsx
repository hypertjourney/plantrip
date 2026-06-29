import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

function buildIcon(color, number, active) {
  const size = active ? 42 : 34
  const ring = active ? `, 0 0 0 5px ${color}30` : ''
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};
      border:2.5px solid #fff;
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:700;font-size:${active ? 15 : 12}px;
      font-family:system-ui,sans-serif;
      box-shadow:0 2px 10px rgba(0,0,0,0.25)${ring};
      cursor:pointer;
    ">${number}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function MapController({ day, selectedActivity }) {
  const map = useMap()

  useEffect(() => {
    const locs = day.activities.filter(a => a.coords).map(a => a.coords)
    if (!locs.length) return

    if (selectedActivity) {
      const act = day.activities.find(a => a.id === selectedActivity)
      if (act?.coords) {
        map.flyTo(act.coords, 14, { duration: 1.0 })
        return
      }
    }

    if (locs.length === 1) {
      map.flyTo(locs[0], 13, { duration: 1.0 })
    } else {
      map.flyToBounds(L.latLngBounds(locs), { padding: [56, 56], duration: 1.1 })
    }
  }, [day.id, selectedActivity]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function MapView({ day, segments, routesLoading, selectedActivity, onSelectActivity }) {
  const located = day.activities.filter(a => a.coords)

  return (
    <aside className="map-panel">
      <div className="map-header" style={{ '--accent': day.accent }}>
        <span className="map-eyebrow">Bản đồ · {day.label}</span>
        <span className="map-meta">
          {routesLoading
            ? <span className="map-loading">Đang tải tuyến đường…</span>
            : `${segments.length} tuyến · ${located.length} địa điểm`
          }
        </span>
      </div>

      <div className="map-wrap">
        <MapContainer
          center={[20.2506, 105.9745]}
          zoom={12}
          zoomControl={false}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="© OpenStreetMap · © CARTO"
          />

          <MapController day={day} selectedActivity={selectedActivity} />

          {/* OSRM real road routes */}
          {segments.map(seg => (
            <Polyline
              key={`${seg.fromId}-${seg.toId}`}
              positions={seg.path}
              color={day.accent}
              weight={4}
              opacity={0.75}
            />
          ))}

          {/* Fallback straight line for pairs without a route yet */}
          {!segments.length && located.length > 1 && (
            <Polyline
              positions={located.map(a => a.coords)}
              color={day.accent}
              weight={2}
              opacity={0.35}
              dashArray="8 6"
            />
          )}

          {located.map((activity, i) => {
            const active = selectedActivity === activity.id
            return (
              <Marker
                key={activity.id}
                position={activity.coords}
                icon={buildIcon(day.accent, i + 1, active)}
                eventHandlers={{ click: () => onSelectActivity(activity.id) }}
              >
                <Popup className="map-popup">
                  <div className="popup-inner">
                    <div className="popup-time" style={{ color: day.accent }}>
                      {activity.time} – {activity.endTime}
                    </div>
                    <div className="popup-title">{activity.title}</div>
                    <div className="popup-sub">{activity.subtitle}</div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      <nav className="map-legend">
        {located.map((activity, i) => (
          <button
            key={activity.id}
            className={`legend-btn${selectedActivity === activity.id ? ' legend-btn--active' : ''}`}
            style={{ '--accent': day.accent }}
            onClick={() => onSelectActivity(activity.id)}
          >
            <span className="legend-num" style={{ background: day.accent }}>{i + 1}</span>
            <span className="legend-text">{activity.title}</span>
            <span className="legend-time">{activity.time}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
