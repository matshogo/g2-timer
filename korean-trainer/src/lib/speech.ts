let koVoice: SpeechSynthesisVoice | null = null
let voicesReady = false

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) voicesReady = true
  return voices.find((v) => v.lang === 'ko-KR') ?? voices.find((v) => v.lang.startsWith('ko')) ?? null
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  koVoice = pickVoice()
  window.speechSynthesis.onvoiceschanged = () => {
    koVoice = pickVoice()
  }
}

export function speakKorean(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  if (!voicesReady) koVoice = pickVoice()

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  if (koVoice) utterance.voice = koVoice
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
