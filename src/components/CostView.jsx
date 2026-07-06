import { useState } from "react";
import { useSheetCosts } from "../hooks/useSheetCosts";
import { useSheetFeedback } from "../hooks/useSheetFeedback";

const PEOPLE = 18;
const MOMO_URL = "https://quy.momo.vn/v2/M-N3UmCQkU?cover=6749";
const DEPOSIT_PER_PERSON = 1_500_000;

const CATEGORIES = ["Di chuyển", "Lưu trú", "Ăn uống", "Tham quan", "Khác"];
const CAT_ICON = {
  "Di chuyển": "🚌",
  "Lưu trú": "🏨",
  "Ăn uống": "🍽️",
  "Tham quan": "🗺️",
  Khác: "📦",
};
const DAY_LABEL = {
  1: "Ngày 1 · Thứ 6",
  2: "Ngày 2 · Thứ 7",
  3: "Ngày 3 · CN",
  null: "Chung",
  "": "Chung",
};

function fmt(n) {
  if (!n) return "—";
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
}

function SummaryCard({ label, value, rawValue, sub, accent }) {
  return (
    <div className="cost-card" style={{ "--card-accent": accent }}>
      <div className="cost-card__label">{label}</div>
      <div className="cost-card__value">{rawValue ?? fmt(value)}</div>
      {sub && <div className="cost-card__sub">{sub}</div>}
    </div>
  );
}

