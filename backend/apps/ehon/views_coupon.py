import json, os
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import F
from django.utils import timezone
from datetime import timedelta
from urllib.parse import urlencode
from apps.common.auth import send_mail
from apps.common.mail_temp import pdf_purchase
from .models import Coupon, LkCoupon, Buyer, Book, BookPage, FacePart, Colors, Image, AnswerLog

# クーポン認証
@api_view(['POST'])
def coupon_check(request):
  # 1. バリデーション
  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  code = body.get('code')
  if not code:
    return Response({'error': 'bad request'}, status=400)

  name = body.get('name')
  if not name:
    return Response({'error': 'bad request'}, status=400)

  email = body.get('email')
  if not email:
    return Response({'error': 'bad request'}, status=400)

  # セッション取得
  if not request.session.session_key:
    request.session.create()
  session_key = request.session.session_key

  # 2. クーポン取得
  coupon_obj = Coupon.objects.filter(code=code).first()
  if not coupon_obj:
    return Response({'error': 'bad request'}, status=400)

  # クーポン有効期限切れチェック
  exp = timezone.localtime(coupon_obj.valid_until)
  if coupon_obj.valid_until and exp.date() < timezone.localtime(timezone.now()).date():
    return Response({'error': 'bad request'}, status=410)

  # 3. 期限切れ排他解除
  LkCoupon.objects.filter(coupon=coupon_obj, exp_at__lt=timezone.now()).delete()
  LkCoupon.objects.filter(coupon=coupon_obj, session=session_key).delete()

  # クーポン有効残数を取得
  lkCoupon_obj = LkCoupon.objects.filter(coupon=coupon_obj)
  if coupon_obj.rest_cnt - lkCoupon_obj.count() <= 0:
    return Response({'error': 'bad request'}, status=409)

  # 4. クーポン排他を作成
  new_lk = LkCoupon.objects.create(
    coupon=coupon_obj,
    session=session_key,
    name=name,
    email=email,
    exp_at=timezone.now() + timedelta(hours=2),
  )

  # 5. レスポンス
  return Response({
    'lk_token': str(new_lk.lk_token),
    'client': str(coupon_obj.theme.client.name),
    'theme': str(coupon_obj.theme.name),
  }, status=200)


# クーポン使用
@api_view(['POST'])
def coupon_use(request):
  # 1. バリデーション
  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  lk_token = body.get('lk_token')
  face = body.get('face')
  spreads = body.get('spreads')
  if not lk_token or not spreads:
    return Response({'error': 'bad request'}, status=400)

  lk_coupon_obj = LkCoupon.objects.filter(lk_token=lk_token).first()
  if not lk_coupon_obj or lk_coupon_obj.exp_at < timezone.now():
    # クーポン排他が切れている場合は、再入力案内
    return Response({'error': 'expired'}, status=410)

  # 2. クーポン残数更新
  Coupon.objects.filter(id=lk_coupon_obj.coupon.id).update(rest_cnt=F('rest_cnt')-1)

  # 3. 絵本制作
  # 購入者登録
  buyer_obj, _ = Buyer.objects.get_or_create(
    email=lk_coupon_obj.email,
    defaults={
      'name': lk_coupon_obj.name,
      'address': '',
      'mail_ok': True,
    }
  )

  # book登録
  hair = FacePart.objects.filter(id=face.get('hair')).first() if face else None
  eye = FacePart.objects.filter(id=face.get('eye')).first() if face else None
  nose = FacePart.objects.filter(id=face.get('nose')).first() if face else None
  mouth = FacePart.objects.filter(id=face.get('mouth')).first() if face else None
  hair_color = Colors.objects.filter(color=face.get('hairColor')).first() if face else None
  skin_color = Colors.objects.filter(color=face.get('skinColor')).first() if face else None
  book_obj = Book.objects.create(
    buyer=buyer_obj,
    theme=lk_coupon_obj.coupon.theme,
    title=spreads[0].get('text1', ''),
    book_type=Book.TYPE_PDF,
    status=Book.STATUS_COUPON,
    price=lk_coupon_obj.coupon.theme.price_pdf,
    pdf_exp=timezone.now() + timedelta(days=30),
    hair=hair,
    eye=eye,
    nose=nose,
    mouth=mouth,
    hair_color=hair_color,
    skin_color=skin_color,
  )

  # ページ登録
  for spread in spreads:
    BookPage.objects.create(
      book=book_obj,
      spread=spread.get('sp_num'),
      text1=spread.get('text1'),
      text2=spread.get('text2'),
      img=Image.objects.filter(id=(spread.get('img') or {}).get('id')).first(),
    )

  # 回答ログにbookを紐付け
  log_id = body.get('log_id')
  if log_id:
    AnswerLog.objects.filter(id=log_id).update(book=book_obj)

  # 4. クーポン排他解除
  lk_coupon_obj.delete()

  # 5. ダウンロードメール
  home = urlencode({'client': book_obj.theme.client.name, 'theme': book_obj.theme.name})
  download_url = f"{os.environ.get('FRONT_URL')}/ehon/{book_obj.token}?{home}"
  body_text, body_html = pdf_purchase(book_obj, download_url)
  send_mail(
    to=buyer_obj.email,
    subject='えほんごとのたね |ダウンロードリンクのご案内',
    body_text=body_text,
    body_html=body_html,
    service_name=book_obj.theme.client.name,
    reply_to=book_obj.theme.client.email,
  )

  # 6. レスポンス
  return Response({'dl_url': download_url}, status=200)
