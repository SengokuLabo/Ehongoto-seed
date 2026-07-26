# 会話履歴

## 2026-04-14

### 話した内容
- 前回の会話の続きを確認しようとしたが、記録が残っていなかった
- 会話を引き継ぐ方法を検討
  - CLAUDE.md に追記する方法
  - docs/ にドキュメントを残す方法
  - メモリに記憶させる方法
- docs/talk.md に会話履歴を保存するルールを決定
- トークン使用はできるだけ抑えたい（大量使用前は事前確認）

### サービス概要
- 絵本メーカー（仮称）を新規開発
- エホンゴト（既存サービス）へのフロントサービス
- B2C、ブラウザ完結

### エホンゴトとは
- 想いを絵本にするサービス、クラファンで製作費を募る（wix運用）
- 目標100冊、現状6冊目

### 絵本メーカーの概要
- 質問回答 → AI文章生成 → 画像選択 → 絵本自動生成
- ダウンロード・製本で収益化
- エホンゴトへの誘導が最終目的

### 決定事項
- 画像：事前用意したイラストから選択（AI生成なし）
- 顔パーツ：髪・目・鼻・口を選択 → レイヤー合成（AI不要）
- PDF：期限付き保存（期間は後で決定）
- AI：コスト優先（Haiku等の安価モデル）
- 品質：中程度（エホンゴトへ誘導するため意図的）
- 製本：外部サービス連携、API対応があれば自動化

### ユーザーフロー（確定）
1. wix（質問回答）
2. 絵本メーカーAPIへ送信
3. 絵本メーカー画面：Canvasでプレビュー表示（モザイクあり）
4. SNSシェア：表紙1枚をCanvas生成→サーバー保存なし
5. Square決済（絵本メーカー側に組み込み）
6. 購入後：PDF生成・30日間保存、モザイクなしプレビュー＋DL可能

### 技術方針（確定）
- プレビュー・顔合成・SNSサムネ：Canvas（ブラウザ側、サーバーコストなし）
- PDF生成：購入時のみサーバー側で実行
- 決済：Square SDK（絵本メーカー側に組み込み）
- wixは質問フォームのみ担当（将来的に独自フロントエンドへ移行検討）
- エホンゴトはwix継続（移行コスト・リスクに見合わないため）

### 価格設定（確定）
- PDFダウンロード：300円程度（ハードル低め）
- 製本：2,500〜3,000円（満足度高い層向け、エホンゴト誘導は期待薄）
- DL期間：30日

### 絵本構成（確定）
- ページ数：10ページ未満
- 構成：表紙・起・承・転・結・裏表紙
- タイトル：AI自動生成＋ユーザー編集可能
- SNSサムネ：表紙（顔合成＋タイトル＋キャッチコピー）

### ビジネスモデル
- ファネル構造：絵本メーカーDL（300円）→ 製本（2,500〜3,000円）→ エホンゴト（自己負担5万円〜）
- エホンゴトの製作費：総額50万円（自己負担5万円＋クラファン45万円）
- 絵本メーカー単体の黒字化より、エホンゴトへの誘導装置として位置づけ

### コスト概算（確定）
- 変動費：1冊あたり2〜4円
- インフラ固定費：エホンゴトと共有のため絵本メーカーの実質追加コストは変動費のみ
- 月50冊の場合：〜175円/月
- 初期想定利用者数：月2桁（10〜99冊）

### 未確定事項
- 製本サービス選定（API連携候補：TOLOT等）
- 将来対応：シーズナルテンプレート、ページめくりプレビュー、独自フロントエンド、管理画面

---

## 2026-04-14（続き）

### DB設計（確定）

- docs/db-design.md に保存済み
- テーブル構成：books / book_pages / answers / images / face_parts
- ページ構成：全テーマ共通7ページ固定（表紙1＋本文6）
- イラスト：page_num × pattern（smallint）で管理、デフォルトpattern=1
- answers：保存期限なし、削除処理なし（容量影響小のため）
- 決済前データは保存しない（booksはpaid以降のみ）
- 画像はサーバーパスのみ保持、APIにバイナリを含めない

### 共通ルール追加（~/.claude/CLAUDE.md）

- テーブルインデント統一するが2byte文字の精密計算は不要
- 時間がかかるが費用対効果が低い作業は事前確認

### 次回

- API設計に進む（→ 完了）

---

## 2026-04-14（API設計）

### API設計（確定）

- docs/api-design.md に保存済み
- エンドポイント4本に整理
  - POST /api/generate（AI生成＋顔パーツ・イラスト一括返却）
  - POST /api/payment（決済＋保存＋PDF生成）
  - GET /api/books/{token}（購入済み絵本データ）
  - GET /api/books/{token}/pdf（PDFダウンロードURL）
- 決済前データはクライアント保持（案A採用）
- 金額はサーバー固定（pdf=300円 / book=3000円）
- wix認証：X-Api-Key＋X-Timestamp（5分以内）
- メール送信：AWS SES（月99通以下、コスト無視レベル）
- PDF生成：決済後に同期生成

### 未確定事項

- answersのキー名（wixフォーム設計が決まれば確定）

### 次回

- 画面設計 or 実装フェーズに進む（→ 画面設計完了）

---

## 2026-04-15（画面設計・仕様更新）

### 技術確定

- フロントエンド：React（SPA）
- ドメイン：maker.ehongoto.jp（サブドメイン）
- 画面遷移：別画面（iframe不採用）
- Square決済：Square Checkoutに遷移、住所もSquare側で収集

### 画面設計（確定）

- docs/image.md に保存済み
- 画面構成：プレビュー / SNSシェアモーダル / 決済 / PDFダウンロード / 製本完了
- SNSシェア：X / LINE / Instagram（Instagram はアプリ起動誘導）
- 住所入力：製本時のみ表示
- モザイク：プレビュー・決済画面はあり、購入後はなし
- ページ送り：工数確認後に判断

### DB設計更新（確定）

- buyers テーブルを新規追加（name / email / post / ship_addr / mail_ok）
- books から name / email を削除、buyer_id / book_type を追加
- status：paid / expired / ordered に整理（pdf_ready 廃止）
- 製本サービス：α版は手動対応（TOLOT API 2018年終了のため）

### タスク管理

- docs/task.md を新規作成

### 残タスク（→ すべて完了）

- API設計の見直し（DB変更の反映）→ 完了
- wixフォームのキー名確定（q1, q2…連番キーに統一）→ 完了
- ページ送り工数確認（α版は単純切り替えで確定）→ 完了

---

## 2026-04-15（DB・API追加更新）

### テーマ複数対応（確定）

- フロント商品①：人生年表ワーク自動生成ツール
- フロント商品②：人生プロフィール自動生成ツール
- 絵本メーカーと同一プロダクト、テーマ違いのみ
- 対象ユーザー：大人含む
- 価格：テーマ別変動なし（ページ数変動時のみ検討）

### DB更新（確定）

