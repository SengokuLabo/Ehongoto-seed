import json, os, stripe
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from urllib.parse import urlencode
from apps.common.auth import send_mail
from apps.common.mail_temp import pdf_purchase, print_purchase, print_admin, contact_admin, contact_reply
from . import models
from .ai import generate_story

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
  client_obj = models.Client.objects.filter(name=client).first()
  if not client_obj:
    return Response({'error': 'bad request'}, status=400)

  # サブスクフリーアカウント or サブスク有効かを判定
  if not client_obj.is_free:
    subsc = models.ClientSubsc.objects.filter(client=client_obj, status=models.ClientSubsc.SUBSC_ACTIVE).first()
    if not subsc:
      return Response({'error': 'bad request'}, status=400)

  if not theme:
    return Response({'error': 'bad request'}, status=400)
  theme_obj = models.Theme.objects.filter(client=client_obj, name=theme, year=year).first()
  if not theme_obj:
    return Response({'error': 'bad request'}, status=400)

  # 質問内容取得
  question_obj = models.Question.objects.filter(theme=theme_obj).order_by('sort')
  if not question_obj:
    return Response({'questions': []}, status=200)

  # スタイル取得
  style_obj = models.Style.objects.filter(theme=theme_obj)

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

  # クライアント取得
  client_obj = models.Client.objects.filter(name=body.get('client')).first()
  if not client_obj:
    return Response({'error': 'bad request'}, status=400)
  # テーマ取得
  theme_obj = models.Theme.objects.filter(client=client_obj, name=body.get('theme')).first()
  if not theme_obj:
    return Response({'error': 'bad request'}, status=400)
  answers = body.get('answers')
  if not answers:
    return Response({'error': 'bad request'}, status=400)

  # スタイル取得
  styles = body.get('styles', {})

  # ログ登録
  log_obj = models.AnswerLog.objects.create(
    data = body
  )

  # 2. AI文章生成（anthropic）※リトライ1回
  # result {"spreads": [{"sp_num": 1, "text1": "...", "text2": "..."}, ...]}
  result = generate_story(theme_obj, answers, styles)
  if not result:
    return Response({'error': 'server error'}, status=500)

  # 3. 顔パーツ・イラスト一覧を返却
  if theme_obj.face_group:
    # 顔パーツありテーマ
    hair = models.FacePart.objects.filter(part=models.FacePart.PART_HAIR, facegroup__group=theme_obj.face_group).order_by('img_path')
    eye = models.FacePart.objects.filter(part=models.FacePart.PART_EYE, facegroup__group=theme_obj.face_group).order_by('img_path')
    nose = models.FacePart.objects.filter(part=models.FacePart.PART_NOSE, facegroup__group=theme_obj.face_group).order_by('img_path')
    mouth = models.FacePart.objects.filter(part=models.FacePart.PART_MOUTH, facegroup__group=theme_obj.face_group).order_by('img_path')
    face_parts = {
      'hair': [{'id': fp.id, 'img_path': f"{settings.MEDIA_URL}faces/{fp.img_path}"} for fp in hair],
      'eye': [{'id': fp.id, 'img_path': f"{settings.MEDIA_URL}faces/{fp.img_path}", 'eye_turn': fp.eye_turn} for fp in eye],
      'nose': [{'id': fp.id, 'img_path': f"{settings.MEDIA_URL}faces/{fp.img_path}"} for fp in nose],
      'mouth': [{'id': fp.id, 'img_path': f"{settings.MEDIA_URL}faces/{fp.img_path}"} for fp in mouth],
    }
    hair_colors = models.Colors.objects.filter(part=models.Colors.COLOR_HAIR).order_by('color')
    skin_colors = models.Colors.objects.filter(part=models.Colors.COLOR_SKIN).order_by('-color')
  else:
    # 顔パーツなしテーマ
    face_parts = {}
    hair_colors = []
    skin_colors = []

  images = models.Image.objects.filter(themeimg__theme=theme_obj).order_by('id')
  price = {
    'pdf': theme_obj.price_pdf,
    'soft': theme_obj.price_soft,
    'hard': theme_obj.price_hard,
  }

  return Response({
    'client': client_obj.name,
    'theme': theme_obj.name,
    'title': result[0]['text1'],
    'spreads': result,
    'face_parts': face_parts,
    'hair_colors': list(hair_colors.values('label', 'color')) if hair_colors else None,
    'skin_colors': list(skin_colors.values('label', 'color')) if skin_colors else None,
    'images': [{
      'id': i.id,
      'img_path': f"{settings.MEDIA_URL}images/{i.img_path}",
      'angle': i.angle,
      'size': i.size,
      'ox': i.ox,
      'tilt': i.tilt,
      } for i in images],
    'log_id': log_obj.id,
    'price': price,
  }, status=200)

