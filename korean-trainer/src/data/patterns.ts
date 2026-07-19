import type { CourseId, CourseMeta, Pattern } from '../types'
import { auditPatterns } from './audit'
import { dailyPatterns } from './daily'
import { vocabPatterns } from './vocab'

export const courses: CourseMeta[] = [
  {
    id: 'audit',
    title: 'IT監査',
    description: 'ISO 27001管理策・クラウド/AWSの監査質問と回答',
  },
  {
    id: 'vocab',
    title: '基本単語',
    description: '監査・セキュリティ・クラウド・ビジネスの基礎語彙',
  },
  {
    id: 'daily',
    title: '日常会話',
    description: '旅行・生活で使う基本パターン',
  },
]

export const patterns: Pattern[] = [...auditPatterns, ...vocabPatterns, ...dailyPatterns]

export const allDrillItems = patterns.flatMap((p) => p.items)

export function patternsByCourse(course: CourseId): Pattern[] {
  return patterns.filter((p) => p.course === course)
}