- books に `theme` / `price` カラム追加
- answers.data のキーは `q1, q2…` の連番で統一
- 質問マスターテーブルはα版不要（wix側で管理）

### API更新（確定）

- /api/generate：`theme` 追加、answers キーを連番に変更
- /api/payment：`theme` 追加、レスポンスに `price` 追加

### 次回

- 非エンジニア向け説明資料をHTMLで作成（ブラウザ閲覧用）
- ehongoto.jp のデザイン・カラーに合わせる
- 構成：サービス概要 / ユーザーフロー / 画面構成・ワイヤーフレーム / ビジネスモデル / 技術構成 / ロードマップ

### インフラ構成（確定）
- EC2：エホンゴトの既存t3.microに相乗り
- RDS：エホンゴトの既存インスタンスを共有、ehonmaker_dbを新規作成
- Djangoプロジェクト：別プロジェクトとして独立
- 将来のデータ連携：同一RDS内参照 or API連携で対応
- メモリ不足になった場合はt3.smallへアップグレード（新規追加と費用ほぼ同じ、管理シンプル）

---

## 2026-04-15（説明資料・工数見積もり）

### 社内説明資料（確定）

- docs/presentation.html を作成
- 対象：社内向け（非エンジニア）
- 構成：役割分担の前提 / サービス概要 / 利用の流れ / 画面イメージ / wix担当範囲 / 収益の仕組み / 開発の注意点 / リリース計画
- 色分け：wix担当＝青、絵本メーカー担当＝オレンジ
- レスポンシブ対応済み
- ehongoto.jp のデザイントーンに合わせた温かみある配色

### 主な仕様

- 役割分担の前提をページ上部に明記（wixは質問フォームのみ、以降は別ドメインでエンジニア担当）
- エホンゴトへの誘導は全画面（プレビュー・SNSシェア・購入選択・購入完了）に表示
- SNSシェア：表紙サムネイルを添付してシェア可能と明記
- wix側の画面イメージ（青色）を追加
- 「開発・運用時の注意点」として複雑性をやんわり伝える内容に
- wix担当範囲：質問フォームの配置のみ（データ送信はエンジニア担当）、実装中の仕様変更可能性も記載
- コスト概算は非公開（削除）

### 工数見積もり（α版）

- バックエンド：7〜9人日
- フロントエンド：7〜9人日
- インフラ：1〜2人日
- テスト：2〜3人日
- 合計：約17〜23人日（余裕を見て25人日で想定）
- 難易度高：Canvas処理（顔パーツ合成・ぼかし）、Square連携、PDF生成

### 次回

- 環境構築から開始（Docker：Django / React / Nginx）

---

## 2026-04-16

### 仕様追加・確定

- エラー処理方針確定
  - AI生成失敗：自動リトライ1回 → 再失敗でユーザーにやり直し案内
  - PDF生成失敗：自動リトライ1回 → 再失敗でユーザーに案内 + 管理者メール通知
  - Square Webhook未着：Square側の自動リトライに任せる
- 購入前の確認チェックボックス追加（DL有効期限30日間の確認）
- 期限切れ再DLは基本再購入
- トークン形式：UUID v4に確定
- 顔パーツ・イラスト：EC2ローカル + Nginx配信
- メール文言確定（PDF購入完了・製本確認・製本管理者通知の3種）
- buyersテーブルにphoneカラム追加
- 決済方式：Square Checkout確定（カード情報はSquare管理）
- 購入者情報（住所・名前・電話番号）はこちらのUIで収集・サーバーに保存
- 銀行振込は対象外。PayPayはα版後に検討
- Apple Pay / Google PayはSquare Checkoutに含まれるため追加実装不要

### 環境構築完了

- Dockerファイル一式作成（docker-compose.yml / docker-compose.prod.yml）
- Django設定分割（base / local / production）
- Nginxセキュリティ設定（レート制限・セキュリティヘッダー・メディア配信）
- フロントエンドスケルトン（Vite + React）
- .gitignore / .env.example

### APIテスト準備完了

- docs/api-spec.yml 作成（OpenAPI 3.0）
- Prismモックサーバーで動作確認
- Square Checkoutフローに合わせてAPI設計を修正
  - POST /api/payment：checkout_url返却に変更
  - POST /api/payment/callback：新規追加（Webhook受け口）
  - エンドポイント計5本

### 次回

- .env実値設定 → Docker起動確認
- Djangoモデル実装 → マイグレーション
- APIの実装（generateから順番に）

---

## 2026-04-16（フロントサンプル作成）

### 作成ファイル
- src/mock.js（APIレスポンス想定サンプルデータ）
- src/utils/drawFace.js（Canvas顔描画ユーティリティ）
- src/components/BookCanvas.jsx（1ページCanvasレンダラー）
- src/components/FaceComposer.jsx（顔パーツ選択UI）
- src/styles/preview.css（ページめくりアニメーション）
- src/pages/Preview.jsx（プレビュー画面本体）

### 確定事項
- ウォーターマーク：blurではなく斜め"sample"テキスト繰り返し
- ページめくり：見開き形式（左右2ページ）、CSS 3D rotateY によるフリップカード実装
- 表紙スプレッドは左側なし（右側のみ表示）
- 顔パーツ選択はリアルタイムでCanvas更新（プレースホルダー描画なので軽量）
- 実画像になったら ctx.drawImage() への差し替えが必要
- フロントのサンプルはAPIレスポンスをmock.jsと同じ構造で渡せばそのまま動く

### 顔パーツ配置（保留）
- ページ別に face_config { x, y, size, rotate } を持たせる設計で合意
- イラストが揃ってから設定値を決める
- DBではなく静的設定ファイルで管理（α版）
- 管理画面はα版後（task.mdに追加済み）

### 次回
- 顔パーツ配置の実装（face_config 対応、数十行）
- .env実値設定 → Docker起動確認
- Djangoモデル実装 → マイグレーション

---

## 2026-04-16（フロント画面構成完成）

### 画面フロー確定

- ImageSelect（`/`）→ FaceSelect（`/face`）→ Preview（`/preview`）
- Purchase・Downloadはスタブのまま（バックエンド待ち）

### 作成・更新ファイル

- src/pages/ImageSelect.jsx（新規）：ページごとにA/B/Cパターン選択
- src/pages/FaceSelect.jsx（新規）：FaceComposer + 表紙リアルタイムプレビュー
- src/styles/imageselect.css（新規）
- src/styles/faceselect.css（新規）
- src/pages/Preview.jsx（改修）：FaceComposer削除・モバイル対応・タイトル更新ボタン
- src/components/BookCanvas.jsx（改修）：title prop追加、表紙にタイトル描画
- src/styles/preview.css（改修）：戻るボタン・タイトル更新ボタン・モバイルスライドアニメーション追加
- src/App.jsx（改修）：3画面ルーティングに更新

### 確定事項

