import os
from django.conf import settings

ALLOWED = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp']

# 画像保存ユーティリティ
def img_upload(file, dir, name):
  # 1. 拡張子チェック
  ext = os.path.splitext(file.name)[1].lower()
  if ext not in ALLOWED:
    raise ValueError('invalid file type')

  # 2. 画像を保存
  save_dir = os.path.join(settings.MEDIA_ROOT, dir)
  os.makedirs(save_dir, exist_ok=True)

  save_path = os.path.join(save_dir, name + ext)

  with open(save_path, 'wb') as f:
    for chunk in file.chunks():
      f.write(chunk)

  # 3. 保存ファイル名を返す
  return name + ext
