import json, os, stripe
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from urllib.parse import urlencode
from apps.common.auth import send_mail
from apps.common.mail_temp import pdf_purchase, print_purchase, print_admin, contact_admin, contact_reply
from .models import Client, Question, Style, Book, BookPage, Buyer, FacePart, Colors, Image, Theme, PendingBook, AnswerLog
from .ai import generate_story
from .views_client import _coupon_purchase

# 詳細は docs/api-design.md 参照

# 定数
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
MAIL_SUBJECT_PDF = 'えほんごとのたね |ダウンロードリンクのご案内'
MAIL_SUBJECT_PRINT = 'えほんごとのたね |製本受付のご案内'

# テーマ毎の質問取得
@api_view(['GET'])
def get_question(request):
  # 要求項目取得
  client = request.GET.get('client')
  theme = request.GET.get('theme')
  year = request.GET.get('year')

  # バリデーションチェック
  if not client:
    return Response({'error': 'bad request'}, status=400)
  client_obj = Client.objects.filter(name=client).first()
  if not client_obj:
    return Response({'error': 'bad request'}, status=400)

  if not theme:
    return Response({'error': 'bad request'}, status=400)
  theme_obj = Theme.objects.filter(client=client_obj, name=theme, year=year).first()
  if not theme_obj:
    return Response({'error': 'bad request'}, status=400)

  # 質問内容取得
  question_obj = Question.objects.filter(theme=theme_obj).order_by('sort')
  if not question_obj:
    return Response({'questions': []}, status=200)

  # スタイル取得
  style_obj = Style.objects.filter(theme=theme_obj)

  # 質問一覧を返却
  return Response({
    'questions': list(question_obj.values('sort', 'chapter', 'text')),
    'styles': list(style_obj.values('key', 'label', 'options')),
  }, status=200)

# えほんごとのたね作成
@api_view(['POST'])
def generate(request):
  # 1. バリデーションチェック
  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  # テーマ取得
  theme_obj = Theme.objects.filter(name = body.get('theme')).first()
  if not theme_obj:
    return Response({'error': 'bad request'}, status=400)
  answers = body.get('answers')
  if not answers:
    return Response({'error': 'bad request'}, status=400)

  # スタイル取得
  styles = body.get('styles', {})

  # ログ登録
  log_obj = AnswerLog.objects.create(
    data = body
  )

  # 2. AI文章生成（anthropic）※リトライ1回
  # result {"spreads": [{"sp_num": 1, "text1": "...", "text2": "..."}, ...]}
  result = generate_story(theme_obj, answers, styles)
  if not result:
    return Response({'error': 'server error'}, status=500)

  # 3. 顔パーツ・イラスト一覧を返却
  hair = FacePart.objects.filter(part=FacePart.PART_HAIR).order_by('img_path')
  eye = FacePart.objects.filter(part=FacePart.PART_EYE).order_by('img_path')
  nose = FacePart.objects.filter(part=FacePart.PART_NOSE).order_by('img_path')
  mouth = FacePart.objects.filter(part=FacePart.PART_MOUTH).order_by('img_path')
  face_parts = {
    'hair': list(hair.values('id', 'img_path')),
    'eye': list(eye.values('id', 'img_path', 'eye_turn')),
    'nose': list(nose.values('id', 'img_path')),
    'mouth': list(mouth.values('id', 'img_path')),
  }
  images = Image.objects.filter(theme=theme_obj).order_by('id')
  hair_colors = Colors.objects.filter(part=Colors.COLOR_HAIR).order_by('color')
  skin_colors = Colors.objects.filter(part=Colors.COLOR_SKIN).order_by('-color')
  price = {
    'pdf': theme_obj.price_pdf,
    'soft': theme_obj.price_soft,
    'hard': theme_obj.price_hard,
  }

  return Response({
    'theme': theme_obj.name,
    'title': result[0]['text1'],
    'spreads': result,
    'face_parts': face_parts,
    'hair_colors': list(hair_colors.values('label', 'color')),
    'skin_colors': list(skin_colors.values('label', 'color')),
    'images': list(images.values('id', 'img_path', 'angle', 'size', 'ox', 'tilt')),
    'log_id': log_obj.id,
    'price': price,
  }, status=200)