- タイトル：入力フィールド + 「更新」ボタン（確定時にCanvasとSNSサムネに反映）
- モバイル（<640px）：1ページ表示 + translateX スライドアニメーション
- デスクトップ：見開き2ページ + 3D フリップアニメーション（変更なし）
- 顔パーツ選択はFaceSelect画面に独立（Previewには表示しない）
- navigation state で face・selectedImages・pages を画面間で受け渡し
- 戻るボタン：navigate(-1)でブラウザ履歴ベース（stateも保持される）
- 画像・顔パーツは実素材が揃ったらctx.drawImage()に差し替え予定

### 次回

- .env実値設定 → Docker起動確認
- Djangoモデル実装（buyers / books / book_pages / answers / images / face_parts）→ マイグレーション
- APIの実装（generateから順番に）

---

## 2026-04-18〜23（方針・ビジネス整理）

### α版方針の見直し

- α版リリースに絞った実装優先に変更
- Client・Questionモデルはα版後に回す（task.md更新済み）
- 決済（Square）実装を一旦スキップ、generate APIから先に着手

### BtoB展開の方向性（確定）

- 「売っていく」＝システム販売ではなくサービス提供（BtoB SaaS的）
- 横展開のための追加実装：+10〜15人日（外注換算50〜90万円相当）
- Client・Questionテーブルの設計は完了済み、α版後に実装

### Squareアカウント方針（確定）

- 決済アカウントは自分名義で進める（法人のSquareは使わない）
- 売上は自分のアカウントに入り、分配は別途振り込む形にする
- 他の社員への説明は実装の流れとして開示予定

### 権利・分配（未確定・要会話）

- 著作権は自分に帰属させたい方向（他の社員も了承見込み）
- 収益分配率は未決定（3人で合意が必要）
- 業務委託契約＋著作権帰属明記を書面化したい
- タイミングを見て3人で会話予定
- 外注換算費用：約50〜60万円（時給2,500〜3,000円 × 200時間）
- 横展開モデル：パターンAのみに確定（集金は開発者、事業者はライセンス料を払いフロント商品として使う）

### モデル変更（確定）

- Themeモデルに prompt / price_pdf / price_print 追加（BtoB汎用化）
- Client / Questionモデルの設計確定（α版後に実装）
  - Client：id / name / api_key（unique, null許可）/ is_active / created_at
  - Question：id / theme_id / sort / text / placeholder
  - api_keyはnull許可でユニーク制約あり（NULL同士は制約違反にならない）
- Bookに client FK 追加予定（α版後）
- Themeに client FK 追加予定（α版後）

### 次回

- generate API完成（顔パーツ・イラスト返却部分、レスポンス組み立て）
- 決済は後回し

---

## 2026-04-17（バックエンド実装）

### 完了事項

- Django admin画面セットアップ（urls.py / settings / nginx / static）→ 起動確認済み
- Djangoモデル実装（Buyer / FacePart / Theme / Image / Book / BookPage / Answer / PendingBook）→ マイグレーション完了
- apps/books/ai.py 作成（generate_story関数、Anthropic claude-haiku-4-5使用）
- Square Checkout連携設計・.env登録済み

### モデル変更（本日）

- Themeモデル新規追加（name / year / created_at）
  - year：シーズンもの想定、null=True
  - __str__ 実装済み
- Image.theme：ForeignKey(Theme, PROTECT) 追加
- Book.theme：CharField → ForeignKey(Theme, PROTECT) に変更
- Book.STATUS_NOPAID を BOOK_STATUS choices に追加
- db-design.md 更新済み（themesテーブル追加・images/booksの定義更新）

### マイグレーション備考

- Image.themeのカラム追加時、既存マイグレーション履歴との兼ね合いで一時デフォルト値(1)の指定が必要
  - データなしの状態でも ALTER TABLE のため発生する。`1` を入力して続行でOK

### 次回

- generate ビュー実装（ai.py統合 / face_parts・images DB取得）
- payment ビュー実装（Square Checkout URL発行 / DB保存）
- callback ビュー実装（Webhook受け口）
- urls.py にpayment/callbackルーティング追加

---

## 2026-04-22〜24（バックエンド実装続き）

### 完了事項

- generate ビュー完成（Theme取得 / AI生成 / face_parts・images返却）
- payment ビュー実装（PendingBook仮登録 / checkout_url はTODO）
- callback ビュー実装（PendingBook取得 / DB保存 / pending削除）
- book_detail ビュー実装（token照合 / pdf_exp期限チェック）
- book_pdf ビュー実装（pdf_expで期限判定 / CloudFront署名付きURLはTODO）
- urls.py 確認済み（全5エンドポイント登録済み）
- Client モデル追加（name / email / logo / api_key / is_active）
- Theme に client FK追加（PROTECT）
- Question モデル追加（本家エホンゴト以外向け）

### 決定事項

- メール送信：運営メール固定 / Reply-Toでサービスメール変更
- From表示名はサービス名、ロゴもサービスロゴで不信感を軽減
- ロゴはEC2ローカル管理
- FacePart はサービス横断の共通マスタ
- 決済方法は未確定（Square or Stripe）→ payment/callbackのTODO箇所を後で差し替え
- NGワードチェック・顔パーツ配置設定は引き続き先送り

### 次回

- SESメール実装（send_mail関数 / callbackから呼び出し）
- PDF生成（WeasyPrint）
- db-design.md 更新（clients / questions テーブル追加）

---

## 2026-04-24（PDF生成方針確定）

### 決定事項

- PDF顔パーツ合成：HTMLレイヤー重ね（WeasyPrint）に確定
  - Canvas合成（フロント）はプレビュー表示専用
  - PDF生成はサーバー側で完結（フロントから画像送信不要）
  - face_config（座標）はα版ではコードに固定値でハードコード
  - α版後に管理画面でDB管理へ移行予定
- 製本購入者もPDFダウンロード可能（製本はPDFの上位互換）
- PDFはEC2ローカル保存（/media/pdfs/）、期限切れファイルは定期削除が必要
- 追加工数はCanvas合成フロント実装が不要になる分と相殺でほぼ同等
- フロントのページめくりアニメーション・Canvasプレビューはそのまま使用可

### 次回

- face_config 設計（ページ別・パーツ別の座標定義）
- WeasyPrint HTMLテンプレート作成
- PDF生成ロジック実装（callback内）
- db-design.md 更新（clients / questions テーブル追加）

---

## 2026-04-24（FaceConfig管理画面・顔パーツ設計）

### 完了事項（フロント）

- FaceConfig管理画面（/face-config）作成
  - BookCanvas width=360, height=504 に拡大
  - cx / cy / size 全体調整コントロール追加
  - パーツ個別 X方向（dx）・Y方向（dy）コントロール追加
  - 「設定をコピー」でクリップボードに出力
