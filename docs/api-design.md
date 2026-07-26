# API設計

最終更新：2026-07-10

---

## 方針

- 決済前データはDBに保存しない（クライアント側で保持）
- 画像はパスのみ返す（バイナリ含まず）
- 金額はサーバー側で固定（クライアントから受け取らない）
- 認証不要（独自フロントエンドから直接APIを叩く構成に変更）

---

## エンドポイント一覧

| No | Method | Path | 役割 |
|----|--------|------|------|
| 1 | GET | /api/questions | テーマの質問一覧取得 |
| 2 | POST | /api/generate | AI生成＋顔パーツ・イラスト選択肢を一括返却 |
| 3 | POST | /api/payment | Stripe Checkout Session URL発行 |
| 4 | POST | /api/payment/callback | Stripe Webhook受け口（DB保存・メール送信） |
| 5 | GET | /api/ehon/{token} | 購入済み絵本データ取得 |

---

## 詳細

### 1. GET /api/questions

**Request**

```
Query:
  clientName={client_name}  // 必須
  themeName={theme_name}    // 必須
  year={year}               // 任意
```

**Response**

```json
{
  "questions": [
    { "sort": 1, "chapter": "子ども時代", "text": "好きなことは何ですか？" },
    { "sort": 2, "chapter": "子ども時代", "text": "子どもの頃の夢は何でしたか？" }
  ],
  "styles": [
    { "key": "tone",   "label": "トーン",        "options": ["やさしい絵本風", "希望に向かうストーリー", "リアルで力強い", "詩的で余白のある", "こども向けにやわらかく"] },
    { "key": "view",   "label": "主人公視点",    "options": ["わたし", "ぼく", "あの人"] },
    { "key": "target", "label": "読者ターゲット", "options": ["こども向け", "大人向け", "両方"] },
    { "key": "ending", "label": "ラストの余韻",  "options": ["背中を押す", "そっと寄り添う", "問いを残す"] }
  ]
}
```

---

### 2. POST /api/generate

**Request**

```json
{
  "theme": "life_timeline",
  "answers": {
    "q1": "絵を描く",
    "q2": "じっとしていない"
  },
  "styles": {
    "tone":   "やさしい絵本風",
    "view":   "わたし",
    "target": "大人向け",
    "ending": "背中を押す"
  }
}
```

**Response**

```json
{
  "theme": "life_timeline",
  "title": "ものづくりから始まる人生",
  "log_id": 1,
  "spreads": [
    { "sp_num": 0, "text1": "ものづくりから始まる人生", "text2": "" },
    { "sp_num": 1, "text1": "ぼくは ものを作るのが好きだった", "text2": "" },
    { "sp_num": 2, "text1": "思い描いたものが形になるのは楽しかった", "text2": "" },
    { "sp_num": 9, "text1": "おわり", "text2": "" }
  ],
  "face_parts": {
    "hair":  [{ "id": 1, "img_path": "/media/faces/hair1_*.png" }],
    "eye":   [{ "id": 2, "img_path": "/media/faces/eye1.png" }],
    "nose":  [{ "id": 3, "img_path": "/media/faces/nose1.png" }],
    "mouth": [{ "id": 4, "img_path": "/media/faces/mouth1.png" }]
  },
  "hair_colors": [
    { "label": "黒",   "color": "#1a1a1a" },
    { "label": "焦茶", "color": "#3d1f0d" },
    { "label": "茶",   "color": "#7b3f00" },
    { "label": "金",   "color": "#d4a017" },
    { "label": "赤茶", "color": "#8b3a2a" },
    { "label": "灰色", "color": "#808080" },
    { "label": "白",   "color": "#f5f5f5" }
  ],
  "skin_colors": [
    { "label": "色白",  "color": "#fde8d0" },
    { "label": "肌色",  "color": "#f0c08a" },
    { "label": "小麦色","color": "#c8956c" },
    { "label": "褐色",  "color": "#8b5e3c" },
    { "label": "色黒",  "color": "#4a2f1a" }
  ],
  "images": [
    { "id": 1, "img_path": "/media/images/back1.jpg", "angle": "0", "size": 26, "ox": 0, "tilt": 2 },
    { "id": 2, "img_path": "/media/images/sea.jpg",   "angle": "0", "size": 100,"ox": 0, "tilt": 15 }
  ]
}
```

※ `spreads` の sp_num: 0=表紙、1〜8=本文見開き、9=裏表紙  
※ `face_parts.hair` の img_path は `*` をangleで置換して使用（例: `hair1_0.png`）  
※ `log_id`: AnswerLogのID。payment APIに引き渡してcallbackでbookと紐づける  
※ `images` はテーマ紐づきのフラット配列。フロント側で見開きごとにどのイラストを使うか選択する  
※ `hair_colors` / `skin_colors` は Colors テーブルから取得（DBで管理）

**副作用**

- AnswerLog を作成（book未紐付け）

---

### 3. POST /api/payment

カード情報のみStripe管理。住所・名前・電話番号はこちらのUIで収集しサーバーへ送信する。

**Request**

```json
{
  "type":  "pdf",
  "theme": "life_timeline",
  "buyer": {
    "name":    "山田 花子",
    "email":   "hanako@example.com",
    "phone":   "090-1234-5678",
    "post":    "123-4567",
    "address": "東京都渋谷区〇〇1-2-3",
    "mail_ok": true
  },
  "face": {
    "hair":       2,
    "eye":        1,
    "nose":       3,
    "mouth":      2,
    "hairColor":  "#7b3f00",
    "skinColor":  "#f0c08a"
  },
  "spreads": [
    { "sp_num": 0, "text1": "ものづくりから始まる人生", "text2": "", "img_id": 1 },
    { "sp_num": 1, "text1": "ぼくは ものを作るのが好きだった", "text2": "", "img_id": 3 },
    { "sp_num": 9, "text1": "おわり", "text2": "", "img_id": null }
  ],
  "log_id": 1
}
```