# Stripe決済要求
@api_view(['POST'])
def payment(request):
  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  # 1. バリデーション
  type = body.get('type')
  if not type:
    return Response({'error': 'bad request'}, status=400)
  types = [t[0] for t in Book.BOOK_TYPE]
  if type not in types:
    return Response({'error': 'bad request'}, status=400)
  theme_obj = Theme.objects.filter(name=body.get('theme')).first()
  if not theme_obj:
    return Response({'error': 'bad request'}, status=400)
  buyer = body.get('buyer')
  if not buyer:
    return Response({'error': 'bad request'}, status=400)
  if not buyer.get('name'):
    return Response({'error': 'bad request'}, status=400)
  if not buyer.get('email'):
    return Response({'error': 'bad request'}, status=400)
  spreads = body.get('spreads')
  if not spreads:
    return Response({'error': 'bad request'}, status=400)
  title = spreads[0].get('text1', '')

  # 2. 金額設定
  if type == Book.TYPE_PDF:
    price = theme_obj.price_pdf
  elif type == Book.TYPE_SOFT:
    price = theme_obj.price_soft
  else:
    price = theme_obj.price_hard

  # 3. pendingデータ登録
  pending_obj = PendingBook.objects.create(data={
    'type': type,
    'theme_id': theme_obj.id,
    'title': title,
    'price': price,
    'buyer': buyer,
    'face': body.get('face'),
    'log_id': body.get('log_id'),
    'spreads': spreads,
  })

  # ホームボタン用パラメータ
  home = urlencode({'client': theme_obj.client.name, 'theme': theme_obj.name})

  # 4. Stripe決済
  session = stripe.checkout.Session.create(
    payment_method_types=['card'],
    line_items=[{
      'price_data': {
        'currency': 'jpy',
        'product_data': {'name': title},
        'unit_amount': price,
      },
      'quantity': 1,
    }],
    mode='payment',
    success_url=f"{os.environ.get('FRONT_URL')}/ehon/{pending_obj.token}?{home}",
    cancel_url=f"{os.environ.get('FRONT_URL')}/purchase",
    metadata={'token': str(pending_obj.token), 'type': 'book'},
    customer_email=body.get('buyer', {}).get('email'),
  )

  # 5. フロントに決済URLを返却
  return Response({'ck_url': session.url}, status=200)

# Stripe決済応答
@api_view(['POST'])
def callback(request):
  # 1. Stripe署名検証
  sig = request.headers.get('Stripe-Signature', '')
  try:
    event = stripe.Webhook.construct_event(
      request.body, sig, os.environ.get('STRIPE_WEBHOOK_SECRET', '')
    )
  except stripe.error.SignatureVerificationError:
    return Response({'error': 'forbidden'}, status=403)

  if event.get('type') != 'checkout.session.completed':
    return Response({'status': 'ignored'}, status=200)

  # 2. タイプ別後続処理に分岐
  session_obj = event.get('data', {}).get('object', {})
  type = session_obj.get('metadata', {}).get('type')
  if type == 'book':
    _book_purchase(session_obj)
  elif type == 'coupon':
    _coupon_purchase(session_obj)

  # 3. Stripe に 200 返却
  return Response({'detail': 'callback ok!'}, status=200)