- drawFace.js 更新
  - dx / dy 両軸オフセット対応（offsets: { dx, dy } 形式）
  - 描画順変更：顔ベース → clip（目・鼻・口・ほっぺ）→ restore → 髪（前面）
  - 目のdxはペア移動（cx + dx + sign * ex）に修正
  - 目・鼻・口は顔円の外に出ると非表示（ctx.clip）

### 設計決定事項

**パーツサイズ調整**
- α版では対応しない
- 素材（PNG）が確定した後に需要が出たら追加検討

**球体モデル（顔の向き管理）**
- キャラの向きをイラストに合わせたいため採用決定
- 実装方式：簡易球面投影（追加ライブラリなし / Canvas 2Dで完結）
- ランニングコスト追加ゼロ
- face_config に yaw / pitch を追加してページごとに向きを指定
- PNG素材は正面・斜め・横・後ろ（髪のみ）の最大4枚で管理
- 左右は鏡像で使い回し

**素材枚数（パーツごとの必要PNG数）**
- 髪：4枚（正面・斜め・横・後ろ）
- 目・鼻・口：各1枚（球体モデルがcanvas transformで変形して対応）
- 耳：2枚（斜め・横 / 正面・後ろは非表示）

**髪色・肌色カスタマイズ**
- 髪型と髪色を独立して選べるように変更
- 選択方式：プリセット固定
- 髪色：7色プリセット（黒 / 焦げ茶 / 茶 / 金 / 赤茶 / グレー / 白）
- 肌色：5色プリセット（色白 / 普通 / 小麦色 / 褐色 / ダーク）
- 横展開（白人・黒人対応）を考慮した5パターン

### 未確定事項

- 球体モデルの実装タイミング（素材が揃うまで保留）
- PNG素材の自前制作方針（正面・斜め・横の3角度参考あり）

---

## 2026-04-25〜27（app名変更・PDF生成方針変更）

### 完了事項

- app名を `books` → `ehon` に変更
  - ディレクトリ・settings・urls・imports すべて更新済み
  - DBリセット → マイグレーション再実行（0001_initial 再生成）
- モデル更新（FacePart: label / angle追加、Book: hair_color / skin追加、Image: yaw / pitch追加）
- マイグレーション完了
- views.py 更新（generate / callback / book_detail）
- api-design.md 更新（/api/books → /api/ehon、hair_color / skin / yaw / pitch追加）
- db-design.md 更新（clients / questions / pending_books追加、全テーブル最新化）

### PDF生成方針の変更（確定）

- **サーバー側（WeasyPrint）→ クライアント側（jsPDF）に変更**
- Canvas描画結果をそのままPDF化するため、球体管理・顔パーツ合成に影響なし
- 2倍解像度（192dpi）で約1MB → SNS・保存用途で問題なし
- 削減工数：約3〜4日（WeasyPrint実装 / EC2ストレージ管理 / CloudFront署名URL等が不要）
- `ehon_pdf` エンドポイント廃止

### 削除・不要になった作業

- WeasyPrint 設定・HTMLテンプレート
- サーバー側顔パーツ合成ロジック
- EC2 PDFストレージ管理・定期削除
- CloudFront署名付きURL実装
- `GET /api/ehon/{token}/pdf` エンドポイント

---

## 2026-04-27（バックエンド完了）

### 完了事項

- views.py 整理（不要コメント削除・連番修正）
- Square決済スケルトン実装
  - payment：`squareup` ライブラリで Checkout URL発行（`pending_obj.token` を `reference_id` に渡す）
  - callback：署名検証スケルトン（`X-Square-Hmacsha256-Signature`）
  - callback：Webhookペイロードから `reference_id` 取得（イベント種別確認後にパス修正が必要）
- `squareup` を requirements.txt に追加（`44.*`）
- SES：すでに本番アクセス済み（日次50,000通・Sandbox解除不要）

### 決定事項

- ヘルスチェック（`GET /`）：ALB導入時まで不要、後回し
- マスターデータ投入コマンド：α版はadmin画面で対応、横展開が現実的になってから実装
- callback のメール：製本の運営通知メールに token URL を含めれば ehon_data 1本で対応可能

### 残作業（テスト時に対応）

- Square Webhookのイベント種別確認（`payment.completed` or `checkout.order.completed`）後にcallback内のtokenパスを修正

### 次回

- フロントエンド実装（別セッションで進める）

---

## 2026-05-01〜02（決済をStripeに変更・admin画面整備）

### 決定事項

- 決済サービスをSquare → **Stripe**に変更（Stripe本番審査承認済み）
- Stripe Checkout Sessions採用（毎回動的生成のため）

### 完了事項

- views.py：Square → Stripe対応
  - import：`squareup` → `stripe`
  - `stripe.api_key` をモジュール定数部分に移動
  - payment：`stripe.checkout.Session.create`（metadata.tokenでpendingと紐づけ）
  - callback：`stripe.Webhook.construct_event` で署名検証、`checkout.session.completed` イベントのみ処理
- requirements.txt：`squareup==44.*` → `stripe==12.*`
- docs/api-design.md：Square → Stripe記述更新
- 管理コマンド `load_master.py` 作成（`BaseCommand` クラス形式）
  - Client（えほんごとのたね）・Theme（life_timeline）を `get_or_create` で登録
- admin.py 整備
  - Client / Theme / Question / FacePart / Image / Buyer / Book / BookPage / Answer / PendingBook 登録
  - `list_display` / `list_filter` / `ordering` / `inlines` 設定
  - カスタムメソッドは `list_display` のみ有効（`ordering` / `list_filter` はDBフィールドのみ）

### 残作業

- load_master.py に FacePart・Image のプレースホルダー登録追加（素材PNG準備後）
- success_url / cancel_url を実際のURLに差し替え（フロント実装後）
- Stripe Webhook動作確認（テスト時）

---

## 2026-05-03〜04（admin.py整備・バックエンド完了）

### 完了事項

- admin.py 全モデル実装完了・画面表示確認済み
  - インライン：ThemeInline / QuestionInline / BookPageInline
  - 全モデル登録：Client / Theme / Question / FacePart / Image / Buyer / Book / BookPage / Answer / PendingBook
- load_master.py を `BaseCommand` クラス形式に修正・動作確認済み
  - Client（えほんごとのたね）・Theme（life_timeline）登録確認済み

### 決定事項

- FacePart・Imageの初期データ登録はadmin画面から行う（PNG素材が揃ってから）
- admin画面のモデル並び順変更は優先度低のためスキップ
- バックエンド実装は一旦完了、次はフロントセッションへ

### バックエンド残作業（テスト・フロント実装後に対応）

- FacePart / Image をadmin画面から登録（PNG素材準備後）
- success_url / cancel_url を実際のURLに差し替え（フロント実装後）
- .env の `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` 実値設定
- Stripe Webhook動作確認（テスト時）

---

## 2026-05-04（API追加・バックエンド完了）

### 完了事項

- GET /api/questions 実装（クライアント名・テーマ名・年でフィルタ、質問一覧を返却）
- generate API の wix認証（check_wix_request）削除（wix連携廃止のため）
- docs/api-design.md 更新（wix認証削除・questions追加・Square→Stripe・廃止エンドポイント削除）
- docs/task.md 更新

