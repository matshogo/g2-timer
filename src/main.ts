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

// 円グラフ: 残り時間の割合に応じて円弧が消えていく
// ratio: 1.0=満杯（全円）、0.0=空（円なし）
function buildPieChart(ratio: number): string {
  const R = 6          // 半径（文字行数）
  const SIZE = R * 2 + 1
  const CX = R         // 中心
  const CY = R
  // 横方向は文字幅が縦の約半分なので2倍に伸ばす
  const ASPECT = 2.0

  const lines: string[] = []

  for (let row = 0; row < SIZE; row++) {
    let line = ''
    for (let col = 0; col < SIZE * 2; col++) {
      const dx = (col / ASPECT) - CX
      const dy = row - CY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > R + 0.5) {
        // 円の外
        line += ' '
      } else if (dist > R - 0.5) {
        // 円の輪郭（常に表示）
        line += '○'
      } else {
        // 円の内部: 角度で塗りつぶし判定
        // 12時方向（上）を0として時計回り
        let angle = Math.atan2(dx, -dy) // 上が0、時計回りで正
        if (angle < 0) angle += 2 * Math.PI
        const threshold = ratio * 2 * Math.PI

        if (angle < threshold) {
          line += '█'  // 残り時間あり
        } else {
          line += '░'  // 消えた部分
        }
      }
    }
    lines.push(line)
  }

  return lines.join('\n')
}

function buildContent(): string {
  const ratio = secondsLeft / DURATION
  const time = formatTime(secondsLeft)
  const pie = buildPieChart(ratio)

  let statusLine: string
  if (secondsLeft === 0) {
    statusLine = '   ✓  Time\'s up!'
  } else if (running) {
    statusLine = '   ▶  Running...'
  } else {
    statusLine = '   ■  Press to start'
  }

  const lines = [
    pie,
    `       ${time}`,
    statusLine,
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
