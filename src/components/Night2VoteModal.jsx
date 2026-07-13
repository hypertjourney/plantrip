import { useState } from 'react'
import { NIGHT2_OPTIONS, Night2ResultsList } from './Night2Poll'

const RSVP_URL = import.meta.env.VITE_RSVP_URL || ''

export default function Night2VoteModal({ onClose, onVoted, tally, total }) {
  const [name,   setName]   = useState('')
  const [choice, setChoice] = useState(null)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [refreshed, setRefreshed] = useState(false)

  const canSubmit = name.trim() && choice !== null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit || status === 'submitting') return
    setStatus('submitting')
    try {
      await fetch(RSVP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'night2vote', name: name.trim(), night2: choice }),
      })
      setStatus('success')
      // gviz read of the sheet lags slightly behind the write, so delay the refetch
      setTimeout(async () => {
        await onVoted?.()
        setRefreshed(true)
      }, 1200)
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
            <h3 className="rsvp-success__title">Đã ghi nhận!</h3>
            <p className="rsvp-success__body">
              Cảm ơn <strong>{name}</strong> đã bình chọn cho đêm thứ 2.
            </p>

            <div className="rsvp-success__results">
              {refreshed ? (
                <Night2ResultsList tally={tally} total={total} />
              ) : (
                <p className="rsvp-success__loading">Đang tải kết quả mới nhất…</p>
              )}
            </div>

            <button className="rsvp-btn-primary" onClick={onClose}>Đóng</button>
          </div>
        ) : (
          <>
            <div className="rsvp-header">
              <div>
                <div className="rsvp-eyebrow">🌙 Đêm thứ 2 · sau khi ăn tối</div>
                <h2 className="rsvp-title">Bình chọn hoạt động</h2>
              </div>
              <button className="rsvp-x" onClick={onClose} aria-label="Đóng">✕</button>
            </div>

            <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
              <div className="rsvp-field">
                <label className="rsvp-label" htmlFor="vote-name">
                  Tên / Mã định danh
                  <span className="rsvp-hint">vd: tuannm, anhn, linh99</span>
                </label>
                <input
                  id="vote-name"
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
                <label className="rsvp-label">Chọn 1 hoạt động</label>
                <div className="rsvp-night2">
                  {NIGHT2_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`rsvp-night2-opt${choice === opt.key ? ' rsvp-night2-opt--on' : ''}`}
                      style={{ '--opt-color': opt.color }}
                      onClick={() => setChoice(opt.key)}
                    >
                      <span className="rsvp-night2-opt__tag">{opt.tag}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {status === 'error' && (
                <p className="rsvp-error">Lỗi kết nối — kiểm tra URL script hoặc thử lại.</p>
              )}

              <button
                type="submit"
                className="rsvp-btn-primary"
                disabled={!canSubmit || status === 'submitting'}
              >
                {status === 'submitting' ? 'Đang gửi…' : 'Gửi bình chọn'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