### バックエンド実装完了

次はフロントエンドセッションへ。

---

## 2026-04-29（社内合意・方針確定）

### 社内合意（確定）

- 著作権（サービス資産）：開発者に帰属
- 決済アカウント：開発者自身のSquare（法人のSquareは使わない）
- 質問フォーム：wix依存解消・こちらで実装（α版後 → α版内に前倒し）
- 権利・分配の会話タイミング：今後3人で合意予定

### 決済サービス（Square継続確定）

- Square継続（payment/callback 実装済みのため乗り換えコストなし）
- 手数料：3.25%（Stripe3.6%・PAY.JP3.0〜3.25%と大差なし）
- 複数サービス対応：Squareの「ロケーション」機能で1アカウント管理

### 質問フォーム内製化（確定）

- QAサンプル：QAList.txt（人生年表ワーク）
- 質問数：6章 × 2〜6問 = 計22問
- カスタマイズ：4項目（トーン・主人公視点・読者ターゲット・ラストの余韻）
- AIプロンプト：QAList末尾のサンプル文をベースに ai.py を調整
- フロントに質問フォーム画面を追加（6章ステップUI形式）
- generate APIのwix認証（check_wix_request）削除を検討

### 顔パーツ方針（確定）

- スプライト方式（前・横・後ろ3パターン、左右は反転使用）
- 1色描画 → Canvas側で色変更（髪色7色・肌色5色プリセット）
- 描画アプリ：Krita（無料）またはClip Studio Paint（有料）推奨

### 次回

- Squareアカウント作成・ロケーション設定
- フロントエンド実装：質問フォーム画面（第3段階に追加）

---

## 2026-04-30（Square → Stripe切り替え決定）

### 決定事項

- 決済サービス：Square → **Stripe** に変更
- 理由：Squareアカウント権限問題（管理対象なし）+ 将来のBtoB・サブスク拡張性
- 手数料差（0.35%）は無視できるレベルと判断
- Stripeアカウント作成完了（テストモード）
- 機能選択：単発の決済・継続課金を選択

### 修正タスク

- `requirements.txt`：squareup削除 → stripe追加
- `views.py`：payment（Checkout Session発行）・callback（Webhook署名検証）書き直し
- `.env.example`：SQUARE_* → STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET

### ドメイン・サイト構成（確定）

- `sengoku-labo.com`：Stripe審査用 + BtoBプラットフォーム（取得済み）
- `ehongotoseed.jp`：えほんごとのたね本サービス（新規取得予定）
- サブドメイン方式は不採用（BtoCユーザーのドメイン違和感を避けるため）
- お問い合わせフォーム：Django + SES（Googleフォーム不採用・拡張性優先）

### sengoku-labo.com 構成

- トップ：SengokuLabo概要・提供サービス一覧
- えほんごとのたね：BtoBプラン・料金
- お問い合わせ：フォーム（POST /api/contact）
- /legal：特定商取引法・返金ポリシー・プライバシーポリシー

### sengoku-labo.com 構築完了

- PHP + config.php（変数一元管理）で構築
- ファイル構成：index / contact / legal / register / dashboard / header / footer
- CSS命名規則：ハイフン禁止・アンダースコア統一（CLAUDE.mdにも反映）
- ConoHaにデプロイ予定（追加コストなし）
- contact.phpの送信先：/api/contact（Django実装は後回し）

### Stripe審査・設定完了

- 本番審査：承認済み（2026-05-01）
- 決済UI：構築済みの決済フォーム（Stripe Checkout）を選択
- テストモードで開発継続、本番切り替えはえほんごとのたねリリース直前

### 次回

- backendセッションでStripe実装（payment / callback）に着手
  - requirements.txt：squareup → stripe
  - views.py payment：stripe.checkout.Session.create()に書き直し
  - views.py callback：Stripe Webhook署名検証に書き直し
  - .env：STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET 追加

---

## 2026-05-04（フロントセッション）

### バックエンド完了
- 実装はひと通り完了（詳細は上記セッション参照）

### Image テーブル設計変更（確定）

- `yaw` / `pitch` を廃止（旧：3D球体管理想定の名残）
- `angle` 追加（enum: front / 45 / side / back、FacePart.angle と統一）
- `x` / `y` / `size` 追加（Canvas上の顔中心座標＋サイズ）
- models.py 更新済み、db-design.md 反映済み
- face_parts.angle の enum 値も `diagonal` → `45` に統一（doc修正）

### FaceConfig ツール（/face_config）
- ルート名のハイフンを修正予定（`/face-config` → `/face_config`）
- 出力する JSON を `{ angle, x, y, size }` に変更予定
- ページ切り替えはなし（イラストが揃ってから各ページで調整する運用）

### 完了事項
- FaceConfig ルート名修正（`/face-config` → `/face_config`）
- FaceConfig 出力形式変更（`{ angle, cx, cy, size, offset }` に統一）
- drawFace.js / BookCanvas.jsx のオフセットキー修正（`offsets`/`dx`/`dy` → `offset`/`ox`/`oy`）
- views.py 修正（`yaw`/`pitch` → `angle`/`cx`/`cy`/`size`/`offset`）
- DBリセット → マイグレーション再実行（0001_initial）→ load_master 再実行
- db-design.md / api-design.md 更新済み

### 次回
- フロント画面の実装（API連携）
- FacePart / Image は PNG 素材完成後に admin から登録

---

## 2026-05-04（画面設計見直し）

### 画面フロー確定

```
質問フォーム → generate API → 顔パーツ選択 → 背景選択 → プレビュー
    └─ SNSシェア（モーダル）
    └─ 購入（Stripe）→ ダウンロード
```

### Image テーブル設計変更（確定）

- `page` / `pattern` カラム削除
- テーマごとに20枚程度用意・ページ固定なし・同一画像の複数ページ使用可
- 物語テキストを見ながらページごとに画像を選択するUI
- models.py 更新済み・db-design.md / api-design.md 反映済み

### 背景選択UIの方針

- ページごとに物語テキスト表示
- 20枚の画像から1枚選択
- 顔パーツ選択後に背景選択するため、選択中の顔を各画像サムネに合成表示する
- Canvas描画は軽量なため処理問題なし

### 次回

- バックエンドセッションで `GET /api/questions` 実装
  - Question モデルのデータ返却（sort順）
  - wix認証（check_wix_request）削除または代替検討
  - load_master.py に Question 初期データ追加（QAList.txt 22問）
- フロントセッションに戻ったら質問フォーム画面 → generate API 連携

---

## 2026-05-28〜2026-06-03

### 話した内容

#### コスト確認
- generate APIはclaude-haiku-4-5を使用
- Haiku 4.5料金: Input $0.80/MTok、Output $4.00/MTok
- 実測トークン: Input=713、Output=944（例文あり18ページ）
- 30回分の生成コスト ≈ 約20円（AIコストは実質無視できるレベル）
- ページ数18でもコスト問題なし

