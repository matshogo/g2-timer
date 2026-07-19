import { useEffect, useRef, useState } from 'react'
import type { DrillItem, Grade } from '../types'
import { newToken, sleep, speak, stopSpeaking } from '../lib/tts'

interface Props {
  queue: DrillItem[]
  onGrade: (item: DrillItem, grade: Grade) => void
  onFinish: () => void
}

type Phase = 'prompt' | 'think' | 'answer' | 'judge' | 'done'

// ハンズフリー復習: 自動で「良い」と記録して進む。
// わからなかったら画面のどこかをタップ(=「もう一度」)するだけ。
export function AudioReview({ queue, onGrade, onFinish }: Props) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('prompt')
  const [markedAgain, setMarkedAgain] = useState(false)
  const againRef = useRef(false)
  const gradedRef = useRef(new Set<number>())

  const item = queue[index]

  useEffect(() => {
    if (!item) return
    const token = newToken()
    againRef.current = false
    setMarkedAgain(false)
    ;(async () => {
      if (index === 0) {
        await speak('復習を始めます。わからなかったら画面をタップしてください。', 'ja-JP')
        if (token.cancelled) return
      }
      setPhase('prompt')
      await speak(item.japanese, 'ja-JP')
      if (token.cancelled) return
      setPhase('think')
      await sleep(5000, token)
      if (token.cancelled) return
      setPhase('answer')
      await speak(item.korean, 'ko-KR', 0.85)
      if (token.cancelled) return
      setPhase('judge')
      await sleep(2500, token)
      if (token.cancelled) return
      finishItem(token.cancelled)
    })()
    return () => {
      token.cancelled = true
      void stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, item?.id])

  function finishItem(cancelled: boolean) {
    if (cancelled || !item || gradedRef.current.has(index)) return
    gradedRef.current.add(index)
    onGrade(item, againRef.current ? 'again' : 'good')
    if (index + 1 < queue.length) {
      setIndex(index + 1)
    } else {
      setPhase('done')
      void speak('復習終了です。お疲れさまでした。', 'ja-JP').then(onFinish)
    }
  }

  function markAgain() {
    if (phase === 'done') return
    againRef.current = true
    setMarkedAgain(true)
  }

  if (!item) {
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

  return (
    <div className="screen" onClick={markAgain}>
      <div className="drill-header">
        <button
          className="link-btn"
          onClick={(e) => {
            e.stopPropagation()
            onFinish()
          }}
        >
          ← 終了
        </button>
        <div className="progress-text">
          {index + 1} / {queue.length}
        </div>
      </div>

      <div className={`drill-card audio-card ${markedAgain ? 'marked-again' : ''}`}>
        <div className={`audio-phase phase-${phase}`}>
          {phase === 'prompt' && '🇯🇵 日本語'}
          {phase === 'think' && '🗣 韓国語で言ってみる'}
          {(phase === 'answer' || phase === 'judge') && '🇰🇷 正解'}
          {phase === 'done' && '✅ 終了'}
        </div>
        <div className="drill-prompt">{item.japanese}</div>
        {(phase === 'answer' || phase === 'judge') && <div className="drill-korean">{item.korean}</div>}
        {markedAgain && <div className="again-badge">もう一度に設定しました</div>}
      </div>

      <p className="audio-hint">わからなかったら画面をタップ → 「もう一度」として再スケジュールされます。</p>
    </div>
  )
}
