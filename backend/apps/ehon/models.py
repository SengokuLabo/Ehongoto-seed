from django.db import models
from django.contrib.auth.models import User
import uuid

# 詳細は docs/db-design.md 参照

# 定数
SYSTEM_PROMPT = """
あなたは「子どもも読める大人向け絵本」のライターです
以下のルールを必ず守ってください

【出力形式】
JSON形式のみで返答する
{"spreads": [{"sp_num": 1, "text1": "...", "text2": "..."}, ...]}
見開きに対して2文セット

【共通ルール】
- ページ数：表紙+本文+背表紙の構成
- JSON形式：見開き(sp_num)は、2ページをまとめる
- 表紙（sp_num 0）：タイトル、15文字程度に簡潔にまとめる
- 本文（sp_num 1~*）：1ページ20字程度の一言にまとめる
- 背表紙（sp_num *+1）：「おわり」のみをセット
- 漢字・大人向けの表現を使ってよい、ただし難解すぎる表現は避ける
- 起承転結の構成で、話の辻褄が合うこと
- 全回答を使う必要はないが、各ページの繋がりは大切
- 回答が空の場合は、その項目を無視して作成すること
- 句読点（、。）は使用せずに半角スペースを使う

【テーマ毎のルール】
- 8見開き(表紙、裏表紙は別）
- text2は空文字 ※JSON形式は統一

[タイトルの例]
- ものづくりの少年から親へ
- 愛情のバトンタッチ

[本文の例]
- ぼくは ものを作るのが好きだった（16文字）
- うまくいかない日も 考え続けた（15文字）
"""

# 購入者情報
class Buyer(models.Model):
  # name / email / post / ship_addr / mail_ok
  name = models.CharField(max_length=100)
  email = models.EmailField(unique=True)
  phone = models.CharField(max_length=50, blank=True, default='')
  post = models.CharField(max_length=10, blank=True, default='')
  address = models.TextField()
  mail_ok = models.BooleanField(default=False)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  def __str__(self):
    return f'{self.name} ({self.email})'
  class Meta:
    verbose_name_plural = '01 buyers'

# クライアント情報
class Client(models.Model):
  user = models.OneToOneField(User, on_delete=models.CASCADE, blank=True, null=True)
  name = models.CharField(max_length=100)
  email = models.EmailField(unique=True)
  label = models.CharField(max_length=50, blank=True, default='')
  desc = models.TextField(blank=True, default='')
  chk_token = models.UUIDField(default=uuid.uuid4, unique=True)
  chk_exp = models.DateTimeField(blank=True, null=True)
  logo = models.CharField(max_length=255, blank=True, default='')
  is_free = models.BooleanField(default=False)
  is_active = models.BooleanField(default=True)
  created_at = models.DateTimeField(auto_now_add=True)
  def __str__(self):
    return f'{self.name} {self.email}'
  class Meta:
    verbose_name_plural = '02 clients'

# 顔パーツマスタ
class FacePart(models.Model):
  # part(enum) / img_path / sort
  PART_HAIR = 'hair'
  PART_EYE = 'eye'
  PART_NOSE = 'nose'
  PART_MOUTH = 'mouth'
  PART = [
    (PART_HAIR, '髪'),
    (PART_EYE, '目'),
    (PART_NOSE, '鼻'),
    (PART_MOUTH, '口'),
  ]
  part = models.CharField(max_length=10, choices=PART, default=PART_HAIR)
  img_path = models.CharField(max_length=255, blank=True)
  eye_turn = models.BooleanField(default=True)
  def __str__(self):
      return f'{self.part} {self.img_path}'
  class Meta:
    verbose_name_plural = '20 face parts'

# 顔パーツグループ名
class FaceGroupName(models.Model):
  name = models.CharField(max_length=20)
  def __str__(self):
      return self.name
  class Meta:
    verbose_name_plural = '21 face group name'

# 顔パーツグループ紐付け
class FaceGroup(models.Model):
  group = models.ForeignKey(FaceGroupName, on_delete=models.CASCADE)
  part = models.ForeignKey(FacePart, on_delete=models.PROTECT)
  class Meta:
    verbose_name_plural = '22 face group'
    unique_together = ('group', 'part')

# 色マスタ
class Colors(models.Model):
  COLOR_HAIR = 'hair'
  COLOR_SKIN = 'skin'
  PART = [
    (COLOR_HAIR, '髪色'),
    (COLOR_SKIN, '肌色'),
  ]
  part = models.CharField(max_length=10, choices=PART, default=COLOR_HAIR)
  label = models.CharField(max_length=20)
  color = models.CharField(max_length=10)
  class Meta:
    verbose_name_plural = '23 colors'

