from django.urls import path
from . import views

urlpatterns = [
  path('questions', views.get_question, name='質問取得'),
  path('generate', views.generate, name='物語作成'),
  path('payment', views.payment, name='決済要求'),
  path('payment/callback', views.callback, name='決済応答'),
  path('ehon/<uuid:token>', views.ehon_data, name='絵本データ取得'),
  path('contact', views.contact, name='問い合わせメール'),
]