※ `post` / `address` は `type=soft` / `type=hard` のみ必須  
※ `spreads[n].img_id`: 裏表紙（sp_num=9）は null  
※ `face` のキー名はフロント side の state 構造に合わせてキャメルケース

**処理フロー**

1. PendingBook に購入データを一時保存（log_id含む）
2. Stripe Checkout Session URLを発行（metadata.token）
3. フロントへ ck_url を返す → フロントがリダイレクト

**typeと金額の対応（サーバー固定）**

| type | 金額 |
|------|------|
| `pdf`  | 300円 |
| `soft` | 3,000円 |
| `hard` | 8,000円 |

※ 金額はサーバー側の Theme.price_* から取得（フロントから金額は受け取らない）  
※ 複数部数対応はβ版予定：`qty` パラメータを追加し、サーバーで `price × qty` 計算

**Response**

```json
{
  "ck_url": "https://checkout.stripe.com/pay/xxxxxxxx"
}
```

---

### 4. POST /api/payment/callback

StripeからのWebhook。署名検証（Stripe-Signature）必須。

**処理フロー**

1. Stripe署名を検証（不正リクエスト排除）
2. metadata.tokenから PendingBook を取得
3. Buyer / Book / BookPage をDB保存
4. AnswerLog に book を紐付け（log_id経由）
5. PendingBook を削除
6. SESで購入完了メール送信
7. Stripeへ 200 を返す

**Response**

```json
{ "detail": "callback ok!" }
```

---

### 5. GET /api/ehon/{token}

**Response**

```json
{
  "title":   "ものづくりから始まる人生",
  "status":  "paid",
  "pdf_exp": "2026-07-14T00:00:00Z",
  "face": {
    "hair":       "/media/faces/hair1_0.png",
    "eye":        "/media/faces/eye1.png",
    "nose":       "/media/faces/nose1.png",
    "mouth":      "/media/faces/mouth1.png",
    "hairColor":  "#7b3f00",
    "skinColor":  "#f0c08a"
  },
  "spreads": [
    { "sp_num": 0, "text1": "ものづくりから始まる人生", "text2": "", "img_path": "/media/images/back1.jpg", "angle": "0", "size": 26, "ox": 0, "tilt": 2 },
    { "sp_num": 1, "text1": "ぼくは ものを作るのが好きだった", "text2": "", "img_path": "/media/images/sea.jpg", "angle": "0", "size": 100, "ox": 0, "tilt": 15 },
    { "sp_num": 9, "text1": "おわり", "text2": "", "img_path": null, "angle": null, "size": null, "ox": null, "tilt": null }
  ]
}
```

---

### 6. POST /api/contact

**Request**

```json
{
  "type":    "normal",
  "name":    "山田 花子",
  "email":   "hanako@example.com",
  "tel":     "09012345678",
  "message": "お問い合わせ内容",
  "num":     null,
  "company": ""
}
```

| type値 | 表示名 | 追加項目 |
|--------|--------|---------|
| `normal` | お問い合わせ | なし |
| `defect` | メール未着・DLできない | なし |
| `multi`  | 複数冊購入希望 | num |
| `hard`   | ハードカバー購入希望 | なし |
| `client` | 新テーマ作成（企業向け） | company |

**処理フロー**

1. type / name / email / message を必須バリデーション
2. 運営宛にお問い合わせ内容を送信（SES）
3. 問い合わせ者に自動返信（SES）
4. `{ "detail": "ok" }` を返す

**Response**

```json
{ "detail": "ok" }
```

---

## エラーレスポンス（共通）

```json
{ "error": "エラーメッセージ" }
```

---

## エラー処理

### AI生成失敗（POST /api/generate）

| 段階 | 処理 |
|------|------|
| 1回目失敗 | 自動リトライ（1回） |
| 2回目失敗 | 500エラー返却 |

フロント側でユーザーに表示し、質問フォームへ戻る導線を案内する。

### Stripe Webhook未着

- Stripe側が自動リトライする仕組みを持つため基本任せる
- 永続未着の場合はStripeダッシュボードで確認

---

## メール仕様

メール送信はAWS SES使用（月99通以下は無料枠内）。

### ① PDF購入完了（ユーザー宛）

**件名**：`えほんごとのたね｜ダウンロードリンクのご案内`

```
この度はご購入ありがとうございます。
以下のリンクから絵本のPDFをダウンロードしてください。

▼ ダウンロードリンク
{download_url}

※ リンクの有効期限は30日間です。
※ 期限後の再ダウンロードには再購入が必要です。

エホンゴト
```

### ② 製本申し込み確認（ユーザー宛）

**件名**：`えほんごとのたね｜製本申し込みを受け付けました`

```
製本申し込みを受け付けました。
内容を確認のうえ、改めてご連絡いたします。

【お申し込み内容】
お名前：{name}
お届け先：{post} {address}
絵本タイトル：{title}

エホンゴト
```

### ③ 製本申し込み通知（管理者宛）

**件名**：`【製本依頼】{name} 様`

```
新しい製本申し込みがありました。

お名前：{name}
メール：{email}
お届け先：{post} {address}
絵本ID：{book_id}
申し込み日時：{created_at}
```

---

## 静的ファイル（顔パーツ・イラスト）

- 配置場所：EC2ローカル（Dockerボリュームでマウント）
- 配信方法：Nginxが `/media/` 以下を直接配信
- パス例：`/media/faces/hair1_0.png` / `/media/images/back1.jpg`
- 追加コスト：なし（将来S3移行も容易）