#### drawFace.js 改修
- colorize関数: 白→髪色、#ffcb4e→肌色のピクセル置換（Math.abs で両側判定）
- drawPng関数: w/h→s（1:1固定）、flipX引数追加（反転描画）
- colorizeをdrawPngの外に出してdrawFace側で事前変換
- 目の描画をdrawPng共通化（flipX=trueで左右反転）
- source-atop方式でオフスクリーンcanvasに描画→はみ出し非表示
- 鼻のflipX: ox('nose') > 0 の場合に自動反転
- eyのoyをdrawPngに渡す形に統一

#### FaceSelect実装（FaceComposerを統合・削除）
- パーツ切り替え: ボタン1つ押下で次のパーツに循環（shiftPart）
- 色切り替え: 髪色・肌色ボタン押下で次の色に循環（shiftColor）
- drawFace呼び出しにoffset={}、hairColor、skinColorを追加
- TABS定義をコンポーネント外に移動

#### hair_colors / skin_colors 修正
- DBのchoices: key=hex値、value=ラベル
- views.py: `{'label': v, 'color': k}` に統一（idフィールド廃止）
- mock.js: 同構造に合わせて更新

#### 仕様変更：見開き対応
- 表紙・裏表紙は単独ページ
- ストーリーページは2ページ1見開き（2-3、4-5...）
- 背景画像は偶数ページで管理、テキストは各ページで管理
- テキスト配置はマスクPNG方式（aaa.jpg → aaa_mask.png の命名規則）
- Canvasは横長（見開きサイズ）

#### ページめくりアニメーション
- CSS 3D transform方式（ライブラリ不要）
- rotateY + perspective + backface-visibility: hidden
- canvasをdivでラップしてrotateYをかけるだけ

#### 残タスク整理・工数見積もり
- 全体進捗: 約65%
- 残工数: 約30〜40h
- 最大ボリューム: Preview（見開き・ページめくり・マスクPNG・PDF）
- task.md更新済み

### 決定事項
- テキストトリミング（物理切り捨て）は不要
- AI生成制限はβ版対応
- NGワードチェックはβ版対応
- ClamAVはファイルアップロード実装時
- Django管理者2FAはβ版（管理者は本人のみ）
- セキュリティ3点はα版必須：APIエラー汎用化・Nginxベーシック認証・脆弱性診断

---

## 2026-06-14〜21（フロント実装・ナビゲーション修正）

### 完了事項

#### QuestionForm
- `location.state?.answers` / `location.state?.styleSelections` で戻り時の入力値復元
- `hasChanged`フラグによる差分検知（変更なしならgenerate APIをスキップして画面遷移のみ）
- `search: location.search`（クエリ文字列）をstateに含めてFaceSelectへ渡す

#### FaceSelect
- `location.state?.face` で顔パーツ選択状態を復元
- `location.state?.hairColor` / `location.state?.skinColor` で色選択状態を復元
- `hairColors` / `skinColors` をコンポーネント先頭で `result?.hair_colors ?? mockData.hair_colors` に統一（shiftColor内のmockData散在を解消）
- 全navigateで `{ ...location.state, face, hairColor, skinColor }` をスプレッドしてstate引き継ぎ
- `handlePre` で `'/' + (location.state?.search ?? '')` によりURLクエリ含むQuestionFormへ戻る

#### ImageSelect
- 全navigateで `{ ...location.state, imgIdx, coverIdx }` をスプレッドしてstate引き継ぎ
- 表紙選択時の`previewPages`を `[{ ...pages[0], img: selImg }, null]` に変更（BookCanvasの表紙モード発動のため）

#### BookCanvas
- `rPage === null && mask?.covArea` を表紙モード判定条件に
- 表紙モード時: `covArea`でクロップ＆全画面伸縮描画、顔座標をcovArea基準に変換
- 表紙モード時: テキスト描画スキップ（`!isCover` ガード追加）

### 決定事項

#### Preview再実装方針
- 現在のPreview.jsx（サンプル実装）は全削除して一から実装
- ページめくりアニメーション: CSS 3D flip（書籍らしいめくり）
  - 表紙: 1枚・センター配置（PW幅）→ めくると見開き・センター配置（PW*2幅）
  - 中ページ: 見開き↔見開きのフリップ
  - 裏表紙: 逆パターン（見開き→1枚・センター）
  - モバイルも同じめくりアニメーション（スライド廃止）
- BookCanvas引数は `pages`配列（2要素・片面はnull）、`hairColor`/`skinColor`を必須で渡す
- `imgIdx`/`coverIdx`からPreview側でpages再構築

#### ImageSelect coverIdx廃止（未実装・次回着手）
- `coverIdx`を廃止し`imgIdx`を`Array(maxStep + 1).fill(0)`に変更
- `imgIdx[maxStep]` = 表紙画像インデックス（coverIdx相当）
- `shiftCover`廃止、表紙ステップでも`shiftImg`を使用
- これがPreview再実装の前提となるため先に対応

### 優先順位

1. ImageSelect: coverIdx廃止・imgIdx統一
2. Preview: 全削除→再実装（アニメーション含む）
3. Purchase / Download: レビュー＋修正
4. PDFダウンロード実装（jsPDF）
5. セキュリティ対応（α版必須3点）

---

## 2026-07-05〜07

### 完了事項

- ImageSelect.jsx：imgIdx 廃止・result.spreads に img 埋め込み・spreads を state 管理
- Preview.jsx：imgIdx 除去・/ehon/:token フロー統合・loading/error 表示
- Purchase.jsx：imgIdx 除去
- views.py ehon_data：face_parts 追加・face を ID + camelCase（hairColor/skinColor）に変更
- views.py callback：img_id 取得を `(spread.get('img') or {}).get('id')` に修正
- mock.js：spreads に img 埋め込み（裏表紙は null）
- BookCanvas.jsx：描画ロジックを drawSpread.js に切り出し
- drawSpread.js：新規作成（描画ヘルパー関数 + drawSpread 本体）
- jsPDF インストール（frontend/）
- drawFace.js：colorize のアンチエイリアス修正（isGray + ratio ブレンド）
- drawFace.js：face_parts.angle 廃止・Image.oy 廃止
- drawFace.js：drawPng から oy 削除・チーク描写追加（ピンク円・両頬）
- drawFace.js：片目非表示ロジック追加（eth を size * 0.5 に変更）
- BookCanvas.jsx：表紙を高さ合わせ表示に変更（height 固定・width を W/2 に）

### 仕様変更・新規決定

- face_parts.angle：不要と判断し廃止（drawFace で未使用）
- Image.oy：常に0のため廃止
- チーク：顔パーツにチークを追加（DB追加なし・drawFace 内でピンク円描画）
- 表紙プレビュー：横幅合わせ → 高さ合わせに変更（BookCanvas + Preview の PW 修正）

