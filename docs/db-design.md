# DB設計

最終更新：2026-07-10

---

## テーブル一覧

| テーブル      | 役割                           |
|---------------|--------------------------------|
| buyers        | 購入者情報                     |
| clients       | BtoB クライアント情報          |
| books         | 絵本メイン（決済・顔パーツ）   |
| book_pages    | ページごとのテキスト・イラスト |
| answers       | 質問回答ログ                   |
| themes        | テーママスター                 |
| questions     | 質問マスター                   |
| styles        | スタイル選択肢マスター         |
| images        | イラストマスター               |
| face_parts    | 顔パーツマスター               |
| pending_books | 決済前一時保管                 |

---

## テーブル定義

### buyers

| カラム     | 型       | 備考                     |
|------------|----------|--------------------------|
| id         | int      | PK                       |
| name       | varchar  | 購入者名                 |
| email      | varchar  | ユニーク                 |
| phone      | varchar  | 電話番号                 |
| post       | varchar  | 郵便番号                 |
| address    | text     | 都道府県以降の住所       |
| mail_ok    | boolean  | メール告知opt-in         |
| created_at | datetime |                          |
| updated_at | datetime |                          |

### clients

| カラム     | 型       | 備考                          |
|------------|----------|-------------------------------|
| id         | int      | PK                            |
| name       | varchar  | クライアント名                |
| email      | varchar  | ユニーク                      |
| logo       | varchar  | ロゴパス（省略可）            |
| api_key    | varchar  | ユニーク・null許可            |
| is_active  | boolean  |                               |
| created_at | datetime |                               |

### themes

| カラム      | 型       | 備考                        |
|-------------|----------|-----------------------------|
| id          | int      | PK                          |
| client_id   | int      | FK → clients（PROTECT）     |
| name        | varchar  | テーマ名                    |
| year        | smallint | シーズン年度（null=通常）   |
| prompt      | text     | AI生成プロンプト            |
| price_pdf   | int      | PDFダウンロード価格（円）   |
| price_print | int      | 製本価格（円）              |
| created_at  | datetime |                             |

### questions

| カラム   | 型       | 備考                       |
|----------|----------|----------------------------|
| id       | int      | PK                         |
| theme_id | int      | FK → themes（CASCADE）     |
| sort     | smallint | 表示順                     |
| text     | varchar  | 質問文                     |

### styles

| カラム   | 型      | 備考                                              |
|----------|---------|---------------------------------------------------|
| id       | int     | PK                                                |
| theme_id | int     | FK → themes（CASCADE）                            |
| key      | varchar | 識別子（tone / view / target / ending）           |
| label    | varchar | 表示名（トーン / 主人公視点 / 読者ターゲット / ラストの余韻） |
| options  | json    | 選択肢リスト（例：["やさしい絵本風", ...]）       |

### books

| カラム     | 型       | 備考                                      |
|------------|----------|-------------------------------------------|
| id         | int      | PK                                        |
| token      | uuid     | ユニーク・UUID v4・アクセストークン       |
| buyer_id   | int      | FK → buyers                               |
| theme_id   | int      | FK → themes（PROTECT）                   |
| title      | varchar  | AI生成＋ユーザー編集可                    |
| book_type  | enum     | `pdf` / `print`                           |
| status     | enum     | `no_paid` / `paid` / `expired` / `ordered`|
| price      | int      | 決済時の金額（円）                        |
| sp_pay_id  | varchar  | Stripe決済ID                              |
| pdf_key    | varchar  | S3キー                                    |
| pdf_exp    | datetime | PDF期限（30日）                           |
| hair       | int      | FK → face_parts                           |
| eye        | int      | FK → face_parts                           |
| nose       | int      | FK → face_parts                           |
| mouth      | int      | FK → face_parts                           |
| hair_color | enum     | 髪色（black / dkbrown / brown / gold / rdbrown / gray / white）|
| skin       | enum     | 肌色（white / flesh / wheat / brown / dark）|
| created_at | datetime |                                           |
| updated_at | datetime |                                           |

### book_pages

| カラム   | 型       | 備考        |
|----------|----------|-------------|
| id       | int      | PK          |
| book_id  | int      | FK → books  |
| page     | smallint | 1〜7        |
| text     | text     | AI生成文章  |
| img_id   | int      | FK → images |

### answers

| カラム     | 型       | 備考                 |
|------------|----------|----------------------|
| id         | int      | PK                   |
| book_id    | int      | FK → books           |
| data       | json     | 質問回答まるごとJSON |
| created_at | datetime |                      |

### images

| カラム   | 型       | 備考                                            |
|----------|----------|-------------------------------------------------|
| id       | int      | PK                                              |
| theme_id | int      | FK → themes（PROTECT）                          |
| img_path | varchar  | サーバー上の相対パス（`_mask.png` が同名で存在） |
| angle    | enum     | `front` / `45` / `side` / `back` default=front  |
| cx       | smallint | Canvas上の顔中心X座標 default=0                 |
| cy       | smallint | Canvas上の顔中心Y座標 default=0                 |
| size     | smallint | 顔の描画サイズ default=0                        |
| offset   | json     | パーツ別オフセット `{"hair":{"ox":0},...}` null許可 |

初期レコード数：テーマ × 20枚程度（ページ固定なし・同一画像の複数ページ使用可）

### face_parts

| カラム   | 型       | 備考                              |
|----------|----------|-----------------------------------|
| id       | int      | PK                                |
| part     | enum     | `hair` / `eye` / `nose` / `mouth` |
| label    | varchar  | 表示名                            |
| img_path | varchar  | サーバー上の相対パス（省略可）    |
| sort     | smallint | 表示順                            |

### pending_books

| カラム     | 型       | 備考                    |
|------------|----------|-------------------------|
| id         | int      | PK                      |
| token      | uuid     | ユニーク・UUID v4       |
| data       | json     | 決済前データまるごと    |
| created_at | datetime |                         |

---

## ページ構成

全テーマ共通・固定7ページ

| page_num | 内容 |
|----------|------|
| 1        | 表紙 |
| 2〜7     | 本文 |

---

## 設計方針

- 決済前データは保存しない（books・buyers は `paid` 以降のみ）
- PDF生成は決済後に同期実行のため `pdf_ready` ステータスは不要
- テーマが複数になっても books / answers の構造は共通（answers.data は q1, q2… の汎用キー）
- price は決済時の実金額を保持（価格改定・テーマ別価格に対応）
- answers は削除処理なし（容量影響小）
- 画像はサーバー上のパスのみ保持、APIに画像バイナリを含めない
- イラストはテーマ×ページ×パターンの組み合わせで管理、デフォルトは `pattern=1`
- Theme削除はbooks/imagesが存在する場合PROTECT（削除不可）
