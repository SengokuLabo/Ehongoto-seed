import anthropic, json

# Claudeにて物語作成
def generate_story(theme_obj, answers, styles):
  # テーマセット
  user_msg = f'テーマ: {theme_obj.name}\n回答:\n'
  # 質問回答セット
  user_msg += '\n'.join([f'{k}: {v}' for k, v in answers.items()])
  # スタイルセット
  if styles:
    user_msg += '\n\nスタイル設定:\n'
    user_msg += '\n'.join([f'{k}: {v}' for k, v in styles.items()])

  # リトライ1回
  for _ in range(2):
    try:
      client = anthropic.Anthropic()
      response = client.messages.create(
        model='claude-haiku-4-5',
        max_tokens=2500,
        system=theme_obj.prompt,
        messages=[{'role': 'user', 'content': user_msg}]
      )
      text = response.content[0].text.strip()
      if text.startswith('```'):
        text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()
      return json.loads(text)
    except Exception as e:
      print(f'AI generation error: {e}')
      continue
  return None
