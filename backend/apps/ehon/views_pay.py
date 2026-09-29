import json, os, stripe
from rest_framework.decorators import api_view
from rest_framework.response import Response
from . import models, views, views_client


# 絵本購入 決済要求
@api_view(['POST'])
def payment_ehon(request):
  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  # 1. バリデーション
  book_type = body.get('type')
  if not book_type:
    return Response({'error': 'bad request'}, status=400)
  types = [t[0] for t in models.Book.BOOK_TYPE]
  if book_type not in types:
    return Response({'error': 'bad request'}, status=400)
  client_obj = models.Client.objects.filter(name=body.get('client')).first()
  if not client_obj:
    return Response({'error': 'bad request'}, status=400)
  theme_obj = models.Theme.objects.filter(client=client_obj, name=body.get('theme')).first()
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
  if book_type == models.Book.TYPE_PDF:
    price = theme_obj.price_pdf
  elif book_type == models.Book.TYPE_SOFT:
    price = theme_obj.price_soft
  else:
    price = theme_obj.price_hard

  # 3. pendingデータ登録
  pending_obj = models.PendingBook.objects.create(data={
    'type': book_type,
    'theme_id': theme_obj.id,
    'title': title,
    'price': price,
    'buyer': buyer,
    'face': body.get('face'),
    'log_id': body.get('log_id'),
    'spreads': spreads,
  })

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
    success_url=f"{os.environ.get('FRONT_URL')}/ehon/{pending_obj.token}",
    cancel_url=f"{os.environ.get('FRONT_URL')}/purchase",
    metadata={'token': str(pending_obj.token), 'type': 'book'},
    customer_email=buyer.get('email'),
  )

  # 5. フロントに決済URLを返却
  return Response({'ck_url': session.url}, status=200)


# 絵本購入(クーポン) 決済要求
@api_view(['POST'])
def payment_ehon_coupon(request):
  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return Response({'error': 'bad request'}, status=400)

  # 1. バリデーション
  book_type = body.get('type')
  if not book_type:
    return Response({'error': 'bad request'}, status=400)
  types = [t[0] for t in models.Book.BOOK_TYPE]
  if book_type not in types:
    return Response({'error': 'bad request'}, status=400)
  buyer = body.get('buyer')
  if not buyer:
    return Response({'error': 'bad request'}, status=400)
  if not buyer.get('name'):
    return Response({'error': 'bad request'}, status=400)
  if not buyer.get('email'):
    return Response({'error': 'bad request'}, status=400)
  log_id = body.get('log_id')
  if not log_id:
    return Response({'error': 'bad request'}, status=400)
  log_obj = models.AnswerLog.objects.select_related('book', 'theme').filter(id=log_id).first() if log_id else None
  if not log_obj:
    return Response({'error': 'bad request'}, status=400)
  ex_book_obj = log_obj.book if log_obj else None
  theme_obj = log_obj.theme if log_obj else None
  if not ex_book_obj or not theme_obj:
    return Response({'error': 'bad request'}, status=400)

  # 2. 金額設定
  if book_type == models.Book.TYPE_PDF:
    price = theme_obj.price_pdf
  elif book_type == models.Book.TYPE_SOFT:
    price = theme_obj.price_soft
  else:
    price = theme_obj.price_hard

  # 3. pendingデータ登録
  pending_obj = models.PendingBook.objects.create(
    token=ex_book_obj.token,
    data={
      'type': book_type,
      'theme_id': theme_obj.id,
      'price': price,
      'buyer': buyer,
    })

  # 4. Stripe決済
  session = stripe.checkout.Session.create(
    payment_method_types=['card'],
    line_items=[{
      'price_data': {
        'currency': 'jpy',
        'product_data': {'name': ex_book_obj.title},
        'unit_amount': price,
      },
      'quantity': 1,
    }],
    mode='payment',
    success_url=f"{os.environ.get('FRONT_URL')}/ehon/{pending_obj.token}",
    cancel_url=f"{os.environ.get('FRONT_URL')}/purchase",
    metadata={'token': str(pending_obj.token), 'type': 'book_coupon'},
    customer_email=buyer.get('email'),
  )

  # 5. フロントに決済URLを返却
  return Response({'ck_url': session.url}, status=200)


# クライアント クーポン購入 決済要求
@api_view(['POST'])
def payment_coupon(request):
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
    cancel_url=f"{os.environ.get('FRONT_URL')}/client",
    metadata={'type': 'coupon', 'theme_id': str(theme_id), 'count': str(count)},
    customer_email=theme_obj.client.email,
  )

  # 3. クーポン画面にリダイレクト
  return Response({'ck_url': session.url})


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

  # 2. タイプ別後続処理に分岐
  session_obj = event.get('data', {}).get('object', {})
  event_type = event.get('type')
  if event_type == 'checkout.session.completed':
    meta_type = session_obj.get('metadata', {}).get('type')
    if meta_type == 'book':
      # 絵本購入時
      views._book_purchase(session_obj)
    elif meta_type == 'book_coupon':
      # 絵本購入時(クーポン)
      views._book_coupon_purchase(session_obj)
    elif meta_type == 'coupon':
      # クーポン購入時（クライアント）
      views_client._coupon_purchase(session_obj)
    elif meta_type == 'subsc':
      # サブスク登録時（クライアント）
      views_client._subsc_signup(session_obj)
  elif event_type == 'invoice.payment_succeeded':
    # サブスクの毎月決済時（クライアント）
    views_client._coupon_reset(session_obj)
  elif event_type == 'customer.subscription.updated':
    # サブスクプラン変更（クライアント）
    views_client._subsc_update(session_obj)
  elif event_type == 'customer.subscription.deleted':
    # サブスク解約（クライアント）
    views_client._subsc_deleted(session_obj)

  # 3. Stripe に 200 返却
  return Response({'detail': 'callback ok!'}, status=200)
