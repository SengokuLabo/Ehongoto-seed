import os, uuid, stripe as stripe_mod
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from .models import Client, Theme, Coupon, LkCoupon, FacePart, Colors, Image, Subsc, ClientSubsc, FaceGroupName, FaceGroup, PendingBook, Book


# =====================
# 共通データ（各テストクラスが継承して使う）
# =====================
class BaseSetup(TestCase):

  def setUp(self):
    self.user = User.objects.create_user(
      username='client@test.com',
      email='client@test.com',
      password='password123',
      is_active=True,
    )
    self.client_obj = Client.objects.create(
      user=self.user,
      name='テスト社',
      email='client@test.com',
    )
    self.theme = Theme.objects.create(
      client=self.client_obj,
      name='テストテーマ',
      price_pdf=300,
    )
    self.coupon = Coupon.objects.create(
      theme=self.theme,
      code='EHGTEST01',
      max_uses=5,
      rest_cnt=5,
      valid_until=timezone.now() + timedelta(days=30),
    )
    self.hair  = FacePart.objects.create(part='hair',  img_path='hair.png')
    self.eye   = FacePart.objects.create(part='eye',   img_path='eye.png')
    self.nose  = FacePart.objects.create(part='nose',  img_path='nose.png')
    self.mouth = FacePart.objects.create(part='mouth', img_path='mouth.png')
    self.hair_color = Colors.objects.create(part='hair', label='黒',   color='#000000')
    self.skin_color = Colors.objects.create(part='skin', label='普通', color='#FFD5B4')
    self.image = Image.objects.create(img_path='test.png', client=self.client_obj)
    self.api = APIClient()
    self.face = {
      'hair':      self.hair.id,
      'eye':       self.eye.id,
      'nose':      self.nose.id,
      'mouth':     self.mouth.id,
      'hairColor': '#000000',
      'skinColor': '#FFD5B4',
    }
    self.spreads = [
      {'sp_num': 0, 'text1': 'テスト絵本', 'text2': '', 'img': {'id': self.image.id}},
    ]


# =====================
# 1. POST /api/client/add
# =====================
class ClientAddTest(TestCase):

  def setUp(self):
    self.api = APIClient()
    self.url = '/api/client/add'
    self.data = {
      'name': '山田 太郎',
      'email': 'new@test.com',
      'password': 'password123',
      'client_name': '新規テスト社',
    }

  @patch('apps.ehon.views_client.send_mail')
  def test_ok(self, mock_mail):
    res = self.api.post(self.url, self.data, format='json')
    self.assertEqual(res.status_code, 200)
    mock_mail.assert_called_once()

  def test_no_name(self):
    res = self.api.post(self.url, {**self.data, 'name': ''}, format='json')
    self.assertEqual(res.status_code, 400)

  def test_no_email(self):
    res = self.api.post(self.url, {**self.data, 'email': ''}, format='json')
    self.assertEqual(res.status_code, 400)

  def test_no_password(self):
    res = self.api.post(self.url, {**self.data, 'password': ''}, format='json')
    self.assertEqual(res.status_code, 400)

  def test_no_client_name(self):
    res = self.api.post(self.url, {**self.data, 'client_name': ''}, format='json')
    self.assertEqual(res.status_code, 400)

  @patch('apps.ehon.views_client.send_mail')
  def test_email_dup(self, mock_mail):
    self.api.post(self.url, self.data, format='json')
    res = self.api.post(self.url, {**self.data, 'client_name': '別社'}, format='json')
    self.assertEqual(res.status_code, 409)

  @patch('apps.ehon.views_client.send_mail')
  def test_client_name_dup(self, _):
    self.api.post(self.url, self.data, format='json')
    res = self.api.post(self.url, {**self.data, 'email': 'other@test.com'}, format='json')
    self.assertEqual(res.status_code, 409)


