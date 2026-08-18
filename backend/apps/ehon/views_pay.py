import json, os, stripe
from rest_framework.decorators import api_view
from rest_framework.response import Response
from urllib.parse import urlencode
from . import models
from .views import _book_purchase
from .views_client import _coupon_purchase, _subsc_signup, _subsc_update, _subsc_deleted, _coupon_reset

# Stripe決済要求
@api_view(['POST'])
def payment(request):
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
    customer_email=buyer.get('email'),
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

  # 2. タイプ別後続処理に分岐
  session_obj = event.get('data', {}).get('object', {})
  event_type = event.get('type')
  if event_type == 'checkout.session.completed':
    meta_type = session_obj.get('metadata', {}).get('type')
    if meta_type == 'book':
      # 絵本購入時
      _book_purchase(session_obj)
    elif meta_type == 'coupon':
      # クーポン購入時（クライアント）
      _coupon_purchase(session_obj)
    elif meta_type == 'subsc':
      # サブスク登録時（クライアント）
      _subsc_signup(session_obj)
  elif event_type == 'invoice.payment_succeeded':
    # サブスクの毎月決済時（クライアント）
    _coupon_reset(session_obj)
  elif event_type == 'customer.subscription.updated':
    # サブスクプラン変更（クライアント）
    _subsc_update(session_obj)
  elif event_type == 'customer.subscription.deleted':
    # サブスク解約（クライアント）
    _subsc_deleted(session_obj)

  # 3. Stripe に 200 返却
  return Response({'detail': 'callback ok!'}, status=200)
