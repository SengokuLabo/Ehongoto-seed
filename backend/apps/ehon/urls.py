from django.urls import path
from . import views, views_coupon, views_client

urlpatterns = [
  path('questions', views.get_question, name='質問取得'),
  path('generate', views.generate, name='物語作成'),
  path('payment', views.payment, name='決済要求'),
  path('payment/callback', views.callback, name='決済応答'),
  path('ehon/<uuid:token>', views.ehon_data, name='絵本データ取得'),
  path('contact', views.contact, name='問い合わせメール'),
  path('themes', views.get_themes, name='テーマ一覧取得'),

  # クーポン関係
  path('coupon/check', views_coupon.coupon_check, name='クーポンチェック'),
  path('coupon/use', views_coupon.coupon_use, name='クーポン使用'),

  # クライアント関係
  path('client/add', views_client.add, name='クライアント仮登録'),
  path('client/verify/<uuid:token>', views_client.verify, name='クライアント本登録'),
  path('client/login', views_client.login, name='クライアント ログイン'),
  path('client/themes', views_client.themes, name='クライアント テーマ一覧'),
  path('client/coupon/purchase', views_client.coupon_payment, name='クライアント クーポン購入'),
]