# =====================
# 2. GET /api/client/verify/{token}
# =====================
class ClientVerifyTest(TestCase):

  def setUp(self):
    self.api = APIClient()
    self.user = User.objects.create_user(
      username='verify@test.com',
      email='verify@test.com',
      password='password123',
      is_active=False,
    )
    self.client_obj = Client.objects.create(
      user=self.user,
      name='確認社',
      email='verify@test.com',
      chk_exp=timezone.now() + timedelta(days=1),
    )

  @patch('apps.ehon.views_client.send_mail')
  def test_ok(self, _):
    res = self.api.get(f'/api/client/verify/{self.client_obj.chk_token}')
    self.assertEqual(res.status_code, 302)
    self.user.refresh_from_db()
    self.assertTrue(self.user.is_active)

  def test_invalid_token(self):
    res = self.api.get(f'/api/client/verify/{uuid.uuid4()}')
    self.assertEqual(res.status_code, 404)

  def test_expired(self):
    self.client_obj.chk_exp = timezone.now() - timedelta(days=1)
    self.client_obj.save()
    res = self.api.get(f'/api/client/verify/{self.client_obj.chk_token}')
    self.assertEqual(res.status_code, 403)


# =====================
# 3. POST /api/client/login
# =====================
class ClientLoginTest(TestCase):

  def setUp(self):
    self.api = APIClient()
    self.url = '/api/client/login'
    self.user = User.objects.create_user(
      username='login@test.com',
      email='login@test.com',
      password='password123',
      is_active=True,
    )

  def test_ok(self):
    res = self.api.post(self.url, {'email': 'login@test.com', 'password': 'password123'}, format='json')
    self.assertEqual(res.status_code, 200)

  def test_wrong_password(self):
    res = self.api.post(self.url, {'email': 'login@test.com', 'password': 'wrongpass'}, format='json')
    self.assertEqual(res.status_code, 400)

  def test_not_exist(self):
    res = self.api.post(self.url, {'email': 'noone@test.com', 'password': 'password123'}, format='json')
    self.assertEqual(res.status_code, 400)

  def test_inactive(self):
    self.user.is_active = False
    self.user.save()
    res = self.api.post(self.url, {'email': 'login@test.com', 'password': 'password123'}, format='json')
    self.assertEqual(res.status_code, 400)


# =====================
# 4. GET /api/client/themes
# =====================
class ClientThemesTest(BaseSetup):

  def test_ok(self):
    self.api.force_login(self.user)
    res = self.api.get('/api/client/themes')
    self.assertEqual(res.status_code, 200)
    self.assertIn('themes', res.data)

  def test_unauthorized(self):
    res = self.api.get('/api/client/themes')
    self.assertEqual(res.status_code, 401)


# =====================
# 5. POST /api/client/coupon/purchase
# =====================
class ClientCouponPurchaseTest(BaseSetup):

  def setUp(self):
    super().setUp()
    self.url = '/api/client/coupon/purchase'

  @patch('apps.ehon.views_client.stripe')
  def test_ok(self, mock_stripe):
    mock_stripe.checkout.Session.create.return_value = MagicMock(url='https://checkout.stripe.com/test')
    self.api.force_login(self.user)
    res = self.api.post(self.url, {'theme_id': self.theme.id, 'count': 3}, format='json')
    self.assertEqual(res.status_code, 200)
    self.assertIn('ck_url', res.data)

  def test_unauthorized(self):
    res = self.api.post(self.url, {'theme_id': self.theme.id, 'count': 3}, format='json')
    self.assertEqual(res.status_code, 401)

  @patch('apps.ehon.views_client.stripe')
  def test_other_client_theme(self, _):
    User.objects.create_user(username='other@test.com', email='other@test.com', password='pass')
    other_client = Client.objects.create(name='他社', email='other@test.com')
    other_theme = Theme.objects.create(client=other_client, name='他社テーマ')
    self.api.force_login(self.user)
    res = self.api.post(self.url, {'theme_id': other_theme.id, 'count': 1}, format='json')
    self.assertEqual(res.status_code, 400)


