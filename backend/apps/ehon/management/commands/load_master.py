from django.core.management.base import BaseCommand
from apps.ehon.models import Client, Theme, Style

# 定数
SYSTEM_PROMPT = """
あなたは「子どもも読める大人向け絵本」のライターです。
以下のルールを必ず守ってください。

【出力形式】
JSON形式のみで返答する
{"pages": [{"page_num": 1, "text": "..."}, ...]}

【文章ルール】
- ページ数：表紙1ページ+本文6ページ、合計8ページ固定
- 本文（page_num 2〜7）：1ページあたり30字以内、最大40字
- 表紙（page_num 1）：タイトル兼キャッチコピー1文
- 背表紙（page_num 8）：「おわり」のみをセット
- 漢字・大人向けの表現を使ってよい、ただし難解すぎる表現は避ける
- 起承転結の構成で、話の辻褄が合うこと
- タイトルは回答内容に合った自然なものを20字以内
"""

# バッチ
# docker compose exec backend python manage.py load_master

# 新規クライアント登録バッチ
class Command(BaseCommand):
  def handle(self, *args, **options):
    # クライアント登録
    client_obj, _ = Client.objects.get_or_create(
      email='ehongoto@gmail.com',
      defaults={
        'name': 'えほんごとのたね',
        'is_active': True
        }
    )

    # テーマ登録
    theme_obj, _ = Theme.objects.get_or_create(
      name='theme_name',
      defaults={
        'client': client_obj,
        'prompt': SYSTEM_PROMPT,
        'price_pdf': 300,
        'price_print': 3000,
      }
    )

    # スタイル登録
    op = ["やさしい絵本風(静かであたたかい)", "希望に向かうストーリー(前向き)", "リアルで力強い(等身大)", "詩的で余白のある(言葉少なめ)", "こども向けにやわらかく"]
    Style.objects.get_or_create(
      theme=theme_obj,
      key='tone',
      defaults={
        'label': 'トーン',
        'options': op,
      }
    )
    op = ["わたし", "ぼく", "あの人(第三者視点)"]
    Style.objects.get_or_create(
      theme=theme_obj,
      key='view',
      defaults={
        'label': '主人公視点',
        'options': op,
      }
    )
    op = ["こども向け", "大人向け", "両方"]
    Style.objects.get_or_create(
      theme=theme_obj,
      key='target',
      defaults={
        'label': '読者ターゲット',
        'options': op,
      }
    )
    op = ["背中を押す", "そっと寄り添う", "問いを残す"]
    Style.objects.get_or_create(
      theme=theme_obj,
      key='ending',
      defaults={
        'label': 'ラスト余韻',
        'options': op,
      }
    )



# DB初期化コマンド
# docker compose exec backend python manage.py shell -c "
# from django.db import connection
# tables = ['ehon_answer','ehon_bookpage','ehon_book','ehon_pendingbook','ehon_image','ehon_facepart','ehon_question','ehon_theme','ehon_client','ehon_buyer']
# with connection.cursor() as c:
#     c.execute(\"DELETE FROM django_migrations WHERE app='ehon'\")
#     for t in tables:
#         c.execute(f'DROP TABLE IF EXISTS {t} CASCADE')
# print('done')
# "
