import { useMemo, useState } from 'react'
import { AudioPractice } from './components/AudioPractice'
import { AudioReview } from './components/AudioReview'
import { Home } from './components/Home'
import { Practice } from './components/Practice'
import { Review } from './components/Review'
import { Stats } from './components/Stats'
import { allDrillItems, patterns } from './data/patterns'
import { newCard, schedule } from './lib/srs'
import { loadProgress, recordStudyToday, saveProgress } from './lib/storage'
import type { DrillItem, Grade, ProgressState } from './types'

type View = 'home' | 'practice' | 'audio-practice' | 'review' | 'audio-review' | 'stats'

export function App() {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress())
  const [view, setView] = useState<View>('home')
  const [activePatternId, setActivePatternId] = useState<string | null>(null)
  const [reviewQueue, setReviewQueue] = useState<DrillItem[]>([])

  const dueQueue = useMemo(() => {
    const now = Date.now()
    return allDrillItems.filter((item) => {
      const card = progress.cards[item.id]
      return card && card.dueAt <= now
    })
  }, [progress.cards])

  function persist(next: ProgressState) {
    setProgress(next)
    saveProgress(next)
  }

  function startPattern(patternId: string, mode: 'audio' | 'manual') {
    setActivePatternId(patternId)
    setView(mode === 'audio' ? 'audio-practice' : 'practice')
  }

  function startReview(mode: 'audio' | 'manual') {
    setReviewQueue(dueQueue)
    setView(mode === 'audio' ? 'audio-review' : 'review')
  }

  // 今日のレッスン: 復習が溜まっていればまず音声復習、
  // なければ未着手の次パターン(IT監査 → 基本単語 → 日常会話の順)を音声練習。
  function startToday() {
    if (dueQueue.length > 0) {
      startReview('audio')
      return
    }
    const next =
      patterns.find((p) => p.items.some((i) => !progress.cards[i.id])) ?? patterns[0]
    startPattern(next.id, 'audio')
  }

  function finishPractice() {
    const pattern = patterns.find((p) => p.id === activePatternId)
    if (pattern) {
      const cards = { ...progress.cards }
      for (const item of pattern.items) {
        if (!cards[item.id]) cards[item.id] = newCard(item.id)
      }
      persist(recordStudyToday({ ...progress, cards }))
    }
    setActivePatternId(null)
    setView('home')
  }

  function handleGrade(item: DrillItem, grade: Grade) {
    setProgress((prev) => {
      const card = prev.cards[item.id] ?? newCard(item.id)
      const cards = { ...prev.cards, [item.id]: schedule(card, grade) }
      const next = recordStudyToday({ ...prev, cards, totalReviews: prev.totalReviews + 1 })
      saveProgress(next)
      return next
    })
  }

  const activePattern = patterns.find((p) => p.id === activePatternId)

  return (
    <div className="app">
      {view === 'home' && (
        <Home
          progress={progress}
          dueCount={dueQueue.length}
          onStartPattern={startPattern}
          onStartReview={startReview}
          onStartToday={startToday}
          onShowStats={() => setView('stats')}
        />
      )}

      {view === 'audio-practice' && activePattern && (
        <AudioPractice pattern={activePattern} onFinish={finishPractice} />
      )}

      {view === 'practice' && activePatternId && (
        <Practice patternId={activePatternId} onFinish={finishPractice} />
      )}

      {view === 'audio-review' && (
        <AudioReview queue={reviewQueue} onGrade={handleGrade} onFinish={() => setView('home')} />
      )}

      {view === 'review' && (
        <Review queue={reviewQueue} onGrade={handleGrade} onFinish={() => setView('home')} />
      )}

      {view === 'stats' && <Stats progress={progress} onBack={() => setView('home')} />}
    </div>
  )
}
