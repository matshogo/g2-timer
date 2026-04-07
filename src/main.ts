import {
  waitForEvenAppBridge,
  TextContainerProperty,
  CreateStartUpPageContainer,
  TextContainerUpgrade,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'

const DURATION = 5 * 60 // 5分（秒）

let secondsLeft = DURATION
let running = false
let intervalId: ReturnType<typeof setInterval> | null = null
let animFrame = 0 // アニメーション用フレームカウンター

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// 砂時計の砂をブロック文字で表現
// width: 表示幅（文字数）、filled: 埋まっている割合 0.0〜1.0
function buildHourglass(ratio: number, tick: number): string {
  // ratio: 残り時間の割合（1.0=満杯、0.0=空）
  // 砂時計は上が「使った分」、下が「残り」
  const W = 13 // 横幅（奇数）
  const TOP_ROWS = 5  // 上部（流れ出た砂）
  const BOT_ROWS = 5  // 下部（溜まった砂）

  const lines: string[] = []

  // ── 上部（使った分・空になっていく） ──
  // ratio=1.0 → 上は満杯、ratio=0.0 → 上は空
  const topFilled = ratio // 上にまだ残っている割合
  for (let row = 0; row < TOP_ROWS; row++) {
    // 上から下に向かって狭くなる台形
    // row=0が一番広い行（W文字）、row=TOP_ROWS-1が一番狭い
    const maxW = W - row * 2
    if (maxW <= 0) {
      lines.push(' '.repeat(W + 2))
      continue
    }
    const pad = ' '.repeat((W - maxW) / 2)
    // その行が「砂あり」かどうか
    // 上部は下から埋まる（残り多いほど下から砂がある）
    const rowThreshold = (TOP_ROWS - 1 - row) / (TOP_ROWS - 1)
    const hasSand = topFilled >= rowThreshold
    const sandChar = hasSand ? '▓' : '░'
    lines.push(pad + sandChar.repeat(maxW) + pad)
  }

  // ── くびれ部分 ──
  // 砂が落ちているアニメーション
  const dropChars = ['·', ':', '|', ':']
  const drop = running ? dropChars[tick % dropChars.length] : (ratio > 0 && ratio < 1 ? '·' : ' ')
  const neckPad = ' '.repeat((W - 1) / 2)
  lines.push(neckPad + drop + neckPad)

  // ── 下部（溜まった砂・増えていく） ──
  // ratio=1.0 → 下は空、ratio=0.0 → 下は満杯
  const botFilled = 1 - ratio
  for (let row = BOT_ROWS - 1; row >= 0; row--) {
    const maxW = W - row * 2
    if (maxW <= 0) {
      lines.push(' '.repeat(W + 2))
      continue
    }
    const pad = ' '.repeat((W - maxW) / 2)
    // 下部は上から埋まる（溜まるほど上の行まで砂がある）
    const rowThreshold = (BOT_ROWS - 1 - row) / (BOT_ROWS - 1)
    const hasSand = botFilled >= rowThreshold
    const sandChar = hasSand ? '▓' : '░'
    lines.push(pad + sandChar.repeat(maxW) + pad)
  }

  return lines.join('\n')
}

function buildContent(): string {
  const ratio = secondsLeft / DURATION
  const time = formatTime(secondsLeft)
  const hourglass = buildHourglass(ratio, animFrame)

  let statusLine: string
  if (secondsLeft === 0) {
    statusLine = '   ✓  Time\'s up!'
  } else if (running) {
    statusLine = '   ▶  Running...'
  } else {
    statusLine = '   ■  Press to start'
  }

  const lines = [
    '',
    hourglass,
    '',
    `       ${time}`,
    '',
    statusLine,
    '',
    '   [Press] Start/Stop  [x2] Reset',
  ]

  return lines.join('\n')
}

async function main() {
  const bridge = await waitForEvenAppBridge()

  const textContainer = new TextContainerProperty({
    xPosition: 0,
    yPosition: 0,
    width: 576,
    height: 288,
    borderWidth: 0,
    borderColor: 0,
    paddingLength: 6,
    containerID: 1,
    containerName: 'timer',
    content: buildContent(),
    isEventCapture: 1,
  })

  const page = new CreateStartUpPageContainer({
    containerTotalNum: 1,
    textObject: [textContainer],
  })

  await bridge.createStartUpPageContainer(page)

  async function updateDisplay() {
    const upgrade = new TextContainerUpgrade({
      containerID: 1,
      containerName: 'timer',
      content: buildContent(),
      contentOffset: 0,
      contentLength: 0,
    })
    await bridge.textContainerUpgrade(upgrade)
  }

  function startTimer() {
    if (running || secondsLeft === 0) return
    running = true
    intervalId = setInterval(async () => {
      secondsLeft--
      animFrame++
      if (secondsLeft <= 0) {
        secondsLeft = 0
        running = false
        clearInterval(intervalId!)
        intervalId = null
      }
      await updateDisplay()
    }, 1000)
    updateDisplay()
  }

  function stopTimer() {
    if (!running) return
    running = false
    if (intervalId) { clearInterval(intervalId); intervalId = null }
    updateDisplay()
  }

  function resetTimer() {
    running = false
    if (intervalId) { clearInterval(intervalId); intervalId = null }
    secondsLeft = DURATION
    animFrame = 0
    updateDisplay()
  }

  bridge.onEvenHubEvent(event => {
    const e = event.textEvent
    if (!e) return

    switch (e.eventType) {
      case OsEventTypeList.CLICK_EVENT:
      case undefined:
        running ? stopTimer() : startTimer()
        break
      case OsEventTypeList.DOUBLE_CLICK_EVENT:
        resetTimer()
        break
      case OsEventTypeList.FOREGROUND_ENTER_EVENT:
        updateDisplay()
        break
      case OsEventTypeList.FOREGROUND_EXIT_EVENT:
        stopTimer()
        break
    }
  })
}

main()
