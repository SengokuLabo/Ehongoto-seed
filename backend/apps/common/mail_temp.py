import os

_mail = os.environ.get('ADMIN_EMAIL', 'info@ehongoto.jp')

# 署名
SIGNATURE_TEXT = f'''
┈┈┈┈┈┈┈┈┈┈

EHONGOTO

〒530-0001
大阪府大阪市北区梅田1丁目1番3号
大阪駅前第3ビル 11階2号室

https://www.ehongoto.jp
{_mail}

ひとりの人生が
だれかの未来になる

┈┈┈┈┈┈┈┈┈┈
'''

SIGNATURE_HTML = f'''
<br>
<p style="white-space: pre-line">
┈┈┈┈┈┈┈┈┈┈

EHONGOTO

〒530-0001
大阪府大阪市北区梅田1丁目1番3号
大阪駅前第3ビル 11階2号室

<a href="https://www.ehongoto.jp">https://www.ehongoto.jp</a>
<a href="mailto:{_mail}">{_mail}</a>

ひとりの人生が
だれかの未来になる

┈┈┈┈┈┈┈┈┈┈
</p>
'''

# PDF購入時
def pdf_purchase(book_obj, download_url):
  text = f'''
    *** えほんごとのたね🌱 ***
    {book_obj.theme.client.name}
    絵本タイトル：{book_obj.title}

    この度はご購入ありがとうございます。
    以下のリンクから絵本のPDFをダウンロードしてください。

    ▼ ダウンロードリンク
    {download_url}

    ※ リンクの有効期限は30日間です。
    ※ 期限後の再ダウンロードには再購入が必要です。

  ''' + SIGNATURE_TEXT

  html = f'''
    <p>*** えほんごとのたね🌱 ***</p>
    <p>{book_obj.theme.client.name}</p><br>
    <p>絵本タイトル：{book_obj.title}</p><br>
    <p>この度はご購入ありがとうございます。</p>
    <p>以下のリンクから絵本のPDFをダウンロードしてください。</p>
    <p><a href="{download_url}">▼ ダウンロードリンク</a></p>
    <p>※ リンクの有効期限は30日間です。<br>
    ※ 期限後の再ダウンロードには再購入が必要です。</p><br>
  ''' + SIGNATURE_HTML

  return text, html

# 製本購入時
def print_purchase(buyer_obj, book_obj, download_url):
  text = f'''
    *** えほんごとのたね🌱 ***
    {book_obj.theme.client.name}

    製本申し込みを受け付けました。
    内容を確認のうえ、改めてご連絡いたします。

    【お申し込み内容】
    お名前：{buyer_obj.name}
    お届け先：{buyer_obj.post} {buyer_obj.address}
    絵本タイトル：{book_obj.title}

    以下のリンクから絵本のPDFをダウンロードも可能です。
    ▼ ダウンロードリンク
    {download_url}

    ※ リンクの有効期限は30日間です。
    ※ 期限後の再ダウンロードには再購入が必要です。

  ''' + SIGNATURE_TEXT

  html = f'''
    <p>*** えほんごとのたね🌱 ***</p>
    <p>{book_obj.theme.client.name}</p><br>
    <p>製本申し込みを受け付けました。</p>
    <p>【お申し込み内容】<br>
    お名前：{buyer_obj.name}<br>
    お届け先：{buyer_obj.post} {buyer_obj.address}<br>
    絵本タイトル：{book_obj.title}</p>
    <p>以下のリンクから絵本のPDFをダウンロードも可能です。</p>
    <p><a href="{download_url}">▼ ダウンロードリンク</a></p>
    <p>※ リンクの有効期限は30日間です。<br>
  ''' + SIGNATURE_HTML

  return text, html

# お問い合わせ（運営宛）
def contact_admin(name, type_label, email, message, tel=None, num=None, company=None):
  extra = ''
  if tel:
    extra += f'\n    電話番号：{tel}'
  if num:
    extra += f'\n    希望部数：{num}'
  if company:
    extra += f'\n    会社名：{company}'

  text = f'''
    【お問い合わせ】{type_label}

    お名前：{name}
    メール：{email}{extra}

    ----
    {message}
    ----
  ''' + SIGNATURE_TEXT

  return text

# お問い合わせ自動返信（問い合わせ者宛）
def contact_reply(name, type_label, message):
  text = f'''
    {name} 様

    お問い合わせありがとうございます。
    以下の内容でお問い合わせを受け付けました。
    内容を確認のうえ、改めてご連絡いたします。

    【種別】{type_label}
    【内容】
    {message}

  ''' + SIGNATURE_TEXT

  return text

# 管理者用
def print_admin(buyer_obj, book_obj):
  text = f'''
    新しい製本申し込みがありました。

    お名前：{buyer_obj.name}
    メール：{buyer_obj.email}
    お届け先：{buyer_obj.post} {buyer_obj.address}
    絵本ID：{book_obj.id}
    申し込み日時：{book_obj.created_at}
  ''' + SIGNATURE_TEXT

  return text


# クライアント仮登録
def client_add(name, url):
  text = f'''
    {name} 様

    仮登録を受け付けました。
    以下のURLから登録を完了してください。
    登録確定後にテーマ作成について、改めてご連絡いたします。

    ▼ 本登録URL
    {url}

  ''' + SIGNATURE_TEXT

  return text


# クライアント本登録通知（管理者宛）
def client_verify(name, email, created_at):
  text = f'''
    新規クライアントの本登録が完了しました。
    テーマ作成について、連絡お願いします。

    お名前：{name}
    メール：{email}
    登録日時：{created_at}
  ''' + SIGNATURE_TEXT

  return text


# クライアント クーポン購入時
def client_coupon(name, email, theme):
  text = f'''
    クライアントからクーポン購入がありました。

    お名前：{name}
    メール：{email}
    テーマ：{theme}
  ''' + SIGNATURE_TEXT

  return text