# 絵本購入後処理
def _book_purchase(session_obj):
  # 2. pendingデータ取得
  sp_pay_id = session_obj.get('id', '')
  token = session_obj.get('metadata', {}).get('token', '')
  pending_obj = PendingBook.objects.filter(token=token).first()
  if not pending_obj:
    return
  data = pending_obj.data

  # 3. DB保存
  # 購入者登録
  buyer_data = data.get('buyer')
  buyer_obj, _ = Buyer.objects.get_or_create(
    email=buyer_data.get('email'),
    defaults={
      'name': buyer_data.get('name', ''),
      'phone': buyer_data.get('phone', ''),
      'post': buyer_data.get('post', ''),
      'address': buyer_data.get('address', ''),
      'mail_ok': buyer_data.get('mail_ok', False),
    }
  )

  # 顔パーツ取得
  face = data.get('face')
  hair = FacePart.objects.filter(id=face.get('hair')).first()
  eye = FacePart.objects.filter(id=face.get('eye')).first()
  nose = FacePart.objects.filter(id=face.get('nose')).first()
  mouth = FacePart.objects.filter(id=face.get('mouth')).first()
  hair_color = Colors.objects.filter(color=face.get('hairColor')).first()
  skin_color = Colors.objects.filter(color=face.get('skinColor')).first()

  # book登録
  book_obj = Book.objects.create(
    token=pending_obj.token,
    buyer=buyer_obj,
    theme_id=data.get('theme_id'),
    title=data.get('title'),
    book_type=data.get('type'),
    status=Book.STATUS_PAID,
    sp_pay_id=sp_pay_id,
    price=data.get('price'),
    pdf_exp=timezone.now() + timedelta(days=30),
    hair=hair,
    eye=eye,
    nose=nose,
    mouth=mouth,
    hair_color=hair_color,
    skin_color=skin_color,
  )

  # ページ登録
  for spread in data.get('spreads'):
    BookPage.objects.create(
      book=book_obj,
      spread=spread.get('sp_num'),
      text1=spread.get('text1'),
      text2=spread.get('text2'),
      img=Image.objects.filter(id=(spread.get('img') or {}).get('id')).first(),
    )

  # 回答ログにbookを紐付け
  log_id = data.get('log_id')
  if log_id:
    AnswerLog.objects.filter(
      id = log_id
    ).update(
      book = book_obj
    )

  # pendingデータ削除
  pending_obj.delete()

  # 4. SESメール送信
  home = urlencode({'client': book_obj.theme.client.name, 'theme': book_obj.theme.name})
  download_url = f"{os.environ.get('FRONT_URL')}/ehon/{book_obj.token}?{home}"
  if data.get('type') == Book.TYPE_PDF:
    # PDF
    body_text, body_html = pdf_purchase(book_obj, download_url)
    send_mail(
      to=buyer_obj.email,
      subject=MAIL_SUBJECT_PDF,
      body_text=body_text,
      body_html=body_html,
      service_name=book_obj.theme.client.name,
      reply_to=book_obj.theme.client.email,
    )
  else:
    # 製本
    body_text, body_html = print_purchase(buyer_obj, book_obj, download_url)
    send_mail(
      to=buyer_obj.email,
      subject=MAIL_SUBJECT_PRINT,
      body_text=body_text,
      body_html=body_html,
      service_name=book_obj.theme.client.name,
      reply_to=book_obj.theme.client.email,
    )
    # 運営にメール
    send_mail(
      to=os.environ.get('ADMIN_EMAIL'),
      subject=MAIL_SUBJECT_PRINT,
      body_text=print_admin(buyer_obj, book_obj),
      body_html='',
      service_name=book_obj.theme.client.name,
      reply_to=book_obj.theme.client.email,
    )