# テーママスタ
class Theme(models.Model):
  client = models.ForeignKey(Client, on_delete=models.PROTECT)
  name = models.CharField(max_length=50)
  year = models.SmallIntegerField(blank=True, null=True)
  label = models.CharField(max_length=50, blank=True, default='')
  icon = models.CharField(max_length=255, blank=True, null=True)
  desc = models.TextField(blank=True, default='')
  prompt = models.TextField(default=SYSTEM_PROMPT)
  price_pdf = models.IntegerField(default=500)
  price_soft = models.IntegerField(default=3500)
  price_hard = models.IntegerField(default=8000)
  face_group = models.ForeignKey(FaceGroupName, on_delete=models.PROTECT, blank=True, null=True)
  title_style = models.JSONField(blank=True, null=True)
  is_active = models.BooleanField(default=True)
  created_at = models.DateTimeField(auto_now_add=True)
  def __str__(self):
    base = f'{self.client.name} {self.name}'
    return f'{base} ({self.year})' if self.year else base
  class Meta:
    verbose_name_plural = '10 themes'

# 質問マスタ
class Question(models.Model):
  theme = models.ForeignKey(Theme, on_delete=models.CASCADE)
  sort = models.SmallIntegerField()
  chapter = models.CharField(max_length=50, blank=True, null=True)
  text = models.CharField(max_length=255)
  class Meta:
    verbose_name_plural = '11 questions'

# スタイルマスタ
class Style(models.Model):
  theme = models.ForeignKey(Theme, on_delete=models.CASCADE)
  key = models.CharField(max_length=20)
  label = models.CharField(max_length=50)
  options = models.JSONField()
  class Meta:
    verbose_name_plural = '12 style'

# イラストマスタ
class Image(models.Model):
  img_path = models.CharField(max_length=255)
  angle = models.SmallIntegerField(default=0)
  size = models.SmallIntegerField(default=0)
  ox = models.SmallIntegerField(default=0)
  tilt = models.SmallIntegerField(default=0)
  orig_name = models.CharField(max_length=255, blank=True, null=True)
  client = models.ForeignKey(Client, on_delete=models.PROTECT, blank=True, null=True)
  def __str__(self):
    return f'{self.client} {self.img_path}'
  class Meta:
    verbose_name_plural = '13 images'

# テーマイラスト
class ThemeImg(models.Model):
  theme = models.ForeignKey(Theme, on_delete=models.CASCADE)
  img = models.ForeignKey(Image, on_delete=models.PROTECT)
  class Meta:
    verbose_name_plural = '14 theme img'
    unique_together = ('theme', 'img')

# 絵本情報
class Book(models.Model):
  TYPE_PDF = 'pdf'
  TYPE_SOFT = 'soft'
  TYPE_HARD = 'hard'
  BOOK_TYPE = [
    (TYPE_PDF, 'PDF'),
    (TYPE_SOFT, '小冊子'),
    (TYPE_HARD, 'ハードカバー'),
  ]
  STATUS_STRIPE = 'stripe'
  STATUS_PAYPAY = 'paypay'
  STATUS_COUPON = 'coupon'
  BOOK_STATUS = [
    (STATUS_STRIPE, 'Stripe購入'),
    (STATUS_PAYPAY, 'PayPay購入'),
    (STATUS_COUPON, 'クーポン使用'),
  ]
  token = models.UUIDField(default=uuid.uuid4, unique=True)
  buyer = models.ForeignKey(Buyer, on_delete=models.PROTECT)
  theme = models.ForeignKey(Theme, on_delete=models.PROTECT)
  title = models.CharField(max_length=100)
  book_type = models.CharField(max_length=10, choices=BOOK_TYPE, default=TYPE_PDF)
  status = models.CharField(max_length=10, choices=BOOK_STATUS, default=STATUS_STRIPE)
  price = models.IntegerField(default=0)
  sp_pay_id = models.CharField(max_length=255, blank=True, default='')
  pdf_key = models.CharField(max_length=255, blank=True, default='')
  pdf_exp = models.DateTimeField()
  hair = models.ForeignKey(FacePart, on_delete=models.PROTECT, related_name='+', blank=True, null=True)
  eye = models.ForeignKey(FacePart, on_delete=models.PROTECT, related_name='+', blank=True, null=True)
  nose = models.ForeignKey(FacePart, on_delete=models.PROTECT, related_name='+', blank=True, null=True)
  mouth = models.ForeignKey(FacePart, on_delete=models.PROTECT, related_name='+', blank=True, null=True)
  hair_color = models.ForeignKey(Colors, on_delete=models.PROTECT, related_name='+', blank=True, null=True)
  skin_color = models.ForeignKey(Colors, on_delete=models.PROTECT, related_name='+', blank=True, null=True)

  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  def __str__(self):
    return f'{self.title} ({self.buyer.name})'
  class Meta:
    verbose_name_plural = '30 books'

