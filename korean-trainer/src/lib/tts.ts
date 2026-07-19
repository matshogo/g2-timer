import { TextToSpeech } from '@capacitor-community/text-to-speech'

// Android WebViewはWeb Speech APIのspeechSynthesisをサポートしないため、
// ネイティブTTSに委譲するCapacitorプラグインを常に経由する
// (Web実行時はプラグインが内部でspeechSynthesisにフォールバックする)。

export interface CancelToken {
  cancelled: boolean
}

export function newToken(): CancelToken {
  return { cancelled: false }
}

function timeoutFor(text: string): number {
  return Math.min(20000, 3000 + text.length * 350)
}

export async function speak(text: string, lang: 'ko-KR' | 'ja-JP', rate = 1): Promise<void> {
  try {
    await Promise.race([
      TextToSpeech.speak({ text, lang, rate, pitch: 1, volume: 1, category: 'playback' }),
      new Promise<void>((resolve) => setTimeout(resolve, timeoutFor(text))),
    ])
  } catch {
    // 音声エンジンが無い環境でも学習フローは止めない
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await TextToSpeech.stop()
  } catch {
    // ignore
  }
}

export function sleep(ms: number, token?: CancelToken): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now()
    const iv = setInterval(() => {
      if ((token && token.cancelled) || Date.now() - start >= ms) {
        clearInterval(iv)
        resolve()
      }
    }, 50)
  })
}
