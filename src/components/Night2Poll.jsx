export const NIGHT2_OPTIONS = [
  {
    key: "show",
    tag: "🎭 Show diễn",
    label: "Xem Show Anh Hùng Cờ Lau",
    color: "#B0335C",
  },
  { key: "karaoke", tag: "🎤 Giải trí", label: "Đi karaoke", color: "#1878A8" },
  {
    key: "poker",
    tag: "🃏 Nghỉ ngơi",
    label: "Về nghỉ, chơi Poker",
    color: "#237E38",
  },
];

export function Night2ResultsList({ tally, total }) {
  return (
    <ul className="night2-poll__options">
      {NIGHT2_OPTIONS.map((opt) => {
        const count = tally?.[opt.key] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <li
            key={opt.key}
            className="night2-poll__option"
            style={{ "--opt-color": opt.color }}
          >
            <div className="night2-poll__option-top">
              <span className="night2-poll__option-tag">{opt.tag}</span>
              <span className="night2-poll__option-label">{opt.label}</span>
              <span className="night2-poll__option-count">
                {count} người · {pct}%
              </span>
            </div>
            <div className="night2-poll__bar">
              <div
                className="night2-poll__bar-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function Night2Poll({ tally, total, onOpenVote }) {
  return (
    <div className="night2-poll">
      <div className="night2-poll__head">
        <span className="night2-poll__eyebrow">🌙 Khảo sát hoạt động</span>
        <h3 className="night2-poll__title">Ăn tối xong thì làm gì?</h3>
        <p className="night2-poll__desc">
          Chọn 1 trong 3 — kết quả cập nhật theo số người đã bình chọn.
        </p>
      </div>

      <Night2ResultsList tally={tally} total={total} />

      <button className="night2-poll__cta" onClick={onOpenVote}>
        Bình chọn ngay ↗
      </button>
    </div>
  );
}
