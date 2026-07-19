import { patterns } from '../data/patterns'
import type { ProgressState } from '../types'

interface Props {
  progress: ProgressState
  dueCount: number
  onStartPattern: (patternId: string) => void
  onStartReview: () => void
  onShowStats: () => void
}

export function Home({ progress, dueCount, onStartPattern, onStartReview, onShowStats }: Props) {
  return (
    <div className="screen">
      <header className="hero">
        <h1>パタトレ韓国語</h1>
        <p className="sub">チャンク・パターンで韓国語スピーキングを鍛える</p>
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

      <button className="review-btn" onClick={onStartReview} disabled={dueCount === 0}>
        {dueCount > 0 ? `復習する (${dueCount}件)` : '復習は完了しています'}
      </button>

      <h2 className="section-title">パターン練習</h2>
      <div className="pattern-list">
        {patterns.map((p) => (
          <button key={p.id} className="pattern-card" onClick={() => onStartPattern(p.id)}>
            <div className="pattern-category">{p.category}</div>
            <div className="pattern-title">{p.title}</div>
            <div className="pattern-meaning">{p.meaning}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
