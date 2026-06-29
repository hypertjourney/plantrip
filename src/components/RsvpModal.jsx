import { useState } from 'react'

// Sau khi deploy Apps Script web app → dán URL vào đây
const RSVP_URL = import.meta.env.VITE_RSVP_URL || ''

export default function RsvpModal({ onClose }) {
  const [name,    setName]    = useState('')
  const [rating,  setRating]  = useState(null)
  const [opinion, setOpinion] = useState('')
  const [places,  setPlaces]  = useState('')
  const [status,  setStatus]  = useState('idle') // idle | submitting | success | error

  const canSubmit = name.trim() && rating !== null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit || status === 'submitting') return
    setStatus('submitting')
    try {
      await fetch(RSVP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ name: name.trim(), rating, opinion: opinion.trim(), places: places.trim() }),
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="rsvp-backdrop" onClick={onClose}>
      <div className="rsvp-card" onClick={e => e.stopPropagation()}>

        {status === 'success' ? (
          <div className="rsvp-success">
            <div className="rsvp-success__check">✓</div>
            <h3 className="rsvp-success__title">Nhận được rồi!</h3>
            <p className="rsvp-success__body">
              Cảm ơn <strong>{name}</strong> đã xác nhận và đóng góp ý kiến cho chuyến đi.
            </p>
            <button className="rsvp-btn-primary" onClick={onClose}>Đóng</button>
          </div>
        ) : (
          <>
            <div className="rsvp-header">
              <div>
                <div className="rsvp-eyebrow">Ninh Bình · 17–19 tháng 7</div>
                <h2 className="rsvp-title">Xác nhận tham gia</h2>
              </div>
              <button className="rsvp-x" onClick={onClose} aria-label="Đóng">✕</button>
            </div>

            <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
              <div className="rsvp-field">
                <label className="rsvp-label" htmlFor="rsvp-name">
                  Tên / Mã định danh
                  <span className="rsvp-hint">vd: tuannm, anhn, linh99</span>
                </label>
                <input
                  id="rsvp-name"
                  className="rsvp-input"
                  type="text"
                  placeholder="Nhập nickname của bạn"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="rsvp-field">
                <label className="rsvp-label">
                  Đánh giá plan này
                  <span className="rsvp-hint">1 = chán · 10 = xịn xò</span>
                </label>
                <div className="rsvp-rating">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      type="button"
                      className={`rsvp-rate${rating === n ? ' rsvp-rate--on' : ''}`}
                      onClick={() => setRating(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {rating !== null && (
                  <div className="rsvp-rating-label">
                    {rating <= 3 ? 'Cần cải thiện nhiều 😬'
                      : rating <= 5 ? 'Ổn nhưng còn thiếu 😐'
                      : rating <= 7 ? 'Khá tốt rồi 👍'
                      : rating <= 9 ? 'Xịn lắm! 🔥'
                      : 'Plan hoàn hảo! 🤩'}
                  </div>
                )}
              </div>

              <div className="rsvp-field">
                <label className="rsvp-label" htmlFor="rsvp-opinion">
                  Ý kiến đóng góp
                  <span className="rsvp-hint">tùy chọn</span>
                </label>
                <textarea
                  id="rsvp-opinion"
                  className="rsvp-textarea"
                  placeholder="Cảm nhận về plan, góp ý lịch trình, thời gian có ổn không, muốn thêm hoạt động gì..."
                  value={opinion}
                  onChange={e => setOpinion(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="rsvp-field">
                <label className="rsvp-label" htmlFor="rsvp-places">
                  Địa điểm muốn ghé thêm
                  <span className="rsvp-hint">tùy chọn · gắn link Google Maps nếu có</span>
                </label>
                <textarea
                  id="rsvp-places"
                  className="rsvp-textarea rsvp-textarea--sm"
                  placeholder={"Nhà thờ đá Phát Diệm\nhttps://maps.google.com/...\n\nHồ Đồng Thái — nghe hay lắm"}
                  value={places}
                  onChange={e => setPlaces(e.target.value)}
                  rows={3}
                />
              </div>

              {status === 'error' && (
                <p className="rsvp-error">Lỗi kết nối — kiểm tra URL script hoặc thử lại.</p>
              )}

              <button
                type="submit"
                className="rsvp-btn-primary"
                disabled={!canSubmit || status === 'submitting'}
              >
                {status === 'submitting' ? 'Đang gửi…' : 'Xác nhận & Gửi'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