# =====================
# 6. POST /api/coupon/check
# =====================
class CouponCheckTest(BaseSetup):

  def setUp(self):
    super().setUp()
    self.url = '/api/coupon/check'
    self.data = {'code': 'EHGTEST01', 'name': 'テスト太郎', 'email': 'user@test.com'}

  def test_ok(self):
    res = self.api.post(self.url, self.data, format='json')
    self.assertEqual(res.status_code, 200)
    self.assertIn('lk_token', res.data)

  def test_no_code(self):
    res = self.api.post(self.url, {**self.data, 'code': ''}, format='json')
    self.assertEqual(res.status_code, 400)

  def test_invalid_code(self):
    res = self.api.post(self.url, {**self.data, 'code': 'NOTEXIST'}, format='json')
    self.assertEqual(res.status_code, 400)

  def test_expired(self):
    self.coupon.valid_until = timezone.now() - timedelta(days=1)
    self.coupon.save()
    res = self.api.post(self.url, self.data, format='json')
    self.assertEqual(res.status_code, 410)

  def test_no_rest(self):
    self.coupon.rest_cnt = 0
    self.coupon.save()
    res = self.api.post(self.url, self.data, format='json')
    self.assertEqual(res.status_code, 409)

  def test_no_expiry(self):
    self.coupon.valid_until = None
    self.coupon.save()
    res = self.api.post(self.url, self.data, format='json')
    self.assertEqual(res.status_code, 200)


# =====================
# 7. POST /api/coupon/use
# =====================
class CouponUseTest(BaseSetup):

  def setUp(self):
    super().setUp()
    self.url = '/api/coupon/use'
    check_res = self.api.post('/api/coupon/check', {
      'code': 'EHGTEST01',
      'name': 'テスト太郎',
      'email': 'user@test.com',
    }, format='json')
    self.lk_token = check_res.data.get('lk_token')
    self.data = {
      'lk_token': self.lk_token,
      'face': self.face,
      'spreads': self.spreads,
    }

  @patch.dict(os.environ, {'FRONT_URL': 'http://localhost:3000'})
  @patch('apps.ehon.views_coupon.send_mail')
  def test_ok(self, mock_mail):
    res = self.api.post(self.url, self.data, format='json')
    self.assertEqual(res.status_code, 200)
    self.assertIn('dl_url', res.data)
    mock_mail.assert_called_once()

  def test_no_lk_token(self):
    res = self.api.post(self.url, {**self.data, 'lk_token': ''}, format='json')
    self.assertEqual(res.status_code, 400)

  def test_invalid_lk_token(self):
    res = self.api.post(self.url, {**self.data, 'lk_token': str(uuid.uuid4())}, format='json')
    self.assertEqual(res.status_code, 410)

  @patch.dict(os.environ, {'FRONT_URL': 'http://localhost:3000'})
  @patch('apps.ehon.views_coupon.send_mail')
  def test_lk_expired(self, _):
    LkCoupon.objects.filter(lk_token=self.lk_token).update(
      exp_at=timezone.now() - timedelta(hours=1)
    )
    res = self.api.post(self.url, self.data, format='json')
    self.assertEqual(res.status_code, 410)

  @patch.dict(os.environ, {'FRONT_URL': 'http://localhost:3000'})
  @patch('apps.ehon.views_coupon.send_mail')
  def test_no_face(self, mock_mail):
    # 顔なしテーマ（face=null）でのクーポン使用
    res = self.api.post(self.url, {**self.data, 'face': None}, format='json')
    self.assertEqual(res.status_code, 200)


# =====================
# 8. GET /api/client/subsc/plans
# =====================
class SubscPlanTest(TestCase):

  def setUp(self):
    self.api = APIClient()
    self.url = '/api/client/subsc/plans'
    self.subsc = Subsc.objects.create(name='スタンダード', price=3000, base_cnt=3, sp_price_id='price_test')

  def test_ok(self):
    res = self.api.get(self.url)
    self.assertEqual(res.status_code, 200)
    self.assertEqual(len(res.data), 1)

  def test_empty(self):
    Subsc.objects.all().delete()
    res = self.api.get(self.url)
    self.assertEqual(res.status_code, 200)
    self.assertEqual(len(res.data), 0)


