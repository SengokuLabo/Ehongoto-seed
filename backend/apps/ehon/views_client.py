import json, os, stripe, secrets, string
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.shortcuts import redirect
from django.contrib.auth import authenticate, login as auth_login
from .models import Client, User, Theme, Coupon
from apps.common.auth import send_mail
from apps.common.mail_temp import client_add, client_verify, client_coupon

# クーポンコード発行
def gen_code():
  chars = string.ascii_uppercase + string.digits
  rand = ''.join(secrets.choice(chars) for _ in range(7))
  return f"EHG{rand}"


# クライアント仮登録
@api_view(['POST'])
def add(request):
  # 1. バリデーション
  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  name = body.get('name')
  email = body.get('email')
  password = body.get('password')
  client_name = body.get('client_name')
  if not name or not email or not password or not client_name:
    return Response({'error': 'bad request'}, status=400)
  if User.objects.filter(email=email).exists():
    return Response({'error': 'already exists'}, status=409)

  if Client.objects.filter(name=client_name).exists():
    return Response({'error': 'already exists'}, status=409)

  # 2. クライアント作成
  with transaction.atomic():
    user_obj = User.objects.create_user(
      username=email,
      email=email,
      password=password,
      is_active=False,
    )

    client_obj = Client.objects.create(
      user=user_obj,
      name=client_name,
      email=email,
      chk_exp=(timezone.now() + timedelta(days=1)),
    )

  # 3. 確認メール送信
  apply_url = f"{os.environ.get('FRONT_URL')}/api/client/verify/{client_obj.chk_token}"
  body_text = client_add(name, apply_url)
  send_mail(
    to=email,
    subject=f'【えほんごとのたね】 {name}様',
    body_text=body_text,
    body_html=None,
    service_name='えほんごとのたね',
    reply_to=os.environ.get('ADMIN_EMAIL'),
  )

  # レスポンス
  return Response({'detail': 'ok'}, status=200)


# クライアント本登録
@api_view(['GET'])
def verify(request, token):
  # 1. バリデーション
  client_obj = Client.objects.filter(chk_token=token).first()
  if not client_obj or not client_obj.user:
    return Response({'error': 'client not found'}, status=404)

  if not client_obj.chk_exp or timezone.now() > client_obj.chk_exp:
    return Response({'error': 'client expired'}, status=403)

  # 2. User更新
  client_obj.user.is_active = True
  client_obj.user.save()

  # 3. 管理者へメール
  body_text = client_verify(client_obj.name, client_obj.email, timezone.now())
  send_mail(
    to=os.environ.get('ADMIN_EMAIL'),
    subject='【えほんごとのたね】 クライアント本登録対応',
    body_text=body_text,
    body_html=None,
    service_name='えほんごとのたね',
    reply_to=os.environ.get('ADMIN_EMAIL')
  )

  # 4. ログイン画面にリダイレクト
  return redirect(f"{os.environ.get('FRONT_URL')}/client/login")

# クライアント ログイン
@api_view(['POST'])
def login(request):
  # 1. バリデーション
  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  email = body.get('email')
  password = body.get('password')
  if not email or not password:
    return Response({'error': 'bad request'}, status=400)

  # 2. ログイン
  user = authenticate(request, username=email, password=password)
  if not user:
    return Response({'error': 'bad request'}, status=400)

  # セッション発行
  auth_login(request, user)

  # 3. レスポンス
  return Response({'detail': 'ok!'}, status=200)


# クライアント テーマ情報取得
@api_view(['GET'])
def themes(request):
  # 1. バリデーション
  if not request.user.is_authenticated:
    return Response({'error': 'bad request'}, status=401)
  client_obj = Client.objects.filter(user=request.user).first()
  if not client_obj:
    return Response({'error': 'bad request'}, status=401)

  # 2. テーマ取得
  themes_obj = Theme.objects.filter(client=client_obj).prefetch_related('coupon_set')
  theme_list = [{
    'id': t.id,
    'name': t.name,
    'year': t.year,
    'pdf': t.price_pdf,
    'coupons': [{
      'code': c.code,
      'max_uses': c.max_uses,
      'rest_cnt': c.rest_cnt,
      'valid_until': c.valid_until,
    } for c in t.coupon_set.all()]
  } for t in themes_obj]

  # レスポンス
  return Response({'themes': theme_list}, status=200)


# クライアント クーポン購入 決済要求
@api_view(['POST'])
def coupon_payment(request):
  # 1. バリデーション
  if not request.user.is_authenticated:
    return Response({'error': 'bad request'}, status=401)

  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  theme_id = body.get('theme_id')
  client_obj = Client.objects.filter(user=request.user).first()
  count = body.get('count')
  if not theme_id or not client_obj or not count:
    return Response({'error': 'bad request'}, status=400)

  theme_obj = Theme.objects.filter(id=theme_id, client=client_obj).first()
  if not theme_obj:
    return Response({'error': 'bad request'}, status=400)

  # 2. Stripe Checkout Session 発行
  session = stripe.checkout.Session.create(
    payment_method_types=['card'],
    line_items=[{
      'price_data': {
        'currency': 'jpy',
        'product_data': {'name': theme_obj.name},
        'unit_amount': theme_obj.price_pdf * count,
      },
      'quantity': 1,
    }],
    mode='payment',
    success_url=f"{os.environ.get('FRONT_URL')}/client",
    cancel_url=f"{os.environ.get('FRONT_URL')}/coupon",
    metadata={'type': 'coupon', 'theme_id': str(theme_id), 'count': str(count)},
    customer_email=theme_obj.client.email,
  )

  # 3. クーポン画面にリダイレクト
  return Response({'ck_url': session.url})


# クーポン購入後処理
def _coupon_purchase(session_obj):
  # 1. テーマ取得
  sp_pay_id = session_obj.get('id', '')
  theme_id = session_obj.get('metadata', {}).get('theme_id', '')
  count = session_obj.get('metadata', {}).get('count', '')
  theme_obj = Theme.objects.filter(id=theme_id).first()
  if not theme_obj:
    return

  # 2. クーポン生成
  Coupon.objects.create(
    theme=theme_obj,
    code=gen_code(),
    max_uses=int(count),
    rest_cnt=int(count),
    valid_until=timezone.now() + timedelta(days=90),
    sp_pay_id=sp_pay_id,
  )

  # 3. 運営にメール
  body_text = client_coupon(theme_obj.client.name, theme_obj.client.email, theme_obj.name)
  send_mail(
    to=os.environ.get('ADMIN_EMAIL'),
    subject='【えほんごとのたね】 クライアント クーポン購入',
    body_text=body_text,
    body_html=None,
    service_name='えほんごとのたね',
    reply_to=os.environ.get('ADMIN_EMAIL')
  )
