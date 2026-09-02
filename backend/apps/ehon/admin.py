from django.contrib import admin
from . import models

# インライン【テーマ】
class ThemeInline(admin.TabularInline):
  model = models.Theme
  extra = 0
  fields = (
    'name',
    'year',
    'price_pdf',
    'price_soft',
    'price_hard',
    'prompt',
  )
  readonly_fields = (
    'name',
    'year',
  )
  show_change_link = True

# インライン【質問】
class QuestionInline(admin.TabularInline):
  model = models.Question
  extra = 0
  fields = (
    'sort',
    'chapter',
    'text',
  )
  show_change_link = True

# インライン【スタイル】
class StyleInline(admin.TabularInline):
  model = models.Style
  extra = 0
  fields = (
    'key',
    'label',
    'options',
  )
  show_change_link = True

# インライン【絵本ページ】
class BookPageInline(admin.TabularInline):
  model = models.BookPage
  extra = 0
  fields = ('spread', 'text1', 'text2', 'img')
  readonly_fields = ('spread', 'text1', 'text2', 'img')
  show_change_link = True

# インライン【クーポン排他】
class LkCouponInline(admin.TabularInline):
  model = models.LkCoupon
  extra = 0
  fields = ('name', 'email', 'exp_at', )
  readonly_fields = ('name', 'email', 'exp_at', )
  show_change_link = True

# インライン【顔パーツグループ】
class FaceGroupInline(admin.TabularInline):
  model = models.FaceGroup
  extra = 0
  fields = ('part', )
  show_change_link = True

# インライン【テーマイラスト】
class ThemeImgInline(admin.TabularInline):
  model = models.ThemeImg
  extra = 0
  fields = ('img', )
  show_change_link = True

# インライン【クライアントサブスク】
class CouponDistInline(admin.TabularInline):
  model = models.CouponDist
  extra = 0
  fields = ('theme', 'coupon_cnt',)
  show_change_link = True

# クライアント
@admin.register(models.Client)
class ClientAdmin(admin.ModelAdmin):
  list_display = (
    'id',
    'name',
    'email',
    'is_free',
    'is_active',
  )
  list_filter = (
    'name',
    'email',
  )
  readonly_fields = (
    'chk_token',
    'chk_exp',
  )
  ordering = ('id',)
  list_per_page = 30
  inlines = [ThemeInline]

# テーマ
@admin.register(models.Theme)
class ThemeAdmin(admin.ModelAdmin):
  list_display = (
    'client_name',
    'name',
    'label',
    'price_pdf',
    'price_soft',
    'price_hard',
    'q_count',
    'face_group',
    'is_active',
  )
  list_filter = (
    'client',
    'name',
  )
  ordering = ('client', 'name')
  list_per_page = 30
  def client_name(self, obj):
    return obj.client.name if obj.client else ''
  client_name.short_description = 'クライアント'
  def q_count(self, obj):
    return obj.question_set.count()
  inlines = [QuestionInline, StyleInline, ThemeImgInline]

# 質問
@admin.register(models.Question)
class QuestionAdmin(admin.ModelAdmin):
  list_display = (
    'theme_name',
    'sort',
    'chapter',
    'text',
  )
  list_filter = (
    'theme__client',
    'theme',
  )
  ordering = ('theme__client', 'theme', 'sort')
  list_per_page = 30
  def theme_name(self, obj):
    return f"{obj.theme.client.name} {obj.theme.name}" if obj.theme else ''
  theme_name.short_description = 'テーマ'

# スタイル
@admin.register(models.Style)
class StyleAdmin(admin.ModelAdmin):
  list_display = (
    'theme_name',
    'key',
    'label',
    'options',
  )
  list_filter = (
    'theme',
  )
  ordering = ('theme', 'id')
  list_per_page = 30
  def theme_name(self, obj):
    return f"{obj.theme.client.name} {obj.theme.name}" if obj.theme else ''
  theme_name.short_description = 'テーマ'

# 顔パーツ
@admin.register(models.FacePart)
class FacePartAdmin(admin.ModelAdmin):
  list_display = (
    'part',
    'img_path',
    'eye_turn',
  )
  list_filter = (
    'part',
  )
  ordering = ('part', 'img_path')
  list_per_page = 30

