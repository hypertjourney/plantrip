export default function DaySidebar({ days, selectedDay, onSelectDay }) {
  return (
    <aside className="day-sidebar">
      <p className="sidebar-eyebrow">Lịch trình</p>
      {days.map(day => (
        <button
          key={day.id}
          className={`day-card${selectedDay === day.id ? ' day-card--active' : ''}`}
          style={{ '--accent': day.accent }}
          onClick={() => onSelectDay(day.id)}
        >
          <span className="day-card__emoji">{day.emoji}</span>
          <div className="day-card__body">
            <span className="day-card__label">{day.label}</span>
            <span className="day-card__date">{day.date}</span>
            <span className="day-card__summary">{day.summary}</span>
          </div>
          {selectedDay === day.id && (
            <span className="day-card__pip" style={{ background: day.accent }} />
          )}
        </button>
      ))}

      <div className="sidebar-footer">
        <div className="legend-row">
          <span className="legend-dot" style={{ background: '#C48B1A' }} />
          <span>Ăn uống</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: '#1878A8' }} />
          <span>Di chuyển</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: '#237E38' }} />
          <span>Tham quan</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: '#7A5EAF' }} />
          <span>Lưu trú</span>
        </div>
      </div>
    </aside>
  )
}
