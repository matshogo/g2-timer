import { allDrillItems } from '../data/patterns'
import { isMastered } from '../lib/srs'
import type { ProgressState } from '../types'

interface Props {
  progress: ProgressState
  onBack: () => void
}

export function Stats({ progress, onBack }: Props) {
  const total = allDrillItems.length
  const started = Object.keys(progress.cards).length
  const mastered = Object.values(progress.cards).filter(isMastered).length

  return (
    <div className="screen">
      <div className="drill-header">
        <button className="link-btn" onClick={onBack}>
          ← 戻る
        </button>
      </div>

      <h2 className="section-title">学習の記録</h2>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-value">{progress.streak}</div>
          <div className="stat-label">連続学習日数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{progress.totalReviews}</div>
          <div className="stat-label">累計復習回数</div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-value">
            {started} / {total}
          </div>
          <div className="stat-label">着手したチャンク</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{mastered}</div>
          <div className="stat-label">定着したチャンク</div>
        </div>
      </div>
    </div>
  )
}