function BudgetTable({ rows }) {
  const byDay = {};
  rows.forEach((r) => {
    const key = r.day ?? "";
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(r);
  });

  const dayOrder = [1, 2, 3, "", null].filter((k) => byDay[k]?.length);

  return (
    <div className="cost-table-wrap">
      {dayOrder.map((day) => (
        <div key={String(day)} className="cost-day-group">
          <div className="cost-day-label">
            {DAY_LABEL[day] ?? `Ngày ${day}`}
          </div>
          <table className="cost-table">
            <thead>
              <tr>
                <th>Khoản mục</th>
                <th className="cost-th-num">Đơn giá</th>
                <th className="cost-th-num">SL</th>
                <th className="cost-th-num">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {byDay[day].map((r, i) => (
                <tr key={i}>
                  <td>
                    <span className="cost-cat-icon">
                      {CAT_ICON[r.category] ?? "📌"}
                    </span>
                    {r.item}
                    {r.note ? (
                      <span className="cost-note"> · {r.note}</span>
                    ) : null}
                  </td>
                  <td className="cost-td-num">{fmt(r.unitPrice)}</td>
                  <td className="cost-td-num cost-td-qty">
                    {r.qty} {r.unit}
                  </td>
                  <td className="cost-td-num cost-td-total">{fmt(r.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="cost-subtotal">
                <td colSpan={3}>Subtotal ngày</td>
                <td className="cost-td-num">
                  {fmt(byDay[day].reduce((s, r) => s + r.total, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  );
}

function ActualTable({ rows, budgetTotal }) {
  if (!rows.length) {
    return (
      <div className="cost-empty">
        <div className="cost-empty__icon">💸</div>
        <div className="cost-empty__text">
          Chưa có chi phí thực tế nào được ghi lại.
        </div>
        <div className="cost-empty__sub">
          Vào Google Sheet → tab "Thực tế" để điền khi đã chi.
        </div>
      </div>
    );
  }

  const byDay = {};
  rows.forEach((r) => {
    const key = r.day ?? "";
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(r);
  });

  const dayOrder = [1, 2, 3, "", null].filter((k) => byDay[k]?.length);

  return (
    <div className="cost-table-wrap">
      {dayOrder.map((day) => (
        <div key={String(day)} className="cost-day-group">
          <div className="cost-day-label">
            {DAY_LABEL[day] ?? `Ngày ${day}`}
          </div>
          <table className="cost-table">
            <thead>
              <tr>
                <th>Khoản mục</th>
                <th>Ai trả</th>
                <th className="cost-th-num">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {byDay[day].map((r, i) => (
                <tr key={i}>
                  <td>
                    <span className="cost-cat-icon">
                      {CAT_ICON[r.category] ?? "📌"}
                    </span>
                    {r.item}
                    {r.note ? (
                      <span className="cost-note"> · {r.note}</span>
                    ) : null}
                  </td>
                  <td className="cost-td-paidby">{r.paidBy || "—"}</td>
                  <td className="cost-td-num cost-td-total">{fmt(r.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="cost-subtotal">
                <td colSpan={2}>Subtotal ngày</td>
                <td className="cost-td-num">
                  {fmt(byDay[day].reduce((s, r) => s + r.amount, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  );
}

export default function CostView() {
  const [tab, setTab] = useState("budget");
  const { budget, actual, budgetTotal, actualTotal, loading, error } =
    useSheetCosts();
  const { count: confirmedCount, avgRating } = useSheetFeedback();

  const diff = actualTotal - budgetTotal;
  const hasData = budget.length > 0;
  const perPerson = (actualTotal || budgetTotal) / PEOPLE;
  const fundContribution = Math.max(0, perPerson - DEPOSIT_PER_PERSON);

  return (
    <div className="cost-view">
      <div className="cost-view-header">
        <div className="cost-view-title">
          <span className="cost-view-eyebrow">Ninh Bình · 17–19/7</span>
          <h2>Chi phí chuyến đi</h2>
        </div>

        <div className="cost-summary-row">
          <SummaryCard label="Dự trù" value={budgetTotal} accent="#C48B1A" />
          <SummaryCard label="Thực tế" value={actualTotal} accent="#1878A8" />
          <SummaryCard
            label="Chênh lệch"
            value={Math.abs(diff)}
            sub={
              diff > 0
                ? "▲ vượt dự trù"
                : diff < 0
                  ? "▼ tiết kiệm"
                  : "đúng dự trù"
            }
            accent={diff > 0 ? "#B03030" : "#237E38"}
          />
          <SummaryCard
            label={`Mỗi người · ${confirmedCount}/${PEOPLE} người`}
            value={perPerson}
            sub={actualTotal ? "theo thực tế" : "theo dự trù"}
            accent="#237E38"
          />
          {avgRating !== null && (
            <SummaryCard
              label="Điểm trung bình"
              value={null}
              rawValue={`${avgRating}/10`}
              sub={`${confirmedCount} người đánh giá`}
              accent="#7B4FBF"
            />
          )}
        </div>

        <div className="cost-momo-banner">
          <div className="cost-momo-banner__left">
            <div className="cost-momo-banner__title">Quỹ chuyến đi · MoMo</div>
            <div className="cost-momo-banner__amount">
              Mỗi người cần đóng thêm: <strong>{fmt(fundContribution)}</strong>
              <span className="cost-momo-banner__hint">
                {" "}
                ({fmt(perPerson)} − {fmt(DEPOSIT_PER_PERSON)} công ty tài trợ
                max / 1 chuyến đi)
              </span>
            </div>
          </div>
          <a
            href={MOMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="cost-momo-btn"
          >
            Đóng quỹ MoMo →
          </a>
        </div>

        <div className="cost-tabs">
          <button
            className={`cost-tab${tab === "budget" ? " cost-tab--on" : ""}`}
            onClick={() => setTab("budget")}
          >
            📋 Dự trù {hasData && `· ${budget.length} khoản`}
          </button>
          <button
            className={`cost-tab${tab === "actual" ? " cost-tab--on" : ""}`}
            onClick={() => setTab("actual")}
          >
            💸 Thực tế {actual.length > 0 && `· ${actual.length} khoản`}
          </button>
        </div>
      </div>

      <div className="cost-view-body">
        {loading && (
          <div className="cost-loading">Đang tải dữ liệu chi phí…</div>
        )}
        {error && <div className="cost-error">⚠ {error}</div>}
        {!loading && !error && tab === "budget" && (
          <BudgetTable rows={budget} />
        )}
        {!loading && !error && tab === "actual" && (
          <ActualTable rows={actual} budgetTotal={budgetTotal} />
        )}
      </div>
    </div>
  );
}
