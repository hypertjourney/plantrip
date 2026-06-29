import { useState, useCallback } from 'react'

// images = [{ url: string, caption: string }]
export default function ImageSlider({ images, title }) {
  const [current,  setCurrent]  = useState(0)
  const [errored,  setErrored]  = useState({}) // { [index]: true }
  const multi = images.length > 1

  const prev = useCallback(e => {
    e.stopPropagation()
    setCurrent(i => (i - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback(e => {
    e.stopPropagation()
    setCurrent(i => (i + 1) % images.length)
  }, [images.length])

  const goTo = useCallback((e, idx) => {
    e.stopPropagation()
    setCurrent(idx)
  }, [])

  const markError = useCallback(idx => {
    setErrored(prev => ({ ...prev, [idx]: true }))
  }, [])

  if (!images.length) {
    return (
      <div className="slider slider--empty">
        <span className="slider__ph-icon">📷</span>
        <span className="slider__ph-label">Thêm ảnh · {title}</span>
      </div>
    )
  }

  const caption = images[current]?.caption

  return (
    <div className="slider">
      {/* Sliding track */}
      <div
        className="slider__track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map(({ url }, i) => (
          <div key={i} className="slider__slide">
            {errored[i] ? (
              <div className="slider__broken">
                <span>⚠️</span>
                <span>Không tải được ảnh</span>
                <span className="slider__broken-url">{url}</span>
              </div>
            ) : (
              <img
                src={url}
                alt={`${title} · ${i + 1}`}
                className="slider__img"
                loading="lazy"
                draggable={false}
                onError={() => markError(i)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Counter */}
      {multi && (
        <span className="slider__counter">{current + 1} / {images.length}</span>
      )}

      {/* Arrows */}
      {multi && (
        <>
          <button className="slider__btn slider__btn--prev" onClick={prev} aria-label="Ảnh trước">‹</button>
          <button className="slider__btn slider__btn--next" onClick={next} aria-label="Ảnh tiếp">›</button>
        </>
      )}

      {/* Caption */}
      {caption && (
        <div className="slider__caption">{caption}</div>
      )}

      {/* Dots */}
      {multi && (
        <div className="slider__dots" onClick={e => e.stopPropagation()}>
          {images.map((_, i) => (
            <button
              key={i}
              className={`slider__dot${current === i ? ' slider__dot--on' : ''}`}
              onClick={e => goTo(e, i)}
              aria-label={`Ảnh ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
