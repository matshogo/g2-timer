import type { CourseId, DrillItem, Pattern } from '../types'

export function items(
  patternId: string,
  pairs: [korean: string, japanese: string, chunkKorean: string, chunkJapanese: string][],
): DrillItem[] {
  return pairs.map(([korean, japanese, chunkKorean, chunkJapanese], i) => ({
    id: `${patternId}-${i}`,
    patternId,
    korean,
    japanese,
    chunkKorean,
    chunkJapanese,
  }))
}

export function pattern(
  course: CourseId,
  id: string,
  title: string,
  meaning: string,
  category: string,
  pairs: [string, string, string, string][],
): Pattern {
  return { id, course, title, meaning, category, items: items(id, pairs) }
}
