import ImageSlider from './ImageSlider'

const TYPE_META = {
  transport:     { icon: '🚗', label: 'Di chuyển',  color: '#1878A8' },
  accommodation: { icon: '🏠', label: 'Lưu trú',    color: '#7A5EAF' },
  food:          { icon: '🍜', label: 'Ăn uống',    color: '#C48B1A' },
  attraction:    { icon: '🏛', label: 'Tham quan',  color: '#237E38' },
}

export default function ActivityCard({ activity, accent, isSelected, onClick }) {
  const { time, endTime, type, title, subtitle, description, tips, images = [], coords, articleLink } = activity
  const meta = TYPE_META[type]

  return (
    <article
      className={`acard${isSelected ? ' acard--open' : ''}`}
      style={{ '--accent': accent, '--type-color': meta.color }}
      onClick={onClick}
    >
      <div className="acard__aside">
        <span className="acard__time-start">{time}</span>
        <div className="acard__timeline-rail" />
        <span className="acard__time-end">{endTime}</span>
      </div>

      <div className="acard__body">
        <div className="acard__top">
          <div className="acard__badge">
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
          </div>
          <div className="acard__top-right">
            {coords && <span className="acard__map-pin" title="Có trên bản đồ">📍</span>}
          </div>
        </div>

        <h3 className="acard__title">{title}</h3>
        <p className="acard__subtitle">{subtitle}</p>

        {images.length > 0 && (
          <div className="acard__slider-wrap" onClick={e => e.stopPropagation()}>
            <ImageSlider images={images} title={title} />
          </div>
        )}

        {isSelected && (
          <div className="acard__details">
            <p className="acard__desc">{description}</p>
            {tips && (
              <div className="acard__tips">
                <span className="acard__tips-icon">💡</span>
                <p>{tips}</p>
              </div>
            )}
          </div>
        )}

        <div className="acard__footer">
          <button className="acard__toggle">
            {isSelected ? 'Thu gọn ↑' : 'Chi tiết ↓'}
          </button>
          {articleLink && (
            <a
              href={articleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="acard__article-link"
              onClick={e => e.stopPropagation()}
            >
              Đọc thêm ↗
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
