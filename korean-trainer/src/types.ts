export interface DrillItem {
  id: string
  patternId: string
  korean: string
  japanese: string
  chunkKorean: string
  chunkJapanese: string
}

export interface Pattern {
  id: string
  title: string
  meaning: string
  category: string
  items: DrillItem[]
}

export type Grade = 'again' | 'hard' | 'good' | 'easy'

export interface CardState {
  id: string
  ease: number
  intervalDays: number
  dueAt: number
  reps: number
  lapses: number
}

export interface ProgressState {
  cards: Record<string, CardState>
  streak: number
  lastStudyDate: string | null
  totalReviews: number
}
