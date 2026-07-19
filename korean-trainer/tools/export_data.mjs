// src/data/patterns.ts の内容を patterns.json に書き出す (音声/PDF生成用)
import { build } from 'esbuild'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const out = join(mkdtempSync(join(tmpdir(), 'kt-')), 'patterns.mjs')
await build({
  entryPoints: ['src/data/patterns.ts'],
  bundle: true,
  format: 'esm',
  outfile: out,
})
const m = await import(out)
writeFileSync('tools/patterns.json', JSON.stringify({ courses: m.courses, patterns: m.patterns }, null, 2))
console.log(`exported ${m.patterns.length} patterns`)
