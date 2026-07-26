# タスク管理

最終更新：2026-07-26

---

## 完了タスク

### 仕様設計
- [x] 機能概要の整理
- [x] ユーザーフロー確定
- [x] ビジネスモデル確定
- [x] 技術スタック確定（React / Django / Docker / AWS）
- [x] DB設計
- [x] API設計（5本）
- [x] 画面設計
- [x] エラー処理方針確定
- [x] メール文言確定（3種類）
- [x] 顔パーツ・イラスト配置方針確定（EC2ローカル + Nginx配信）
- [x] トークン形式確定（UUID v4）
- [x] 決済方式確定（Stripe Checkout）

### 環境構築
- [x] ディレクトリ構成作成
- [x] Dockerファイル一式
- [x] Django設定ファイル（base / local / production）
- [x] Nginxセキュリティ設定（レート制限・セキュリティヘッダー）
- [x] フロントエンドスケルトン（Vite + React）
- [x] .gitignore / .env.example

### バックエンド
- [x] Djangoモデル実装（buyers / books / book_pages / images / face_parts）
- [x] Colors モデル独立化（hair_colors / skin_colors をDBで管理）
- [x] AnswerLog モデル追加（generate時に生成・callback時にbookと紐付け）
- [x] BookPage.img null許容（裏表紙対応）
- [x] Book.type: print → soft / hard に変更
- [x] Theme.price: price_soft / price_hard 追加
- [x] GET /api/questions
- [x] POST /api/generate（AnswerLog作成・log_id返却・price返却）
- [x] GET /api/ehon/{token}
- [x] POST /api/payment（PendingBook保存・Stripe Session発行・success_url/cancel_url 環境変数化）
- [x] POST /api/payment/callback（署名検証・DB保存・AnswerLog紐付け・メール送信・download_url 環境変数化）
- [x] SESメール動作確認
- [x] admin.py 全モデル登録
- [x] views.py ehon_data：face_parts 追加・face を ID + camelCase（hairColor/skinColor）に変更
- [x] views.py ehon_data：spreads.img.oy 削除・face_parts.angle 削除
- [x] views.py callback：img_id → img オブジェクトから取得に変更

### フロントエンド
- [x] api/client.js 実装
- [x] App.jsx ルーティング
- [x] QuestionForm（generate API連携・戻り時の入力値復元・差分スキップ）
- [x] FaceSelect（髪色/肌色選択・drawFace連携・generate結果またはmockフォールバック）
- [x] drawFace.js（colorize・source-atop・flip・チーク描画）
- [x] parseMask.js（表紙領域・テキスト・顔領域検出）
- [x] BookCanvas（見開き対応・表紙トリミング・顔座標補正）
- [x] drawSpread.js（描画ロジック切り出し・ウォーターマーク・外枠）
- [x] ImageSelect（画像選択・表紙プレビュートリミング・選択済み末尾並び替え・spreads state管理）
- [x] Preview（ページめくりアニメーション・表紙/裏表紙/見開き遷移）
- [x] Preview：/ehon/:token フロー統合（ウォーターマークなし・PDFダウンロード）
- [x] Preview：PDFダウンロード機能（jsPDF・Canvas→PDF・2倍解像度）
- [x] ShareModal（X / LINE / Instagram）
- [x] Purchase（PDF/製本選択・購入者情報入力・確認チェックボックス・Stripe遷移）
- [x] mock.js：spreads に img 埋め込み（裏表紙は null）
- [x] jsPDF インストール（frontend/）

### セキュリティ
- [x] Nginx `/admin/` Basic認証（.htpasswd・chmod 644）

### その他フロント修正（2026-07-26）
- [x] 画面遷移時にスクロールトップ（ScrollToTop コンポーネント追加）
- [x] `?client=null&theme=null` 対応（paramError state・早期リターン・.catch 追加）
- [x] PDF ファイル名をタイトルに変更（`result.title`）

### 結合テスト対応（2026-07-24〜26）
- [x] sessionStorage 排除（Preview.jsx・Purchase.jsx）
- [x] mock.js 本番除外（`import.meta.env.DEV` ガード）
- [x] success_url → `/ehon/:token` フローに変更（sessionStorage不要化）
- [x] Stripe CLI 設定（`--forward-to` 指定・STRIPE_WEBHOOK_SECRET 更新）
- [x] Stripe 購入フォームへのメールアドレス事前入力（`customer_email`）
- [x] ホームボタンのURLパラメータ保持（success_url・download_url に `?client=&theme=` 追加）
- [x] メール署名改行修正（`white-space: pre-line`）
- [x] ダウンロードURLにホームパラメータ追加（callback view）
- [x] PDFファイル名をタイトルに変更（`result.title`）

---

## 残タスク（α版）※優先順

### 1. Contact フォーム
- [x] Contact.jsx：お問い合わせフォーム実装（ContactFormコンポーネント + ページ）
- [x] POST /api/contact バックエンド実装（SES送信）
- [x] ヘッダー・フッター実装（ContactModal呼び出し含む）

### 2. ホームボタン確認ダイアログ
- [x] /preview・/purchase・/ehon 遷移中にホーム（ロゴ・フッター）押下時、confirm ダイアログを表示

### 3. 結合確認
- [x] /api/generate 疎通確認
- [x] Stripe Checkout → Webhook 決済フロー確認
- [x] メール送信確認（SES 本番送信・迷惑メール振り分け確認）
- [ ] スマホ・各ブラウザ動作確認（リリース後に実機確認）

### 4. APIエラー汎用化（セキュリティ必須）
- [x] APIエラーレスポンスを汎用メッセージに統一（詳細エラー非表示）

### 5. ポリッシュ
- [x] drawSpread：テキスト半透明領域の角丸化
- [x] Preview：ページめくりアニメーション再実装（flip_wrap 方式）

### 6. セキュリティ（リリース直前）
- [x] pip-audit / bandit → GitHub Actions で自動化済み
- [x] `python manage.py check --deploy` → 実行完了・production.py に SILENCED_SYSTEM_CHECKS 追記・SECRET_KEY 再生成

### 7. CSS（最後）
- [x] CSS：全画面一から作り直し（共通ボタン統一・クラス名アンダースコア）
- [x] Preview：ページめくり時にSE再生

---

## SengokuLabo サイト

- [x] `sengoku-labo.com` サイト構築
- [x] Stripe本番審査承認済み
- [ ] POST /api/contact エンドポイント実装（Contactフォームとセット）
- [ ] `sengoku-labo.com` ConoHaへデプロイ
- [ ] `ehongotoseed.jp` ドメイン取得

---

## β版以降

- [ ] AI生成制限（1ユーザーあたりの生成回数上限）
- [ ] NGワードチェック実装
- [ ] Django管理者アカウントに二要素認証
- [ ] Client モデル追加・auth.py 汎用化（BtoB展開時）
- [ ] 追加テーマ
- [ ] PayPay対応
- [ ] 製本の自動化
- [ ] 複数部数対応（qty パラメータ追加・サーバー側で price × qty 計算）
- [ ] ギフト梱包オプション（製本時のみ・追加課金・メッセージカード同梱）
  ※ α版：ラクスル経由でそのまま郵送
  ※ β版：プレゼント用梱包 + メッセージカードの追加サービスとして提供