# 色マスタ
@admin.register(models.Colors)
class ColorsAdmin(admin.ModelAdmin):
  list_display = [
    'part',
    'label',
    'color',
  ]
  list_filter = (
    'part',
  )
  ordering = ('part', 'color')
  list_per_page = 30

# イラスト
@admin.register(models.Image)
class ImageAdmin(admin.ModelAdmin):
  list_display = (
    'client_name',
    'img_path',
    'orig_name',
    'angle',
    'size',
    'ox',
    'tilt',
  )
  list_filter = ('client', )
  list_per_page = 30
  ordering = ('client', 'img_path')
  def client_name(self, obj):
    return obj.client.name if obj.client else ''
  client_name.short_description = '登録クライアント'

# 購入者
@admin.register(models.Buyer)
class BuyerAdmin(admin.ModelAdmin):
  list_display = (
    'id',
    'name',
    'mail_ok',
    'email',
    'phone',
    'post',
    'address',
  )
  list_filter = ('mail_ok',)
  ordering = ('id',)
  list_per_page = 30

# 絵本
@admin.register(models.Book)
class BookAdmin(admin.ModelAdmin):
  list_display = (
    'theme_name',
    'buyer_name',
    'title',
    'book_type',
    'status',
    'price',
    'pdf_exp',
  )
  list_filter = (
    'theme',
    'buyer',
    'book_type',
    'status',
  )
  ordering = ('-created_at', )
  list_per_page = 30
  def theme_name(self, obj):
    return f"{obj.theme.client.name} {obj.theme.name}" if obj.theme else ''
  theme_name.short_description='テーマ'
  def buyer_name(self, obj):
    return obj.buyer.name if obj.buyer else ''
  buyer_name.short_description='購入者'
  inlines = [BookPageInline]

# 絵本ページ
@admin.register(models.BookPage)
class BookPageAdmin(admin.ModelAdmin):
  list_display = (
    'book_name',
    'spread',
    'text1',
    'text2',
    'img',
  )
  list_filter = ('book',)
  ordering = ('book', 'spread')
  list_per_page = 30
  def book_name(self, obj):
    return obj.book.title if obj.book else ''
  book_name.short_description = '絵本'

# 回答ログ
@admin.register(models.AnswerLog)
class AnswerLogAdmin(admin.ModelAdmin):
  list_display = (
    'created_at',
    'theme',
    'book',
    'data',
  )
  ordering = ('-created_at',)
  list_per_page = 30

# 仮登録
@admin.register(models.PendingBook)
class PendingBookAdmin(admin.ModelAdmin):
  list_display = (
    'data',
    'created_at',
  )
  ordering = ('-created_at',)
  list_per_page = 30

# クーポン
@admin.register(models.Coupon)
class CouponAdmin(admin.ModelAdmin):
  list_display = (
    'theme_name',
    'code',
    'max_uses',
    'rest_cnt',
    'valid_until',
    'created_at',
  )
  list_filter = ('theme__client', 'theme')
  ordering = ('-created_at', 'theme',)
  list_per_page = 30
  def theme_name(self, obj):
    return f"{obj.theme.client.name} {obj.theme.name}" if obj.theme else ''
  theme_name.short_description = 'テーマ'
  inlines = [LkCouponInline]

# 顔パーツグループ名
@admin.register(models.FaceGroupName)
class FaceGroupNameAdmin(admin.ModelAdmin):
  list_display = ('name', )
  list_per_page = 30
  inlines = [FaceGroupInline]

# サブスクマスタ
@admin.register(models.Subsc)
class SubscAdmin(admin.ModelAdmin):
  list_display = (
    'name',
    'price',
    'base_cnt',
    'add_cnt',
    'add_price',
  )
  ordering = ('price', )
  list_per_page = 30

# クライアント登録情報
@admin.register(models.ClientSubsc)
class ClientSubscAdmin(admin.ModelAdmin):
  list_display = (
    'client_name',
    'subsc',
    'status',
    'start_at',
    'end_at',
  )
  list_filter = ('status',)
  ordering = ('status', 'start_at', )
  def client_name(self, obj):
    return obj.client.name if obj.client else ''
  client_name.short_description = 'クライアント'
  inlines = [CouponDistInline]