# 絵本データ取得 ※フロント側Canvasにて画像生成
@api_view(['GET'])
def ehon_data(request, token):
  # 購入済み絵本データ取得
  book_obj = Book.objects.filter(token=token).first()
  if not book_obj:
    return Response({'error': 'book not found'}, status=404)

  # 取得有効期限チェック
  if timezone.now() > book_obj.pdf_exp:
    return Response({'error': 'pdf expired'}, status=403)

  spread_obj = BookPage.objects.filter(book=book_obj).order_by('spread').select_related('img')

  return Response({
    'title': book_obj.title,
    'status': book_obj.status,
    'pdf_exp': book_obj.pdf_exp,
    'face': {
      'hair': book_obj.hair.id,
      'eye': book_obj.eye.id,
      'nose': book_obj.nose.id,
      'mouth': book_obj.mouth.id,
      'hairColor': book_obj.hair_color.color,
      'skinColor': book_obj.skin_color.color,
    },
    'face_parts': {
      'hair':  [{'id': book_obj.hair.id,  'img_path': book_obj.hair.img_path}],
      'eye':   [{'id': book_obj.eye.id,   'img_path': book_obj.eye.img_path,   'eye_turn': book_obj.eye.eye_turn}],
      'nose':  [{'id': book_obj.nose.id,  'img_path': book_obj.nose.img_path}],
      'mouth': [{'id': book_obj.mouth.id, 'img_path': book_obj.mouth.img_path}],
    },
    'spreads': [{
      'sp_num': sp.spread,
      'text1': sp.text1,
      'text2': sp.text2,
      'img': {
          'img_path': sp.img.img_path if sp.img else None,
          'angle'   : sp.img.angle    if sp.img else None,
          'size'    : sp.img.size     if sp.img else None,
          'ox'      : sp.img.ox       if sp.img else None,
          'tilt'    : sp.img.tilt     if sp.img else None,
        },
    } for sp in spread_obj]
  }, status=200)


# 問い合わせメール
@api_view(['POST'])
def contact(request):
  # 1. バリデーションチェック
  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  TYPE_NORMAL = 'normal'
  TYPE_DEFECT = 'defect'
  TYPE_MULTI = 'multi'
  TYPE_HARD = 'hard'
  TYPE_CLIENT = 'client'
  TYPE_LABEL = {
    TYPE_NORMAL: 'お問い合わせ',
    TYPE_DEFECT: 'メール未着・DLできない',
    TYPE_MULTI:  '複数冊購入希望',
    TYPE_HARD:   'ハードカバー購入希望',
    TYPE_CLIENT: '新テーマ作成（企業向け）',
  }

  type = body.get('type')
  if not type:
    return Response({'error': 'bad request'}, status=400)
  if type not in TYPE_LABEL:
    return Response({'error': 'bad request'}, status=400)
  name = body.get('name')
  if not name:
    return Response({'error': 'bad request'}, status=400)
  email = body.get('email')
  if not email:
    return Response({'error': 'bad request'}, status=400)
  message = body.get('message')
  if not message:
    return Response({'error': 'bad request'}, status=400)
  num = body.get('num')
  if type == TYPE_MULTI and not num:
    return Response({'error': 'bad request'}, status=400)
  tel = body.get('tel')
  if type == TYPE_DEFECT and not tel:
    return Response({'error': 'bad request'}, status=400)
  company = body.get('company')

  # 2. SESメール送信
  body_text = contact_reply(name, TYPE_LABEL[type], message)
  # 自動返信
  send_mail(
    to=email,
    subject=f'【えほんごとのたね】 {TYPE_LABEL[type]} / {name}様',
    body_text=body_text,
    body_html=None,
    service_name='えほんごとのたね',
    reply_to=os.environ.get('ADMIN_EMAIL'),
  )

  # 運営宛
  body_text = contact_admin(name, TYPE_LABEL[type], email, message, tel, num, company)
  send_mail(
    to=os.environ.get('ADMIN_EMAIL'),
    subject=f'【えほんごとのたね】 {TYPE_LABEL[type]} / {name}様',
    body_text=body_text,
    body_html=None,
    service_name='えほんごとのたね',
    reply_to=email,
  )

  return Response({'detail': 'mail ok'}, status=200)


# テーマ一覧取得
@api_view(['GET'])
def get_themes(request):
  # 1. バリデーション
  client = request.GET.get('client')
  client_obj = Client.objects.filter(name=client).first()
  if not client_obj:
    return Response({'error': 'bad request'}, status=400)

  # 2. テーマ一覧取得
  theme_obj = Theme.objects.filter(client=client_obj).order_by('id')
  theme_list = [{
    'name': t.name,
    'year': t.year,
  } for t in theme_obj]

  # レスポンス
  return Response({'themes': theme_list}, status=200)
