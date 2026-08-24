import anthropic, json

MAX_LEN = 35
RE_PROMPT = '''
以下の絵本テキストをそれぞれ30文字以内に短縮してください

【ルール】
- 短縮対象は、JSONのtext1, text2の35文字を超過している箇所
- 物語の中身は大きく変えない
- 句読点（、。）は使用せず半角スペースを使う
- 30文字以内（スペース含む）
- 意味が変わる省略、誤字・脱字は禁止
- JSON形式は絶対に変更しない
  {"spreads": [{"sp_num": 1, "text1": "..."}, ...]}
'''

# Claudeにて物語作成
def generate_story(theme_obj, answers, styles):
  # テーマセット
  user_msg = f'テーマ: {theme_obj.name}\n回答:\n'
  # 質問回答セット
  user_msg += '\n'.join([f'{k}: {v}' for k, v in answers.items()])
  # スタイルセット
  style_msg = ''
  if styles:
    style_msg += '\n\nスタイル設定:\n'
    style_msg += '\n'.join([f'{k}: {v}' for k, v in styles.items()])
  user_msg += style_msg

  # リトライ1回
  spreads = []
  client = anthropic.Anthropic()
  for _ in range(2):
    # 文章生成AI
    try:
      response = client.messages.create(
        model='claude-haiku-4-5',
        max_tokens=2500,
        system=theme_obj.prompt,
        messages=[{'role': 'user', 'content': user_msg}]
      )
      text = response.content[0].text.strip()
      if text.startswith('```'):
        text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()
      result = json.loads(text)
      spreads = result.get('spreads', [])
      break
    except Exception as e:
      print(f'AI generation error: {e}')

  # 文字数チェック
  ck_len = False
  for s in spreads:
    if len(s.get('text1', '')) > MAX_LEN or len(s.get('text2', '')) > MAX_LEN:
      ck_len = True
      break

  if not ck_len:
    return spreads

  # 文字数添削AI
  try:
    response = client.messages.create(
      model='claude-haiku-4-5',
      max_tokens=2500,
      system=RE_PROMPT + style_msg,
      messages=[{'role': 'user', 'content': json.dumps({'spreads': spreads}, ensure_ascii=False)}]
    )
    text = response.content[0].text.strip()
    if text.startswith('```'):
      text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()
    result = json.loads(text)
    spreads = result.get('spreads', [])
  except Exception as e:
    return spreads

  return spreads
