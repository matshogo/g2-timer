#!/usr/bin/env python3
"""全フレーズを1本のMP3にまとめる音声教材ジェネレーター。

構成 (アプリのハンズフリーモードと同じ流れ):
  日本語 → 考える間(無音) → 韓国語(ゆっくり) → 韓国語(通常) → 次へ

edge-tts (ネットワーク必須) と ffmpeg が必要。CI (GitHub Actions) での実行を想定。
"""

import asyncio
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import edge_tts

JA_VOICE = "ja-JP-NanamiNeural"
KO_VOICE = "ko-KR-SunHiNeural"
THINK_PAUSE = 4.0  # 発話練習のための無音秒数
VOCAB_PAUSE = 2.5
CONCURRENCY = 4

ROOT = Path(__file__).resolve().parent
OUT = ROOT / ".." / "assets-build"
SEG = OUT / "seg"

COURSE_NAMES = {"audit": "IT監査コース", "vocab": "基本単語コース", "daily": "日常会話コース"}


def ja_clean(text: str) -> str:
    return text.replace("・", "、")


def build_sequence(data: dict) -> list:
    """seq: ('tts', text, voice, rate) | ('sil', seconds)"""
    seq = [
        ("tts", "パタトレ韓国語、音声教材です。日本語のあとに、韓国語で言ってみてください。そのあと正解が、ゆっくりと通常の速さで流れます。", JA_VOICE, "+0%"),
        ("sil", 1.5),
    ]
    part = 0
    for course in data["courses"]:
        part += 1
        seq.append(("tts", f"第{part}部、{COURSE_NAMES[course['id']]}。", JA_VOICE, "+0%"))
        seq.append(("sil", 1.2))
        is_vocab = course["id"] == "vocab"
        patterns = [p for p in data["patterns"] if p["course"] == course["id"]]
        for n, p in enumerate(patterns, 1):
            label = p["meaning"] or p["title"]
            seq.append(("tts", f"パターン{n}。{ja_clean(label)}。", JA_VOICE, "+0%"))
            seq.append(("sil", 1.0))
            for item in p["items"]:
                seq.append(("tts", ja_clean(item["japanese"]), JA_VOICE, "+0%"))
                seq.append(("sil", VOCAB_PAUSE if is_vocab else THINK_PAUSE))
                seq.append(("tts", item["korean"], KO_VOICE, "-20%"))
                seq.append(("sil", 0.6))
                seq.append(("tts", item["korean"], KO_VOICE, "+0%"))
                seq.append(("sil", 1.2))
            seq.append(("sil", 0.8))
    seq.append(("tts", "以上で終わりです。お疲れさまでした。", JA_VOICE, "+0%"))
    return seq


def seg_path(kind: str, *key) -> Path:
    h = hashlib.sha1("|".join(str(k) for k in key).encode()).hexdigest()[:16]
    return SEG / f"{kind}-{h}.mp3"


async def synth(sem: asyncio.Semaphore, text: str, voice: str, rate: str, path: Path):
    if path.exists():
        return
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(text, voice, rate=rate).save(str(path))
                return
            except Exception as e:  # noqa: BLE001
                if attempt == 3:
                    raise
                print(f"retry {attempt + 1} for {text[:20]!r}: {e}", file=sys.stderr)
                await asyncio.sleep(2 * (attempt + 1))


def make_silence(seconds: float, path: Path):
    if path.exists():
        return
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
         "-t", str(seconds), "-c:a", "libmp3lame", "-b:a", "48k", str(path)],
        check=True, capture_output=True,
    )


async def main():
    data = json.load(open(ROOT / "patterns.json", encoding="utf-8"))
    SEG.mkdir(parents=True, exist_ok=True)
    seq = build_sequence(data)

    tts_jobs = {}
    for entry in seq:
        if entry[0] == "tts":
            _, text, voice, rate = entry
            tts_jobs[(text, voice, rate)] = seg_path("t", text, voice, rate)
    print(f"{len(seq)} segments, {len(tts_jobs)} unique TTS calls")

    sem = asyncio.Semaphore(CONCURRENCY)
    await asyncio.gather(*(synth(sem, t, v, r, p) for (t, v, r), p in tts_jobs.items()))

    for entry in seq:
        if entry[0] == "sil":
            make_silence(entry[1], seg_path("s", entry[1]))

    concat = OUT / "concat.txt"
    with open(concat, "w") as f:
        for entry in seq:
            p = seg_path("t", *entry[1:]) if entry[0] == "tts" else seg_path("s", entry[1])
            f.write(f"file '{p.resolve()}'\n")

    final = OUT / "patatore-korean-audio.mp3"
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
         "-c:a", "libmp3lame", "-b:a", "64k", "-ar", "24000", "-ac", "1",
         "-metadata", "title=パタトレ韓国語 音声教材",
         "-metadata", "artist=korean-trainer", str(final)],
        check=True,
    )
    dur = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(final)],
        capture_output=True, text=True,
    ).stdout.strip()
    print(f"done: {final} ({float(dur) / 60:.1f} min)")


if __name__ == "__main__":
    asyncio.run(main())
