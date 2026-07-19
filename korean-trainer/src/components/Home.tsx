import { useState } from 'react'
import { courses, patternsByCourse } from '../data/patterns'
import type { CourseId, Pattern, ProgressState } from '../types'

interface Props {
  progress: ProgressState
  dueCount: number
  onStartPattern: (patternId: string, mode: 'audio' | 'manual') => void
  onStartReview: (mode: 'audio' | 'manual') => void
  onStartToday: () => void
  onShowStats: () => void
}

export function Home({ progress, dueCount, onStartPattern, onStartReview, onStartToday, onShowStats }: Props) {
  const [course, setCourse] = useState<CourseId>('audit')
  const list: Pattern[] = patternsByCourse(course)
  const started = (p: Pattern) => p.items.filter((i) => progress.cards[i.id]).length

  return (
    <div className="screen">
      <header className="hero">
        <h1>パタトレ韓国語</h1>
        <p className="sub">音声だけで完結する、IT監査のための韓国語トレーニング</p>
      </header>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-value">{progress.streak}</div>
          <div className="stat-label">連続学習日数</div>
        </div>
        <div className="stat-card" onClick={onShowStats}>
          <div className="stat-value">{progress.totalReviews}</div>
          <div className="stat-label">累計復習回数</div>
        </div>
      </div>

      <button className="review-btn" onClick={onStartToday}>
        🎧 今日のレッスン(音声)
      </button>

      <div className="secondary-row">
        <button className="secondary-btn" onClick={() => onStartReview('audio')} disabled={dueCount === 0}>
          🎧 復習 ({dueCount})
        </button>
        <button className="secondary-btn" onClick={() => onStartReview('manual')} disabled={dueCount === 0}>
          📱 画面で復習
        </button>
      </div>

      <div className="tab-row">
        {courses.map((c) => (
          <button
            key={c.id}
            className={`tab ${course === c.id ? 'active' : ''}`}
            onClick={() => setCourse(c.id)}
          >
            {c.title}
          </button>
        ))}
      </div>
      <p className="course-desc">{courses.find((c) => c.id === course)?.description}</p>

      <div className="pattern-list">
        {list.map((p) => (
          <div key={p.id} className="pattern-card">
            <button className="pattern-main" onClick={() => onStartPattern(p.id, 'audio')}>
              <div className="pattern-category">
                {p.category}
                {started(p) > 0 && <span className="started-mark"> ・着手済 {started(p)}/{p.items.length}</span>}
              </div>
              <div className="pattern-title">{p.title}</div>
              {p.meaning && <div className="pattern-meaning">{p.meaning}</div>}
            </button>
            <button className="pattern-screen-btn" onClick={() => onStartPattern(p.id, 'manual')}>
              📱<br />
              画面
            </button>
          </div>
        ))}
      </div>

      <p className="plan-note">
        学習プラン: 毎日「今日のレッスン」1回(約10分)+復習。IT監査 → 基本単語 → 日常会話の順で、
        3ヶ月で監査インタビューの質問・回答約100フレーズと基礎単語40語を定着させます。
      </p>
    </div>
  )
}
