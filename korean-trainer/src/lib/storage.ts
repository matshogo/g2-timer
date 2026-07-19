import type { ProgressState } from '../types'

const KEY = 'korean-trainer:progress:v1'

function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function loadProgress(): ProgressState {
  const raw = localStorage.getItem(KEY)
  if (!raw) return { cards: {}, streak: 0, lastStudyDate: null, totalReviews: 0 }
  try {
    return JSON.parse(raw) as ProgressState
  } catch {
    return { cards: {}, streak: 0, lastStudyDate: null, totalReviews: 0 }
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function recordStudyToday(state: ProgressState): ProgressState {
  const today = todayStr()
  if (state.lastStudyDate === today) return state

  const yesterday = todayStr(new Date(Date.now() - 24 * 60 * 60 * 1000))
  const streak = state.lastStudyDate === yesterday ? state.streak + 1 : 1

  return { ...state, streak, lastStudyDate: today }
}
