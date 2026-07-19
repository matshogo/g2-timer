#!/usr/bin/env python3
"""解説PDF (学習ガイド) ジェネレーター。WeasyPrint + Noto CJK フォントで生成。"""

import html
import json
from pathlib import Path

from weasyprint import HTML

ROOT = Path(__file__).resolve().parent
OUT = ROOT / ".." / "assets-build"

# パターン別の文法・用法解説 (IT監査コース中心)
NOTES = {
    "a-manage": (
        "<b>-을/를</b> は目的語の助詞。直前が子音(パッチム)で終われば 을、母音なら 를。"
        "<b>관리하고 계십니까?</b> は「管理していらっしゃいますか」— 계시다 は 있다 の尊敬語で、"
        "監査インタビューの冒頭で運用状況を確認する最重要パターン。",
        "ISO 27001: A.5.15(アクセス制御) / A.8.24(暗号) / A.8.13(バックアップ) / A.8.8(脆弱性管理) / A.8.32(変更管理) / A.5.19(供給者関係)",
    ),
    "a-evidence": (
        "<b>-아/어 주시겠습니까?</b> は「〜していただけますか」という最も丁重な依頼形。"
        "<b>증적(証跡)</b> は韓国の監査現場で日常的に使われる必須単語。",
        "ISO 27001: A.5.18(アクセス権) / A.8.13-8.14(バックアップ・冗長性) / A.6.3(教育) / A.8.32(変更管理) / A.8.15(ログ取得)",
    ),
    "a-reviewed": (
        "<b>-되었습니까?</b> は受動 되다 の過去疑問形。「〜されましたか」。"
        "<b>언제 마지막으로</b>=いつ最後に。文書の定期見直しの実施状況を問う定番。",
        "ISO 27001: A.5.1(ポリシー) / 6.1(リスクアセスメント) / A.5.30(事業継続) / A.5.19(供給者)",
    ),
    "a-documented": (
        "<b>-되어 있습니까?</b> は「〜されて(その状態に)ありますか」という状態表現。"
        "문서화되다=文書化される。手順書の整備状況の確認に。",
        "ISO 27001: A.5.26(インシデント対応) / A.8.32(変更管理) / A.5.16(ID管理) / A.8.8(技術的脆弱性)",
    ),
    "a-who-access": (
        "<b>누가</b>=誰が。<b>-에 접근하다</b>=〜にアクセスする(場所・対象には助詞 에)。"
        "<b>-(으)ㄹ 수 있습니까?</b>=〜できますか(可能形)。特権アクセスの棚卸しに。",
        "ISO 27001: A.5.15 / A.8.2(特権アクセス権)",
    ),
    "a-log-retention": (
        "<b>얼마 동안</b>=どのくらいの間。<b>보관됩니까?</b>=保管されますか(받다ではなく되다の受動)。"
        "ログ保持期間の確認。CloudTrailなど固有名詞はそのまま発音してよい。",
        "ISO 27001: A.8.15(ログ取得) / A.8.16(監視活動)",
    ),
    "a-aws-enabled": (
        "<b>활성화되어 있습니까?</b>=有効化されていますか。主語には 이/가(子音末+이, 母音末+가)。"
        "AWS環境の技術的設定を確認するクラウド監査の定番質問。",
        "ISO 27001: A.5.23(クラウドサービスの情報セキュリティ) / A.8.24(暗号) / A.5.17(認証情報)",
    ),
    "a-frequency": (
        "<b>-마다</b>=〜ごとに(분기마다=四半期ごと、반기마다=半期ごと)。"
        "<b>실시하고 있습니다</b>=実施しています。被監査側の回答として、運用頻度の説明はほぼこの一文型で対応できる。",
        "回答側フレーズ (運用頻度の説明)",
    ),
    "a-managed-by": (
        "<b>-(으)로</b>=手段・道具(〜で)。子音末+으로(ただしㄹパッチムは로)、母音末+로。"
        "IAM으로 / KMS로 のようにツール名に付けて「〜で管理しています」と答える。",
        "回答側フレーズ (管理ツールの説明)",
    ),
    "a-submit": (
        "<b>-겠습니다</b>=話し手の意思(〜します・いたします)。"
        "제출하다=提出する。証跡依頼への応答として最頻出。",
        "回答側フレーズ (証跡提出)",
    ),
    "a-status": (
        "<b>-는 중입니다 / - 중입니다</b>=〜している最中です。"
        "시정 조치(是正措置)、예외 승인(例外承認)は指摘事項対応の必須語彙。",
        "回答側フレーズ (指摘事項・対応状況)",
    ),
    "a-meeting": (
        "会議の開始・終了は <b>시작하겠습니다 / 마치겠습니다</b>。聞き返しは "
        "<b>다시 한번 말씀해 주시겠습니까?</b>。即答できない時は「確認してから回答します」で切り抜ける。",
        "監査ミーティング運営",
    ),
    "self-intro": ("<b>-이에요/예요</b>=〜です(打ち解けた丁寧形)。子音末+이에요、母音末+예요。", ""),
    "like": ("<b>좋아해요</b>=好きです。目的語に 을/를 を取る(〜을/를 좋아하다)。", ""),
    "is-there": ("<b>있어요?</b>=ありますか。旅行での万能パターン。", ""),
    "please-give": ("<b>주세요</b>=ください。名詞に直接付けられる。", ""),
    "how-much": ("<b>얼마예요?</b>=いくらですか。", ""),
    "where-is": ("<b>어디예요?</b>=どこですか。", ""),
    "want-to": ("<b>-고 싶어요</b>=〜したいです。動詞の語幹に付く。", ""),
    "what-time": ("時刻は固有数詞(하나→한, 둘→두...)+시。", ""),
}

