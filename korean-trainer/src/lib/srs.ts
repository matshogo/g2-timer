import type { CardState, Grade } from '../types'

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

export function newCard(id: string): CardState {
  return { id, ease: 2.5, intervalDays: 0, dueAt: Date.now(), reps: 0, lapses: 0 }
}

export function schedule(card: CardState, grade: Grade, now = Date.now()): CardState {
  const next = { ...card }

  if (grade === 'again') {
    next.ease = Math.max(1.3, next.ease - 0.2)
    next.intervalDays = 0
    next.reps = 0
    next.lapses += 1
    next.dueAt = now + 10 * MINUTE
    return next
  }

  if (grade === 'hard') {
    next.ease = Math.max(1.3, next.ease - 0.15)
    next.intervalDays = Math.max(1, Math.round(next.intervalDays * 1.2) || 1)
    next.reps += 1
    next.dueAt = now + next.intervalDays * DAY
    return next
  }

  if (grade === 'good') {
    if (next.reps === 0) next.intervalDays = 1
    else if (next.reps === 1) next.intervalDays = 6
    else next.intervalDays = Math.round(next.intervalDays * next.ease)
    next.reps += 1
    next.dueAt = now + next.intervalDays * DAY
    return next
  }

  // easy
  next.ease = next.ease + 0.15
  if (next.reps === 0) next.intervalDays = 3
  else if (next.reps === 1) next.intervalDays = 8
  else next.intervalDays = Math.round(next.intervalDays * next.ease * 1.3)
  next.reps += 1
  next.dueAt = now + next.intervalDays * DAY
  return next
}

export function isMastered(card: CardState): boolean {
  return card.intervalDays >= 21
}
