import os, boto3

# メール送信
def send_mail(to, subject, body_text, body_html, service_name, reply_to, logo_path=None):
  ses = boto3.client(
    'ses',
    region_name=os.environ.get('AWS_SES_REGION', 'ap-northeast-1'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
  )
  if body_html:
    ses.send_email(
      Source=f'{service_name} <{os.environ.get("ADMIN_EMAIL")}>',
      ReplyToAddresses=[reply_to],
      Destination={'ToAddresses': [to]},
      Message={
        'Subject': {'Data': subject, 'Charset': 'UTF-8'},
        'Body': {
          'Text': {'Data': body_text, 'Charset': 'UTF-8'},
          'Html': {'Data': body_html, 'Charset': 'UTF-8'},
        }
      }
    )
  else:
    ses.send_email(
      Source=f'{service_name} <{os.environ.get("ADMIN_EMAIL")}>',
      ReplyToAddresses=[reply_to],
      Destination={'ToAddresses': [to]},
      Message={
        'Subject': {'Data': subject, 'Charset': 'UTF-8'},
        'Body': {
          'Text': {'Data': body_text, 'Charset': 'UTF-8'},
        }
      }
    )