# =====================
# 9. POST /api/client/subsc/signup
# =====================
class SubscSignupTest(BaseSetup):

  def setUp(self):
    super().setUp()
    self.url = '/api/client/subsc/signup'
    self.subsc = Subsc.objects.create(name='スタンダード', price=3000, base_cnt=3, sp_price_id='price_test')

  @patch('apps.ehon.views_client.stripe')
  def test_ok(self, mock_stripe):
    mock_stripe.checkout.Session.create.return_value = MagicMock(url='https://checkout.stripe.com/test')
    self.api.force_login(self.user)
    res = self.api.post(self.url, {'subsc_id': self.subsc.id}, format='json')
    self.assertEqual(res.status_code, 200)
    self.assertIn('ck_url', res.data)

  def test_unauthorized(self):
    res = self.api.post(self.url, {'subsc_id': self.subsc.id}, format='json')
    self.assertEqual(res.status_code, 401)

  def test_no_subsc_id(self):
    self.api.force_login(self.user)
    res = self.api.post(self.url, {}, format='json')
    self.assertEqual(res.status_code, 400)

  def test_invalid_subsc_id(self):
    self.api.force_login(self.user)
    res = self.api.post(self.url, {'subsc_id': 9999}, format='json')
    self.assertEqual(res.status_code, 400)

  @patch('apps.ehon.views_client.stripe')
  def test_already_active(self, _):
    ClientSubsc.objects.create(
      client=self.client_obj,
      subsc=self.subsc,
      sp_sub_id='sub_existing',
      status=ClientSubsc.SUBSC_ACTIVE,
    )
    self.api.force_login(self.user)
    res = self.api.post(self.url, {'subsc_id': self.subsc.id}, format='json')
    self.assertEqual(res.status_code, 400)


# =====================
# 10. POST /api/client/subsc/cancel
# =====================
class SubscCancelTest(BaseSetup):

  def setUp(self):
    super().setUp()
    self.url = '/api/client/subsc/cancel'
    self.subsc = Subsc.objects.create(name='スタンダード', price=3000, base_cnt=3, sp_price_id='price_test')
    self.c_subsc = ClientSubsc.objects.create(
      client=self.client_obj,
      subsc=self.subsc,
      sp_sub_id='sub_test123',
      status=ClientSubsc.SUBSC_ACTIVE,
    )

  @patch('apps.ehon.views_client.stripe')
  def test_ok(self, mock_stripe):
    mock_stripe.Subscription.modify.return_value = MagicMock()
    self.api.force_login(self.user)
    res = self.api.post(self.url)
    self.assertEqual(res.status_code, 200)

  def test_unauthorized(self):
    res = self.api.post(self.url)
    self.assertEqual(res.status_code, 401)

  def test_no_active_subsc(self):
    self.c_subsc.status = ClientSubsc.SUBSC_CANCEL
    self.c_subsc.save()
    self.api.force_login(self.user)
    res = self.api.post(self.url)
    self.assertEqual(res.status_code, 400)


