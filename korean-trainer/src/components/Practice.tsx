import { useMemo, useState } from 'react'
import { patterns } from '../data/patterns'
import { speakKorean, speechSupported } from '../lib/speech'

interface Props {
  patternId: string
  onFinish: () => void
}

export function Practice({ patternId, onFinish }: Props) {
  const pattern = useMemo(() => patterns.find((p) => p.id === patternId)!, [patternId])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const item = pattern.items[index]
  const isLast = index === pattern.items.length - 1

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

  function next() {
    if (isLast) {
      onFinish()
      return
    }
    setIndex((i) => i + 1)
    setRevealed(false)
  }

  return (
    <div className="screen">
      <div className="drill-header">
        <button className="link-btn" onClick={onFinish}>
          ← 戻る
        </button>
        <div className="progress-text">
          {index + 1} / {pattern.items.length}
        </div>
      </div>

      <div className="pattern-banner">
        <div className="pattern-title">{pattern.title}</div>
        <div className="pattern-meaning">{pattern.meaning}</div>
      </div>

      <div className="drill-card">
        <div className="drill-prompt">{highlight(item.japanese, item.chunkJapanese)}</div>

        {revealed ? (
          <div className="drill-answer">
            <div className="drill-korean">{highlight(item.korean, item.chunkKorean)}</div>
            {speechSupported() && (
              <button className="speak-btn" onClick={() => speakKorean(item.korean)}>
                🔊 発音を聞く
              </button>
            )}
          </div>
        ) : (
          <button className="reveal-btn" onClick={() => setRevealed(true)}>
            韓国語を見る
          </button>
        )}
      </div>

      {revealed && (
        <button className="next-btn" onClick={next}>
          {isLast ? '練習を終える' : '次へ'}
        </button>
      )}
    </div>
  )
}
