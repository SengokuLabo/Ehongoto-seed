import json, os, stripe, secrets, string
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.shortcuts import redirect
from django.contrib.auth import authenticate, login as auth_login
from . import models
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
  if models.User.objects.filter(email=email).exists():
    return Response({'error': 'already exists'}, status=409)

  if models.Client.objects.filter(name=client_name).exists():
    return Response({'error': 'already exists'}, status=409)

  # 2. クライアント作成
  with transaction.atomic():
    user_obj = models.User.objects.create_user(
      username=email,
      email=email,
      password=password,
      is_active=False,
    )

    client_obj = models.Client.objects.create(
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
  client_obj = models.Client.objects.filter(chk_token=token).first()
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
  client_obj = models.Client.objects.filter(user=request.user).first()
  if not client_obj:
    return Response({'error': 'bad request'}, status=401)

  # 2. サブスク取得
  c_subsc_obj = models.ClientSubsc.objects.filter(client=client_obj, status=models.ClientSubsc.SUBSC_ACTIVE).order_by('-start_at').first()
  c_subsc = {
    'status': c_subsc_obj.status,
    'plan': c_subsc_obj.subsc.name,
    'start_at': c_subsc_obj.start_at,
  } if c_subsc_obj else None

  c_dist_obj = models.CouponDist.objects.filter(client_subsc=c_subsc_obj) if c_subsc_obj else {}
  c_dist = {d.theme_id: d.coupon_cnt for d in c_dist_obj} if c_dist_obj else {}

  # 3. テーマ取得
  themes_obj = models.Theme.objects.filter(client=client_obj).prefetch_related('coupon_set')
  theme_list = [{
    'id': t.id,
    'name': t.name,
    'year': t.year,
    'pdf': t.price_pdf,
    'coupon_cnt': c_dist.get(t.id),
    'coupons': [{
      'code': c.code,
      'max_uses': c.max_uses,
      'rest_cnt': c.rest_cnt,
      'valid_until': c.valid_until,
    } for c in t.coupon_set.all()]
  } for t in themes_obj]

  # 毎月配布分のクーポン最大枚数（基本配布数 + 追加テーマ数）
  max_cnt = c_subsc_obj.subsc.base_cnt + (c_subsc_obj.subsc.add_cnt * (themes_obj.count()-1)) if c_subsc_obj else 0

  # レスポンス
  return Response({
    'client': client_obj.name,
    'themes': theme_list,
    'subsc': c_subsc,
    'max_cnt': max_cnt,
    'is_free': client_obj.is_free,
  }, status=200)


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
  client_obj = models.Client.objects.filter(user=request.user).first()
  count = body.get('count')
  if not theme_id or not client_obj or not count:
    return Response({'error': 'bad request'}, status=400)

  theme_obj = models.Theme.objects.filter(id=theme_id, client=client_obj).first()
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
  theme_obj = models.Theme.objects.filter(id=theme_id).first()
  if not theme_obj:
    return

  # 2. クーポン生成
  models.Coupon.objects.create(
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


# サブスク一覧取得
@api_view(['GET'])
def subsc_plan(request):
  plans = models.Subsc.objects.order_by('price').all()
  return Response([{
    'id': p.id,
    'name': p.name,
    'price': p.price,
    'base_cnt': p.base_cnt,
  } for p in plans], status=200)


# サブスク登録
@api_view(['POST'])
def subsc_signup(request):
  # 1. バリデーション
  if not request.user.is_authenticated:
    return Response({'error': 'bad request'}, status=401)

  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  subsc_id = body.get('subsc_id')
  client_obj = models.Client.objects.filter(user=request.user).first()
  if not subsc_id or not client_obj:
    return Response({'error': 'bad request'}, status=400)

  # 既存のアクティブサブスクをチェック
  if models.ClientSubsc.objects.filter(client=client_obj, status=models.ClientSubsc.SUBSC_ACTIVE).exists():
    return Response({'error': 'bad request'}, status=400)

  subsc_obj = models.Subsc.objects.filter(id=subsc_id).first()
  if not subsc_obj:
    return Response({'error': 'bad request'}, status=400)

  # 2. stripeセッション作成
  session = stripe.checkout.Session.create(
    payment_method_types=['card'],
    line_items=[{'price': subsc_obj.sp_price_id, 'quantity': 1}],
    mode='subscription',
    subscription_data={'trial_period_days': 30},
    success_url=f"{os.environ.get('FRONT_URL')}/client",
    cancel_url=f"{os.environ.get('FRONT_URL')}/client/subsc",
    metadata={'type': 'subsc', 'client_id': str(client_obj.id), 'subsc_id': str(subsc_obj.id)},
    customer_email=client_obj.email,
  )

  # レスポンス
  return Response({'ck_url': session.url}, status=200)


# サブスク登録後処理
def _subsc_signup(obj):
  client_id = obj.get('metadata', {}).get('client_id')
  subsc_id = obj.get('metadata', {}).get('subsc_id')
  sp_sub_id = obj.get('subscription', '')
  client_obj = models.Client.objects.filter(id=client_id).first()
  subsc_obj = models.Subsc.objects.filter(id=subsc_id).first()
  if not client_obj or not subsc_obj:
    return
  models.ClientSubsc.objects.create(
    client=client_obj,
    subsc=subsc_obj,
    sp_sub_id=sp_sub_id,
    status=models.ClientSubsc.SUBSC_ACTIVE,
  )


# サブスクキャンセル
@api_view(['POST'])
def subsc_cancel(request):
  # 1. バリデーション
  if not request.user.is_authenticated:
    return Response({'error': 'bad request'}, status=401)

  # 2. サブスク情報取得
  client_obj = models.Client.objects.filter(user=request.user).first()
  if not client_obj:
    return Response({'error': 'bad request'}, status=401)

  c_subsc_obj = models.ClientSubsc.objects.filter(
    client=client_obj, status=models.ClientSubsc.SUBSC_ACTIVE
  ).first()
  if not c_subsc_obj:
    return Response({'error': 'bad request'}, status=400)

  # 3. stripe処理
  stripe.Subscription.modify(c_subsc_obj.sp_sub_id, cancel_at_period_end=True)

  # レスポンス
  return Response({'detail': 'ok!'}, status=200)


# サブスクキャンセル後処理
def _subsc_deleted(obj):
  sp_sub_id = obj.get('id', '')
  models.ClientSubsc.objects.filter(sp_sub_id=sp_sub_id).update(
    status=models.ClientSubsc.SUBSC_CANCEL,
    end_at=timezone.now(),
  )


# サブスクプラン更新後処理
def _subsc_update(obj):
  sp_sub_id = obj.get('id', '')
  status = obj.get('status', '')
  status_map = {
    'active': models.ClientSubsc.SUBSC_ACTIVE,
    'trialing': models.ClientSubsc.SUBSC_ACTIVE,
    'canceled': models.ClientSubsc.SUBSC_CANCEL,
    'past_due': models.ClientSubsc.SUBSC_PASTDUE,
  }
  mapped = status_map.get(status)
  if mapped:
    models.ClientSubsc.objects.filter(sp_sub_id=sp_sub_id).update(status=mapped)


# 毎月課金確認後のクーポン使用回数リセット処理
def _coupon_reset(obj):
  sp_sub_id = obj.get('subscription', '')
  c_subsc_obj = models.ClientSubsc.objects.filter(sp_sub_id=sp_sub_id).select_related('subsc').first()
  if not c_subsc_obj:
    return
  models.CouponDist.objects.filter(client_subsc=c_subsc_obj).update(
    coupon_cnt=c_subsc_obj.subsc.base_cnt,
  )


# クーポン配分の更新
@api_view(['PUT'])
def coupon_dist(request):
  # 1. セッション認証確認
  if not request.user.is_authenticated:
    return Response({'error': 'bad request'}, status=401)

  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  if not isinstance(body, list) or not body:
    return Response({'error': 'bad request'}, status=400)

  client_obj = models.Client.objects.filter(user=request.user).first()
  if not client_obj:
    return Response({'error': 'bad request'}, status=400)

  c_client_subsc = models.ClientSubsc.objects.filter(client=client_obj, status=models.ClientSubsc.SUBSC_ACTIVE).first()
  if not c_client_subsc:
    return Response({'error': 'bad request'}, status=400)

  # 2. サブスク単位で処理
  with transaction.atomic():
    for item in body:
      theme = item.get('theme')
      cnt = item.get('cnt')
      if not theme or cnt is None:
        return Response({'error': 'bad request'}, status=400)

      theme_obj = models.Theme.objects.filter(client=client_obj, name=theme).first()
      if not theme_obj:
        return Response({'error': 'bad request'}, status=400)

      # 3. クーポン配分を更新
      models.CouponDist.objects.update_or_create(
        client_subsc=c_client_subsc,
        theme=theme_obj,
        defaults={'coupon_cnt': cnt},
      )

  # レスポンス
  return Response({'detail': 'ok!'}, status=200)