COURSE_INTRO = {
    "audit": "韓国でのIT監査(ISO/IEC 27001審査・内部監査・クラウド監査)を想定した、監査人の質問と被監査側の回答の両方をカバーするメインコースです。すべて監査の場にふさわしい格式体(합니다体)。",
    "vocab": "フレーズを支える基礎語彙40語。単語→韓国語の順で即答できるまで反復します。",
    "daily": "出張・会食など監査周辺の生活場面で使う基本パターンです(해요体)。",
}


def build_html(data: dict) -> str:
    parts = []
    parts.append("""
<style>
  @page { size: A4; margin: 22mm 18mm; @bottom-center { content: counter(page); font-size: 9pt; color: #888; } }
  body { font-family: 'Noto Sans CJK JP', 'Noto Sans CJK KR', sans-serif; font-size: 10pt; color: #1a1a2e; line-height: 1.65; }
  h1 { font-size: 24pt; margin: 60mm 0 4mm; }
  .subtitle { font-size: 12pt; color: #555; }
  .cover-meta { margin-top: 80mm; font-size: 9pt; color: #888; }
  h2 { font-size: 15pt; border-left: 5px solid #4d6bff; padding-left: 8px; margin: 14mm 0 4mm; page-break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 8mm 0 2mm; page-break-after: avoid; }
  .pattern-head { background: #eef1ff; border-radius: 6px; padding: 6px 10px; margin: 6mm 0 2mm; page-break-after: avoid; }
  .pattern-head .ko { font-size: 12pt; font-weight: bold; }
  .pattern-head .ja { color: #555; font-size: 9.5pt; }
  .note { background: #f7f7fb; border-radius: 6px; padding: 6px 10px; font-size: 9pt; margin-bottom: 2mm; }
  .iso { font-size: 8.5pt; color: #4d6bff; margin-bottom: 2mm; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
  th, td { border: 0.5pt solid #ccc; padding: 4px 7px; text-align: left; vertical-align: top; }
  th { background: #f0f2f8; font-size: 9pt; }
  td.ko { font-weight: bold; width: 52%; }
  mark { background: #dfe6ff; padding: 0 2px; }
  .cover { page-break-after: always; text-align: center; }
  .toc-note { color: #666; font-size: 9.5pt; }
  ol.plan li, ul li { margin-bottom: 1.5mm; }
</style>
<div class="cover">
  <h1>パタトレ韓国語<br>学習ガイド</h1>
  <p class="subtitle">IT監査のための韓国語 — チャンク・パターン練習 + 間隔反復<br>ISO/IEC 27001 &amp; クラウド/AWS 監査対応</p>
  <p class="cover-meta">音声教材 (MP3) 対応版</p>
</div>

<h2>1. この教材について</h2>
<p>本教材は、パターンプラクティス(文型の骨格を固定し、チャンク=意味のかたまりだけを入れ替えて反復する訓練法)で、3ヶ月後に韓国語での監査インタビュー(質問・回答)に対応できることを目標にしています。文法の暗記ではなく、<b>口が覚えるまで声に出す</b>ことがすべてです。</p>
<ul>
<li><b>収録内容:</b> IT監査コース 12パターン63フレーズ / 基本単語 40語 / 日常会話 8パターン40フレーズ</li>
<li><b>文体:</b> 監査コースは格式体(합니다体)。会議・審査の場で失礼のない丁寧さです。</li>
<li><b>アプリ:</b> Android アプリ(パタトレ韓国語)では同じ内容をハンズフリー音声+間隔反復(SRS)で学習できます。</li>
</ul>

<h2>2. 音声(MP3)の構成と使い方</h2>
<p>MP3はアプリのハンズフリーモードと同じ流れで、画面を見ずに1本で学習が完結します。</p>
<ol>
<li>日本語フレーズが流れる</li>
<li><b>無音(約4秒)</b> — ここで韓国語を声に出して言う(最重要。頭の中で言うだけでは効果半減)</li>
<li>正解の韓国語が<b>ゆっくり</b>流れる — 自分の答えと照合</li>
<li>正解の韓国語が<b>通常速度</b>で流れる — シャドーイング(そっくり真似て発話)する</li>
</ol>
<p class="toc-note">トラック構成: 第1部 IT監査コース → 第2部 基本単語コース → 第3部 日常会話コース。通勤・運転・家事の間の「ながら学習」を想定しています。</p>

<h2>3. 3ヶ月学習プラン</h2>
<ol class="plan">
<li><b>第1〜4週:</b> IT監査コースを1日1パターン。翌日は必ず前日分を復習してから新パターンへ。MP3は該当部分を繰り返し。</li>
<li><b>第5〜6週:</b> 基本単語コース。単語→韓国語が1秒で出るまで。並行してIT監査コースの復習(アプリのSRSに従う)。</li>
<li><b>第7〜10週:</b> IT監査コース2周目。今度は日本語を見た瞬間に言えるかをテスト。言えなかったものだけ集中反復。</li>
<li><b>第11〜12週:</b> 模擬インタビュー。MP3を流し、無音部分で実際の自社環境に置き換えた回答(頻度・ツール名など)を即興で言う。</li>
</ol>
<p>目安は1日10〜15分。<b>連続でやること</b>が量より重要です(間隔反復は1日空くと効果が大きく落ちます)。</p>
""")

    course_names = {"audit": "IT監査コース", "vocab": "基本単語コース", "daily": "日常会話コース"}
    sec = 3
    for course in data["courses"]:
        sec += 1
        cid = course["id"]
        parts.append(f"<h2>{sec}. {course_names[cid]}</h2>")
        parts.append(f"<p>{COURSE_INTRO[cid]}</p>")
        patterns = [p for p in data["patterns"] if p["course"] == cid]
        for n, p in enumerate(patterns, 1):
            title = html.escape(p["title"])
            meaning = html.escape(p["meaning"])
            parts.append(
                f'<div class="pattern-head"><span class="ko">パターン{n}: {title}</span>'
                + (f'<br><span class="ja">{meaning}</span>' if p["meaning"] else "")
                + "</div>"
            )
            note = NOTES.get(p["id"])
            if note and note[0]:
                parts.append(f'<div class="note">{note[0]}</div>')
            if note and note[1]:
                parts.append(f'<div class="iso">{html.escape(note[1])}</div>')
            if cid == "vocab":
                rows = "".join(
                    f'<tr><td class="ko">{html.escape(i["korean"])}</td><td>{html.escape(i["japanese"])}</td></tr>'
                    for i in p["items"]
                )
                parts.append(f"<table><tr><th>韓国語</th><th>意味</th></tr>{rows}</table>")
            else:
                rows = []
                for i in p["items"]:
                    ko = html.escape(i["korean"])
                    ck = html.escape(i["chunkKorean"])
                    if ck and ck in ko:
                        ko = ko.replace(ck, f"<mark>{ck}</mark>", 1)
                    rows.append(f'<tr><td class="ko">{ko}</td><td>{html.escape(i["japanese"])}</td></tr>')
                parts.append(f'<table><tr><th>韓国語 (チャンクを強調)</th><th>日本語</th></tr>{"".join(rows)}</table>')

    parts.append("""
<h2>付録: 監査で困った時のリカバリー表現</h2>
<table>
<tr><th>韓国語</th><th>日本語</th></tr>
<tr><td class="ko">죄송합니다. 잘 못 들었습니다.</td><td>すみません、聞き取れませんでした。</td></tr>
<tr><td class="ko">조금 천천히 말씀해 주시겠습니까?</td><td>少しゆっくり話していただけますか。</td></tr>
<tr><td class="ko">한국어가 서툴러서 영어로 해도 될까요?</td><td>韓国語が拙いので英語でもいいですか。</td></tr>
<tr><td class="ko">그 부분은 통역을 통해 확인하겠습니다.</td><td>その部分は通訳を通して確認します。</td></tr>
</table>
<p class="toc-note">※ 本教材の韓国語は監査文脈の標準的表現ですが、実際の監査で使用する前にネイティブチェックを推奨します。</p>
""")
    return "".join(parts)


def main():
    data = json.load(open(ROOT / "patterns.json", encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / "patatore-korean-guide.pdf"
    HTML(string=build_html(data)).write_pdf(str(out))
    print(f"done: {out}")


if __name__ == "__main__":
    main()