# 絵本ページ詳細
class BookPage(models.Model):
  book = models.ForeignKey(Book, on_delete=models.CASCADE)
  spread = models.SmallIntegerField(default=0)
  text1 = models.TextField()
  text2 = models.TextField()
  img = models.ForeignKey(Image, on_delete=models.SET_NULL, blank=True, null=True)
  def __str__(self):
    return f'{self.book.title} {self.spread} {self.text1}'
  class Meta:
    verbose_name_plural = '31 book pages'

# クーポン
class Coupon(models.Model):
  theme = models.ForeignKey(Theme, on_delete=models.CASCADE)
  code = models.CharField(max_length=10, unique=True)
  max_uses = models.IntegerField(default=1)
  rest_cnt = models.IntegerField(default=1)
  valid_until = models.DateTimeField(blank=True, null=True)
  sp_pay_id = models.CharField(max_length=255, blank=True, default='')
  created_at = models.DateTimeField(auto_now_add=True)
  class Meta:
    verbose_name_plural = '40 coupons'

# クーポン排他
class LkCoupon(models.Model):
  coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE)
  lk_token = models.UUIDField(default=uuid.uuid4, unique=True)
  session = models.CharField(max_length=40)
  name = models.CharField(max_length=100)
  email = models.EmailField()
  exp_at = models.DateTimeField()
  class Meta:
    verbose_name_plural = '41 coupons lock'

# サブスクマスタ
class Subsc(models.Model):
  name = models.CharField(max_length=20)
  sp_price_id = models.CharField(max_length=100)
  price = models.SmallIntegerField(default=3000)
  base_cnt = models.SmallIntegerField(default=3)
  add_cnt = models.SmallIntegerField(default=3)
  add_price = models.SmallIntegerField(default=500)
  def __str__(self):
    return self.name
  class Meta:
    verbose_name_plural = '50 subsc'

# クライアント契約情報
class ClientSubsc(models.Model):
  SUBSC_ACTIVE = 'active'
  SUBSC_CANCEL = 'canceled'
  SUBSC_PASTDUE = 'past_due'
  SUBSC_TYPE = [
    (SUBSC_ACTIVE, 'アクティブ'),
    (SUBSC_CANCEL, 'キャンセル'),
    (SUBSC_PASTDUE, '有効期限切れ'),
  ]
  client = models.ForeignKey(Client, on_delete=models.PROTECT)
  subsc = models.ForeignKey(Subsc, on_delete=models.PROTECT)
  sp_sub_id = models.CharField(max_length=100)
  sp_cust_id = models.CharField(max_length=100, blank=True, default='')
  status = models.CharField(max_length=15, choices=SUBSC_TYPE, default=SUBSC_ACTIVE)
  start_at = models.DateTimeField(auto_now_add=True)
  end_at = models.DateTimeField(blank=True, null=True)
  class Meta:
    verbose_name_plural = '51 client subsc'

# クーポン配分
class CouponDist(models.Model):
  client_subsc = models.ForeignKey(ClientSubsc, on_delete=models.CASCADE)
  theme = models.ForeignKey(Theme, on_delete=models.PROTECT)
  coupon_cnt = models.SmallIntegerField(default=3)
  class Meta:
    verbose_name_plural = '52 coupon dist'
    unique_together = ('client_subsc', 'theme')

# 回答ログ
class AnswerLog(models.Model):
  book = models.ForeignKey(Book, on_delete=models.SET_NULL, blank=True, null=True)
  theme = models.ForeignKey(Theme, on_delete=models.SET_NULL, blank=True, null=True)
  data = models.JSONField(blank=True, null=True)
  sel_at = models.DateTimeField(blank=True, null=True)
  prev_at = models.DateTimeField(blank=True, null=True)
  created_at = models.DateTimeField(auto_now_add=True)
  class Meta:
    verbose_name_plural = '90 answers'

# 決済前情報 ※一時保管用
class PendingBook(models.Model):
  token = models.UUIDField(default=uuid.uuid4, unique=True)
  data = models.JSONField(blank=True, null=True)
  created_at = models.DateTimeField(auto_now_add=True)
  class Meta:
    verbose_name_plural = '99 pending books'
