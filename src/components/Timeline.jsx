import ActivityCard from './ActivityCard'
import ShowBanner from './ShowBanner'
import Night2Poll from './Night2Poll'
import { fmtDistance, fmtDuration } from '../hooks/useRoutes'

const isShowActivity = (a) => /cờ lau/i.test(a.title || '')

export default function Timeline({ day, segmentMap, selectedActivity, onSelectActivity, night2Tally, night2Total, onOpenVote }) {
  const acts = day.activities

  return (
    <section className="timeline">
      <div className="timeline-header" style={{ '--accent': day.accent }}>
        <span className="timeline-eyebrow">{day.label}</span>
        <h2 className="timeline-date">{day.date}</h2>
        <p className="timeline-summary">{day.summary}</p>
      </div>

      <ol className="activities-list">
        {acts.map((activity, index) => {
          const next = acts[index + 1]
          const seg = next ? segmentMap[`${activity.id}-${next.id}`] : null
          const isShow = isShowActivity(activity)

          return (
            <li key={activity.id} className="activities-item">
              {isShow && (
                <div className="timeline-extra">
                  <Night2Poll tally={night2Tally} total={night2Total} onOpenVote={onOpenVote} />
                </div>
              )}

              {isShow ? (
                <ShowBanner activity={activity} />
              ) : (
                <ActivityCard
                  activity={activity}
                  accent={day.accent}
                  index={index + 1}
                  isSelected={selectedActivity === activity.id}
                  onClick={() => onSelectActivity(activity.id)}
                />
              )}

              {index < acts.length - 1 && (
                <div className="connector" style={{ '--accent': day.accent }}>
                  <div className="connector__rail" />
                  <div className="connector__pill">
                    {seg ? (
                      <>
                        <span className="connector__dist">{fmtDistance(seg.distanceM)}</span>
                        <span className="connector__sep">·</span>
                        <span className="connector__dur">{fmtDuration(seg.durationS)}</span>
                        <span className="connector__sep">·</span>
                        <span>{activity.travelToNext?.mode ?? 'Xe máy'}</span>
                      </>
                    ) : activity.travelToNext ? (
                      <>
                        {activity.travelToNext.distance && (
                          <><span className="connector__dist">{activity.travelToNext.distance}</span>
                          <span className="connector__sep">·</span></>
                        )}
                        {activity.travelToNext.time && (
                          <><span>{activity.travelToNext.time}</span>
                          <span className="connector__sep">·</span></>
                        )}
                        <span>{activity.travelToNext.mode}</span>
                      </>
                    ) : (
                      <span>Tiếp theo</span>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
