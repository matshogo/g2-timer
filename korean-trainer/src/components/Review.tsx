import { useState } from 'react'
import type { DrillItem, Grade } from '../types'
import { speak } from '../lib/tts'

interface Props {
  queue: DrillItem[]
  onGrade: (item: DrillItem, grade: Grade) => void
  onFinish: () => void
}

const GRADE_BUTTONS: { grade: Grade; label: string; className: string }[] = [
  { grade: 'again', label: 'もう一度', className: 'grade-again' },
  { grade: 'hard', label: '難しい', className: 'grade-hard' },
  { grade: 'good', label: '良い', className: 'grade-good' },
  { grade: 'easy', label: '簡単', className: 'grade-easy' },
]

export function Review({ queue, onGrade, onFinish }: Props) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  if (queue.length === 0 || index >= queue.length) {
    return (
      <div className="screen">
        <div className="drill-card center">
          <div className="done-emoji">✅</div>
          <p>復習が完了しました！</p>
          <button className="next-btn" onClick={onFinish}>
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  const item = queue[index]

  function highlight(sentence: string, chunk: string) {
    const i = sentence.indexOf(chunk)
    if (i === -1) return sentence
    return (
      <>
        {sentence.slice(0, i)}
        <mark>{chunk}</mark>
        {sentence.slice(i + chunk.length)}
      </>
    )
  }

  function grade(g: Grade) {
    onGrade(item, g)
    setRevealed(false)
    setIndex((i) => i + 1)
  }

  return (
    <div className="screen">
      <div className="drill-header">
        <button className="link-btn" onClick={onFinish}>
          ← 戻る
        </button>
        <div className="progress-text">
          {index + 1} / {queue.length}
        </div>
      </div>

      <div className="drill-card">
        <div className="drill-prompt">{highlight(item.japanese, item.chunkJapanese)}</div>

        {revealed ? (
          <div className="drill-answer">
            <div className="drill-korean">{highlight(item.korean, item.chunkKorean)}</div>
            <button className="speak-btn" onClick={() => void speak(item.korean, 'ko-KR', 0.9)}>
              🔊 発音を聞く
            </button>
          </div>
        ) : (
          <button className="reveal-btn" onClick={() => setRevealed(true)}>
            韓国語を見る
          </button>
        )}
      </div>

      {revealed && (
        <div className="grade-row">
          {GRADE_BUTTONS.map((b) => (
            <button key={b.grade} className={`grade-btn ${b.className}`} onClick={() => grade(b.grade)}>
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