### 外注相場・競合分析（参考）

- 企業依頼：200万〜1,500万（規模による）
- 個人依頼：80万〜300万
- 個人開発可能者：5〜10%（Canvas顔合成 + Stripe + AWS の組み合わせが希少）
- 競合参入リスク：大手は低（市場小）・スタートアップ1〜2年後・先行者優位あり
- 最大の参入障壁：絵本作家とのコネクション（技術より模倣困難）

### 進捗整理ルール（共通認識）

「進捗整理」を求められたら以下4点をセットで出すこと：
1. 全体進捗率（完了/総タスク数）
2. 残工数（時間・日数）
3. 前回比進捗率
4. 今回追加された工数

### 次回

- generatePdf 実装（Preview.jsx・jsPDF・drawSpread 活用）
- 関連確認事項：views.py ehon_data に book_type の追加が必要（PDF download ボタン制御用）
- face.hairColor / skinColor のキー名確認（ehon_data レスポンスが underscore になっていないか）

---

## 2026-07-09〜10（Nginx認証修正・残タスク整理）

### 完了事項

- Nginx `/admin/` Basic認証 500エラー修正
  - 原因：Dockerfileで `chmod 640` にしていたため、nginxワーカープロセス（nginxユーザー）が `.htpasswd` を読めなかった
  - 対策：`chmod 644` に変更してリビルド → 接続確認済み

### 残タスク整理（ソース確認済み）

以下は実装済みと判明（talk.mdの記録が古かった）：
- PDF生成：Preview.jsx:58-77 に実装済み
- FaceSelect generate連携：`result?.face_parts ?? mockData.face_parts` でフォールバック対応済み
- ImageSelect 選択済み末尾並び替え：`sortImgs` で実装済み
- book_type：製本でもPDFダウンロード可能のため不要と確定

### 実際の残タスク（優先順）

1. Contact.jsx 実装 + POST /api/contact
2. APIエラーレスポンス汎用化
3. 結合確認（generate→Stripe→メール）
4. スマホ・ブラウザ動作確認
5. drawSpread テキスト角丸
6. Preview アニメーション強化
7. 脆弱性診断
8. CSS全画面作り直し
9. SengokuLabo対応

### docs更新

- task.md：完了タスク反映・残タスク優先順整理
- requirements.md：技術スタック・フロー最新化
- db-design.md：face_parts.angle 削除・images.oy 削除・img_path備考追記
- api-design.md：face camelCase修正・oy削除・古いTODO注釈削除

---

## 2026-07-16（ページめくりアニメーション再設計）

### 問題の整理

現状の問題点：
- `[-1, 0, 1].map` の背景canvas群（見開き単位）と `flip_card`（めくれるカード）が別管理
- `isFlipping=true` と同時に `flip_card` が新規マウントされる
- `flip_front` の `drawSpread` が非同期のため約50ms透明期間が発生
- その間、背景の次ページcanvas（offset=1 right）が透けて見える（チラつき）

### 設計確定：ページ単位canvas管理 + コピー方式

#### 方針
- 見開き単位 → **ページ単位**（left/right）でcanvasを管理
- 常時6枚のcanvasを保持（現在の見開きの前後1見開き分）
- `flip_card` のcanvasへ `drawImage` でコピーして使用（チラつきゼロ）

#### 保持範囲
- `[step-1, step, step+1]` の見開き × 各2枚（left/right）= 計6枚
- `step` が変わったら2見開き以上離れたcanvasを解放

#### めくり時のcanvasの役割（next方向）

```
p1[固定・左]  p2[カード表]→  ←[カード裏]p3  [固定・右]p4
```

- p2（現在右）が左方向へめくれる（物理的な絵本の動き）
- 裏面にp3（次の左）が出てくる

#### チラつき解消の仕組み
1. 6枚のcanvasを事前に描画完了させておく
2. めくり時：描画済みcanvasの内容を `drawImage` で flip_card の新canvasへコピー（同期・高速）
3. コピー完了後にアニメーション開始 → 透明期間ゼロ

#### めくりガード
- 各canvasの描画完了フラグを管理
- コピー元が未描画なら操作を無視

### 技術的確認事項

| 懸念 | 結論 |
|------|------|
| canvasのDOM移動で描画が消える | コピー方式で回避済み |
| 3D flip効果のコンテナ（preserve-3d） | flip_card コンテナは残す |
| コピーコスト | drawImage は同期・ほぼ0ms |
| flip_card コピータイミング | useLayoutEffect で対応 |
| 表紙の特殊扱い | isCover 分岐で継続対応 |

### 変更ファイル（実装予定）

| ファイル | 変更内容 |
|---------|---------|
| BookCanvas.jsx | `onReady` コールバック追加（描画完了通知） |
| Preview.jsx | pages配列展開・6枚canvas管理・描画完了フラグ・flip関数修正 |
| app.scss | 大きな変更なし（flip_card関連CSS流用） |

---

## 2026-07-17〜18（ページめくりアニメーション設計確定）

### 設計の変遷

表紙↔見開きの幅変化アニメーションをどう実現するか議論。

- `outerW` state（book_outer 幅管理）は廃止のまま維持（book_outer 幅 W 固定）
- めくり中に outerW を変えると book_outer の左端が動き、flip_card の回転軸がズレる問題を確認
- transform-origin を途中で変える案は「回転が飛ぶ」リスクあり、不採用
- **flip_wrap（カード専用親要素）** を book_outer の flex child として追加する方式に確定

### 確定設計：flip_wrap 方式

| 要素 | 設定 |
|------|------|
| book_outer | 幅 W 固定、display:flex、justify-content:center |
| flip_wrap | flex child、min-width:W/2、width: wrapW state で管理、transition、overflow:hidden、visibility で表示切替 |
| flip_card | flip_wrap の子、position:absolute、left:0、幅 W/2 |
| fixRight | book_outer の absolute、isFlipping のみ表示 |

#### 動き

| 方向 | wrapW | 動き |
|------|-------|------|
| 開く（表紙→見開き） | 0 → W | 前半: min-width=W/2 で幅固定（表紙がめくれる）、後半: 幅が広がる（回転軸が左に移動） |
| 閉じる（見開き→表紙） | W → 0 | 前半: 幅が縮む、後半: min-width=W/2 で固定（表紙が現れる） |

#### 廃止・変更

- `fixReady` state: 廃止（fixRight は `isFlipping` のみで表示制御）
- `setFixReady` / `setTimeout(FLIP_MS/2)` 関連: 廃止
- flip_card left: `dir === 'next' && !isCover(step) ? W/2 : 0`（isCover 時も 0）
- `animationDuration`: flip_card の inline style で管理（FLIP_MS 一元管理）
- flip_wrap を display:none で切り替えると transition が走らないため `visibility` で制御

#### wrapW state 管理

