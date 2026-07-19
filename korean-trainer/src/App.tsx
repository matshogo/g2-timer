import { useMemo, useState } from 'react'
import { Home } from './components/Home'
import { Practice } from './components/Practice'
import { Review } from './components/Review'
import { Stats } from './components/Stats'
import { allDrillItems, patterns } from './data/patterns'
import { newCard, schedule } from './lib/srs'
import { loadProgress, recordStudyToday, saveProgress } from './lib/storage'
import type { DrillItem, Grade, ProgressState } from './types'

type View = 'home' | 'practice' | 'review' | 'stats'

export function App() {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress())
  const [view, setView] = useState<View>('home')
  const [activePatternId, setActivePatternId] = useState<string | null>(null)

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

  function handleStartPattern(patternId: string) {
    setActivePatternId(patternId)
    setView('practice')
  }

  function handleFinishPractice() {
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
    const card = progress.cards[item.id] ?? newCard(item.id)
    const cards = { ...progress.cards, [item.id]: schedule(card, grade) }
    persist(recordStudyToday({ ...progress, cards, totalReviews: progress.totalReviews + 1 }))
  }

  return (
    <div className="app">
      {view === 'home' && (
        <Home
          progress={progress}
          dueCount={dueQueue.length}
          onStartPattern={handleStartPattern}
          onStartReview={() => setView('review')}
          onShowStats={() => setView('stats')}
        />
      )}

      {view === 'practice' && activePatternId && (
        <Practice patternId={activePatternId} onFinish={handleFinishPractice} />
      )}

      {view === 'review' && (
        <Review queue={dueQueue} onGrade={handleGrade} onFinish={() => setView('home')} />
      )}

      {view === 'stats' && <Stats progress={progress} onBack={() => setView('home')} />}
    </div>
  )
}