# =====================
# 11. PUT /api/client/coupon_dist
# =====================
class CouponDistTest(BaseSetup):

  def setUp(self):
    super().setUp()
    self.url = '/api/client/coupon_dist'
    self.subsc = Subsc.objects.create(name='スタンダード', price=3000, base_cnt=3, sp_price_id='price_test')
    self.c_subsc = ClientSubsc.objects.create(
      client=self.client_obj,
      subsc=self.subsc,
      sp_sub_id='sub_test123',
      status=ClientSubsc.SUBSC_ACTIVE,
    )
    self.data = {'theme': self.theme.name, 'cnt': 2}

  def test_ok(self):
    self.api.force_login(self.user)
    res = self.api.put(self.url, self.data, format='json')
    self.assertEqual(res.status_code, 200)

  def test_unauthorized(self):
    res = self.api.put(self.url, self.data, format='json')
    self.assertEqual(res.status_code, 401)

  def test_no_active_subsc(self):
    self.c_subsc.status = ClientSubsc.SUBSC_CANCEL
    self.c_subsc.save()
    self.api.force_login(self.user)
    res = self.api.put(self.url, self.data, format='json')
    self.assertEqual(res.status_code, 400)

  def test_invalid_theme(self):
    self.api.force_login(self.user)
    res = self.api.put(self.url, {'theme': '存在しないテーマ', 'cnt': 2}, format='json')
    self.assertEqual(res.status_code, 400)

  def test_no_cnt(self):
    self.api.force_login(self.user)
    res = self.api.put(self.url, {'theme': self.theme.name}, format='json')
    self.assertEqual(res.status_code, 400)


# =====================
# 12. POST /api/generate
# =====================
class GenerateTest(TestCase):

  def setUp(self):
    self.api = APIClient()
    self.url = '/api/generate'
    self.client_obj = Client.objects.create(name='生成テスト社', email='gen@test.com', is_free=True)
    # 顔なしテーマ
    self.theme_no_face = Theme.objects.create(client=self.client_obj, name='顔なしテーマ', price_pdf=300)
    # 顔ありテーマ
    self.group = FaceGroupName.objects.create(name='テストグループ')
    self.theme_with_face = Theme.objects.create(client=self.client_obj, name='顔ありテーマ', price_pdf=300, face_group=self.group)
    hair  = FacePart.objects.create(part='hair',  img_path='hair.png')
    eye   = FacePart.objects.create(part='eye',   img_path='eye.png')
    nose  = FacePart.objects.create(part='nose',  img_path='nose.png')
    mouth = FacePart.objects.create(part='mouth', img_path='mouth.png')
    FaceGroup.objects.create(group=self.group, part=hair)
    FaceGroup.objects.create(group=self.group, part=eye)
    FaceGroup.objects.create(group=self.group, part=nose)
    FaceGroup.objects.create(group=self.group, part=mouth)
    self.answers = [{'sort': 1, 'text': 'テスト回答'}]
    self.mock_result = [{'sp_num': 0, 'text1': 'テスト絵本', 'text2': ''}]

  @patch('apps.ehon.views.generate_story')
  def test_ok_with_face(self, mock_gen):
    mock_gen.return_value = self.mock_result
    res = self.api.post(self.url, {'theme': '顔ありテーマ', 'answers': self.answers}, format='json')
    self.assertEqual(res.status_code, 200)
    self.assertNotEqual(res.data.get('face_parts'), {})

  @patch('apps.ehon.views.generate_story')
  def test_ok_no_face(self, mock_gen):
    mock_gen.return_value = self.mock_result
    res = self.api.post(self.url, {'theme': '顔なしテーマ', 'answers': self.answers}, format='json')
    self.assertEqual(res.status_code, 200)
    self.assertEqual(res.data.get('face_parts'), {})

  @patch('apps.ehon.views.generate_story')
  def test_no_theme(self, mock_gen):
    mock_gen.return_value = self.mock_result
    res = self.api.post(self.url, {'theme': '存在しないテーマ', 'answers': self.answers}, format='json')
    self.assertEqual(res.status_code, 400)

  @patch('apps.ehon.views.generate_story')
  def test_no_answers(self, mock_gen):
    mock_gen.return_value = self.mock_result
    res = self.api.post(self.url, {'theme': '顔なしテーマ'}, format='json')
    self.assertEqual(res.status_code, 400)


