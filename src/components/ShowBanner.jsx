const HIGHLIGHTS = [
  { icon: '🎪', text: '32 diễn viên xiếc, múa, võ thuật trình diễn thực cảnh ngoài trời' },
  { icon: '🌌', text: 'Hiệu ứng ánh sáng & âm thanh 360° giữa không gian cố đô Hoa Lư' },
  { icon: '📜', text: '4 màn kể chuyện: từ cậu bé chăn trâu tập trận cờ lau đến khi Đinh Bộ Lĩnh dẹp loạn 12 sứ quân, lập nên Đại Cồ Việt' },
  { icon: '🎫', text: 'Vé CL250: 250.000đ · CL350: 350.000đ · VIP CL500: 500.000đ / người' },
]

export default function ShowBanner({ activity }) {
  const timeRange = activity?.time && activity?.endTime ? `${activity.time} – ${activity.endTime}` : '20:45 · 60 phút'
  const discountTip = activity?.tips

  return (
    <div className="show-banner">
      <div className="show-banner__media">
        <span className="show-banner__tag">🎭 Show thực cảnh</span>
      </div>
      <div className="show-banner__body">
        <span className="show-banner__eyebrow">Sân khấu Thủy Đình · Cố đô Hoa Lư · {timeRange}</span>
        <h3 className="show-banner__title">Anh Hùng Cờ Lau</h3>
        <p className="show-banner__subtitle">The Emperor of the Reeds — thực cảnh xiếc sử Việt đầu tiên</p>
        <p className="show-banner__desc">
          Vở thực cảnh tái hiện hành trình Đinh Bộ Lĩnh — từ cậu bé chăn trâu tập trận cờ lau ở
          vùng quê Bắc Bộ, qua thời loạn 12 sứ quân, đến khi dẹp loạn thống nhất, lập nên Đại Cồ Việt.
          Sân khấu mở giữa núi, sông và làng cổ Hoa Lư, xoá nhoà ranh giới giữa khán giả và lịch sử —
          xem xong bữa tối ngày 2 là vừa kịp giờ diễn.
        </p>
        <ul className="show-banner__highlights">
          {HIGHLIGHTS.map((h, i) => (
            <li key={i}><span>{h.icon}</span>{h.text}</li>
          ))}
        </ul>
        {discountTip && (
          <p className="show-banner__tip"><span>💡</span>{discountTip}</p>
        )}
        <a
          className="show-banner__cta"
          href="https://anhhungcolau.vn/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Xem chi tiết & đặt vé ↗
        </a>
      </div>
    </div>
  )
}
