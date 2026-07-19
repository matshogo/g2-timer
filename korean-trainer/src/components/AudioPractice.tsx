import { useEffect, useRef, useState } from 'react'
import type { Pattern } from '../types'
import { newToken, sleep, speak, stopSpeaking } from '../lib/tts'

interface Props {
  pattern: Pattern
  onFinish: () => void
}

type Phase = 'prompt' | 'think' | 'answer' | 'done'

const PAUSE_OPTIONS = [3000, 5000, 7000]

// ハンズフリー練習: 画面を見ずに音声だけで1周できるのがデフォルト仕様。
// 日本語 → 考える間(発話する) → 韓国語(ゆっくり) → 韓国語(通常速度) → 次へ
export function AudioPractice({ pattern, onFinish }: Props) {
  const [index, setIndex] = useState(0)
  const [nonce, setNonce] = useState(0)
  const [phase, setPhase] = useState<Phase>('prompt')
  const [pauseMs, setPauseMs] = useState(5000)
  const pauseRef = useRef(pauseMs)
  pauseRef.current = pauseMs

  const item = pattern.items[index]
  const isLast = index === pattern.items.length - 1

  useEffect(() => {
    const token = newToken()
    ;(async () => {
      const it = pattern.items[index]
      if (index === 0 && nonce === 0) {
        await speak(`${pattern.meaning || pattern.title}の練習を始めます。日本語のあとに韓国語で言ってみてください。`, 'ja-JP')
        if (token.cancelled) return
      }
      setPhase('prompt')
      await speak(it.japanese, 'ja-JP')
      if (token.cancelled) return
      setPhase('think')
      await sleep(pauseRef.current, token)
      if (token.cancelled) return
      setPhase('answer')
      await speak(it.korean, 'ko-KR', 0.8)
      if (token.cancelled) return
      await sleep(500, token)
      if (token.cancelled) return
      await speak(it.korean, 'ko-KR', 1)
      if (token.cancelled) return
      await sleep(800, token)
      if (token.cancelled) return
      if (index + 1 < pattern.items.length) {
        setIndex(index + 1)
      } else {
        setPhase('done')
        await speak('練習終了です。お疲れさまでした。', 'ja-JP')
        if (!token.cancelled) onFinish()
      }
    })()
    return () => {
      token.cancelled = true
      void stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, nonce])

  function replay() {
    void stopSpeaking()
    setNonce((n) => n + 1)
  }

  function next() {
    void stopSpeaking()
    if (isLast) onFinish()
    else setIndex((i) => i + 1)
  }

  function cyclePause() {
    const i = PAUSE_OPTIONS.indexOf(pauseMs)
    setPauseMs(PAUSE_OPTIONS[(i + 1) % PAUSE_OPTIONS.length])
  }

  return (
    <div className="screen">
      <div className="drill-header">
        <button className="link-btn" onClick={onFinish}>
          ← 終了
        </button>
        <button className="link-btn" onClick={cyclePause}>
          間: {pauseMs / 1000}秒
        </button>
        <div className="progress-text">
          {index + 1} / {pattern.items.length}
        </div>
      </div>

      <div className="pattern-banner">
        <div className="pattern-title">{pattern.title}</div>
        <div className="pattern-meaning">{pattern.meaning}</div>
      </div>

      <div className="drill-card audio-card">
        <div className={`audio-phase phase-${phase}`}>
          {phase === 'prompt' && '🇯🇵 日本語'}
          {phase === 'think' && '🗣 韓国語で言ってみる'}
          {phase === 'answer' && '🇰🇷 正解'}
          {phase === 'done' && '✅ 終了'}
        </div>
        <div className="drill-prompt">{item.japanese}</div>
        {phase === 'answer' && <div className="drill-korean">{item.korean}</div>}
      </div>

      <div className="audio-controls">
        <button className="audio-btn" onClick={replay}>
          🔁 もう一度
        </button>
        <button className="audio-btn primary" onClick={next}>
          {isLast ? '終了' : '⏭ 次へ'}
        </button>
      </div>
      <p className="audio-hint">音声だけで自動的に進みます。画面を見る必要はありません。</p>
    </div>
  )
}