# 絵本購入後処理
def _book_purchase(session_obj):
  # 2. pendingデータ取得
  sp_pay_id = session_obj.get('id', '')
  token = session_obj.get('metadata', {}).get('token', '')
  pending_obj = models.PendingBook.objects.filter(token=token).first()
  if not pending_obj:
    return
  data = pending_obj.data

  # 3. DB保存
  # 購入者登録
  buyer_data = data.get('buyer')
  buyer_obj, _ = models.Buyer.objects.get_or_create(
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
  hair = models.FacePart.objects.filter(id=face.get('hair')).first() if face else None
  eye = models.FacePart.objects.filter(id=face.get('eye')).first() if face else None
  nose = models.FacePart.objects.filter(id=face.get('nose')).first() if face else None
  mouth = models.FacePart.objects.filter(id=face.get('mouth')).first() if face else None
  hair_color = models.Colors.objects.filter(color=face.get('hairColor')).first() if face else None
  skin_color = models.Colors.objects.filter(color=face.get('skinColor')).first() if face else None

  # book登録
  book_obj = models.Book.objects.create(
    token=pending_obj.token,
    buyer=buyer_obj,
    theme_id=data.get('theme_id'),
    title=data.get('title'),
    book_type=data.get('type'),
    status=models.Book.STATUS_STRIPE,
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
    models.BookPage.objects.create(
      book=book_obj,
      spread=spread.get('sp_num'),
      text1=spread.get('text1'),
      text2=spread.get('text2'),
      img=models.Image.objects.filter(id=(spread.get('img') or {}).get('id')).first(),
    )

  # 回答ログにbookを紐付け
  log_id = data.get('log_id')
  if log_id:
    models.AnswerLog.objects.filter(
      id = log_id
    ).update(
      book = book_obj
    )

  # pendingデータ削除
  pending_obj.delete()

  # 4. SESメール送信
  home = urlencode({'client': book_obj.theme.client.name, 'theme': book_obj.theme.name})
  download_url = f"{os.environ.get('FRONT_URL')}/ehon/{book_obj.token}?{home}"
  if data.get('type') == models.Book.TYPE_PDF:
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
  book_obj = models.Book.objects.filter(token=token).first()
  if not book_obj:
    return Response({'error': 'book not found'}, status=404)

  # 取得有効期限チェック
  if timezone.now() > book_obj.pdf_exp:
    return Response({'error': 'pdf expired'}, status=403)

  spread_obj = models.BookPage.objects.filter(book=book_obj).order_by('spread').select_related('img')

  return Response({
    'title': book_obj.title,
    'status': book_obj.status,
    'pdf_exp': book_obj.pdf_exp,
    'face': {
      'hair': book_obj.hair.id if book_obj.hair else None,
      'eye': book_obj.eye.id if book_obj.eye else None,
      'nose': book_obj.nose.id if book_obj.nose else None,
      'mouth': book_obj.mouth.id if book_obj.mouth else None,
      'hairColor': book_obj.hair_color.color if book_obj.hair_color else None,
      'skinColor': book_obj.skin_color.color if book_obj.skin_color else None,
    },
    'face_parts': {
      'hair':  [{'id': book_obj.hair.id,  'img_path': f"{settings.MEDIA_URL}faces/{book_obj.hair.img_path}"}] if book_obj.hair else None,
      'eye':   [{'id': book_obj.eye.id,   'img_path': f"{settings.MEDIA_URL}faces/{book_obj.eye.img_path}", 'eye_turn': book_obj.eye.eye_turn}] if book_obj.eye else None,
      'nose':  [{'id': book_obj.nose.id,  'img_path': f"{settings.MEDIA_URL}faces/{book_obj.nose.img_path}"}] if book_obj.nose else None,
      'mouth': [{'id': book_obj.mouth.id, 'img_path': f"{settings.MEDIA_URL}faces/{book_obj.mouth.img_path}"}] if book_obj.mouth else None,
    },
    'spreads': [{
      'sp_num': sp.spread,
      'text1': sp.text1,
      'text2': sp.text2,
      'img': {
          'img_path': f"{settings.MEDIA_URL}images/{sp.img.img_path}" if sp.img else None,
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


# テーマ一覧取得 ※ダッシュボード用
@api_view(['GET'])
def get_themes(request):
  # 1. バリデーション
  client = request.GET.get('client')
  client_obj = models.Client.objects.filter(name=client).first()
  if not client_obj:
    return Response({'error': 'bad request'}, status=400)

  # 2. テーマ一覧取得
  theme_obj = models.Theme.objects.filter(client=client_obj).order_by('id')
  theme_list = [{
    'name': t.name,
    'year': t.year,
  } for t in theme_obj]

  # レスポンス
  return Response({'themes': theme_list}, status=200)