# =====================
# 13. POST /api/payment/callback（絵本購入）
# =====================
class CallbackTest(TestCase):

  def setUp(self):
    self.api = APIClient()
    self.url = '/api/payment/callback'
    self.client_obj = Client.objects.create(name='決済テスト社', email='cb@test.com', is_free=True)
    # 顔なしテーマ
    self.theme_no_face = Theme.objects.create(client=self.client_obj, name='決済顔なし', price_pdf=300)
    # 顔ありテーマ
    self.group = FaceGroupName.objects.create(name='決済グループ')
    self.theme_with_face = Theme.objects.create(client=self.client_obj, name='決済顔あり', price_pdf=300, face_group=self.group)
    self.hair  = FacePart.objects.create(part='hair',  img_path='cb_hair.png')
    self.eye   = FacePart.objects.create(part='eye',   img_path='cb_eye.png')
    self.nose  = FacePart.objects.create(part='nose',  img_path='cb_nose.png')
    self.mouth = FacePart.objects.create(part='mouth', img_path='cb_mouth.png')
    Colors.objects.create(part='hair', label='黒',   color='#000000')
    Colors.objects.create(part='skin', label='普通', color='#FFD5B4')
    FaceGroup.objects.create(group=self.group, part=self.hair)
    FaceGroup.objects.create(group=self.group, part=self.eye)
    FaceGroup.objects.create(group=self.group, part=self.nose)
    FaceGroup.objects.create(group=self.group, part=self.mouth)
    self.buyer = {'name': 'テスト太郎', 'email': 'buyer@test.com', 'phone': '', 'post': '', 'address': '', 'mail_ok': False}
    self.spreads = [{'sp_num': 0, 'text1': 'テスト絵本', 'text2': '', 'img': None}]

  def _make_event(self, token):
    return {
      'type': 'checkout.session.completed',
      'data': {'object': {
        'id': 'pi_test123',
        'metadata': {'type': 'book', 'token': str(token)},
      }}
    }

  @patch.dict(os.environ, {'FRONT_URL': 'http://localhost'})
  @patch('apps.ehon.views.send_mail')
  @patch('apps.ehon.views.stripe')
  def test_book_with_face(self, mock_stripe, mock_mail):
    mock_stripe.error.SignatureVerificationError = stripe_mod.error.SignatureVerificationError
    pending = PendingBook.objects.create(data={
      'type': 'pdf', 'theme_id': self.theme_with_face.id, 'title': 'テスト絵本', 'price': 300,
      'buyer': self.buyer,
      'face': {'hair': self.hair.id, 'eye': self.eye.id, 'nose': self.nose.id, 'mouth': self.mouth.id, 'hairColor': '#000000', 'skinColor': '#FFD5B4'},
      'log_id': None, 'spreads': self.spreads,
    })
    mock_stripe.Webhook.construct_event.return_value = self._make_event(pending.token)
    res = self.api.post(self.url, data='{}', content_type='application/json', HTTP_STRIPE_SIGNATURE='sig')
    self.assertEqual(res.status_code, 200)
    self.assertTrue(Book.objects.filter(title='テスト絵本', hair=self.hair).exists())

  @patch.dict(os.environ, {'FRONT_URL': 'http://localhost'})
  @patch('apps.ehon.views.send_mail')
  @patch('apps.ehon.views.stripe')
  def test_book_no_face(self, mock_stripe, mock_mail):
    mock_stripe.error.SignatureVerificationError = stripe_mod.error.SignatureVerificationError
    pending = PendingBook.objects.create(data={
      'type': 'pdf', 'theme_id': self.theme_no_face.id, 'title': 'テスト絵本顔なし', 'price': 300,
      'buyer': self.buyer,
      'face': None,
      'log_id': None, 'spreads': self.spreads,
    })
    mock_stripe.Webhook.construct_event.return_value = self._make_event(pending.token)
    res = self.api.post(self.url, data='{}', content_type='application/json', HTTP_STRIPE_SIGNATURE='sig')
    self.assertEqual(res.status_code, 200)
    self.assertTrue(Book.objects.filter(title='テスト絵本顔なし', hair__isnull=True).exists())