- 開く前: `wrapW = 0`（前回の閉じるで 0 になっている）
- 開く（isCover(step) + next）: `setWrapW(W)` → transition で 0→W
- 閉じる（isCover(dest) + prev）: `setWrapW(0)` → transition で W→0
- 完了後のリセット不要（次のめくりで上書きされる）

### 次回作業（優先順）

1. 不要ソース削除（fixReady state、setFixReady 呼び出し、setTimeout FLIP_MS/2 関連）
2. wrapW state 追加
3. flip_wrap 要素を JSX に追加・flip_card を flip_wrap の子に変更
4. CSS に flip_wrap スタイル追加
5. fixRight 表示条件を `isFlipping` のみに変更
6. flip 関数内の wrapW 制御追加
7. 動作確認（開く・閉じる・見開き間の全パターン）

### 進捗整理

- 全体進捗率: 76%
- 残工数: 約 5〜7日（ページめくり実装 1〜2日・CSS 2〜3日・結合確認 1日・その他 1日）
- 前回比: +1%（設計確定のみ、実装は次回）
- 今回増えた工数: flip_wrap 方式の実装で +0.5日

---

## 2026-07-17〜21（ページめくりアニメーション実装完了）

### 完了事項

#### ページめくりアニメーション（Preview.jsx + app.scss）

- flip_card の回転軸問題を解決
  - next方向: `left: W/2`（flip_fix_right左端 = book中央が回転軸）
  - prev方向: `left: -W/2`（flip_cardの右端 = book中央が回転軸）
  - 最終的に `left: dir === 'next' ? 0 : -W/2`（flip_fix_right相対）で全パターン解決
- book_outer が右にずれる問題を解決
  - flip_card を flip_fix_right div の子に配置する構造変更で解決
- 折り目グラデーション（fold_shadow）を @mixin 化
  - SCSSエラー修正（末尾カンマ・引数カンマ抜け・セミコロン抜け）
- フェードアウト問題: opacity 遷移で子要素チラつきが発生 → visibility:hidden で対応
- book_spine の opacity 判定: `isCover(step) || (isFlipping && wrapW === 0)` で見開き→表紙のめくり中も非表示化
- pageIdx 変更: 表紙は right=0 / left=null に統一

#### ゴミソース除去（レビュー後修正）

- Preview.jsx L191-194: dead wrapper div 削除（`isCover(step) && dir === 'prev'` 条件が left=null で無意味だったため）
- app.scss: animation duration の `1s` ハードコード整理（JSX inline の animationDuration で管理）
- app.scss: linear-gradient 末尾カンマ削除

### 技術的確認事項

- 見開き→表紙のめくり中の判定: `isFlipping && wrapW === 0`（JSX内）または `isCover(dest)` （flip関数内）
- wrapW=0 になるのは isCover(dest)=true の setWrapW(0) 時のみ → 実質同義

### 残タスク

- 結合確認（/api/generate 疎通・Stripe 決済フロー・メール送信）
- APIエラー汎用化
- CSS 全画面一から作り直し（着手予定）
- `python manage.py check --deploy` 実行

---

## 2026-07-24（CSS完了）

### 完了事項

- CSS 全画面実装完了（app.scss）
  - ボタン色パターンB全適用（btn_back / btn_driv / btn_contact 等）
  - パーツ選択ボタン色（btn_hair / btn_eye / btn_nose / btn_mouth）
  - 色選択ボタン（btn_color_h / btn_color_s）
  - flip アニメーション関連 CSS（flip_wrap / flip_fix_right / fold_shadow mixin）
  - header z-index: 50（ContactModal がbook_outer の filter stacking context に負けない対策）
  - ShareModal の book_outer overflow 対応・btns_share CSS 追加
  - プレビュー右側はみ出し問題 → 解決済み

### 残タスク（α版）

- 結合確認（/api/generate 疎通・Stripe 決済フロー・メール送信）
- APIエラーレスポンス汎用化
- `python manage.py check --deploy` 実行（リリース直前）

---

## 2026-07-24〜26（結合テスト・バグ修正）

### 完了事項

#### sessionStorage 排除
- Preview.jsx：initState IIFE 削除 → `location.state || {}` に簡略化
- Preview.jsx：`isPurchased` state 削除 → `isPreview = !token` / `hidden={isPreview}` に統一
- Preview.jsx：generatePdf 内の `sessionStorage.setItem` 削除
- Purchase.jsx：sessionStorage 読み取りブロック削除・`let` → `const` 修正

#### Stripe 結合テスト
- Stripe CLI インストール・ログイン確認
- `stripe listen --forward-to http://localhost/api/payment/callback` で Webhook 転送確認
- STRIPE_WEBHOOK_SECRET を `.env` に設定（docker compose down && up -d で反映）
- 決済フロー全体（generate → payment → Stripe → callback → Book登録 → メール送信）確認済み

#### mock.js 本番除外
- 全ページで `const mock = import.meta.env.DEV ? mockData : null` に統一
- 本番ビルドで mock が tree-shaking される仕組みに変更

#### success_url 変更
- payment view：`success_url` を `/preview?purchased=true` → `/ehon/:token?client=&theme=` に変更
- callback view：`download_url` にも `?client=&theme=` を追加（`urlencode` でパーセントエンコード）
- App.jsx Header/Footer：`useEffect` の条件分岐を削除（`/ehon/:token` でもパラメータを取得）

#### Stripe 購入フォーム改善
- Stripe checkout session に `customer_email` を追加（購入フォームのメールを事前入力）

#### メール修正
- 署名 HTML：`<p style="white-space: pre-line">` で改行を正しく表示
- ダウンロードURL：`?client=&theme=` 付きに変更
- PDF ファイル名：`ehon.pdf` → `${result.title}.pdf` に変更

### 判明した問題と修正

| 問題 | 原因 | 修正 |
|------|------|------|
| `stripe listen` で Webhook が届かない | `--forward-to` なしで実行していた | コマンド修正 |
| `stripe._error.InvalidRequestError` | `urlencode` 未使用・日本語が URL に入った | `urllib.parse.urlencode` に変更 |
| "book not found" | webhook が届いておらず Book 未作成 | stripe listen コマンド修正で解消 |
| `hidden={!isPreview}` が逆 | isPurchased 削除時に JSX の修正が漏れた | `hidden={isPreview}` に修正 |
| メールが迷惑メールに入る | SES sandbox 後の設定問題（内容は正常） | 要継続モニタリング |

### 残タスク（α版）

- スマホ・各ブラウザ動作確認
- APIエラーレスポンス汎用化（セキュリティ必須）
- `python manage.py check --deploy` 実行（リリース直前）
- `?client=null&theme=null` の 400 エラー対応（パラメータなしアクセス時）

### 進捗整理

- 全体進捗率：89%
- 残工数：約 1.5〜2日
- 前回比：+13%（結合テスト完了・バグ修正多数）
- 今回増えた工数：なし（sessionStorage・Stripe CLI は想定内の作業）
