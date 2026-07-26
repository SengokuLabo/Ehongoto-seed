from .base import *

DEBUG = False

# HTTPS強制
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# 許可するオリジン（wixとえほんごとのたね本番ドメインのみ）
CORS_ALLOWED_ORIGINS = [
    'https://maker.ehongoto.jp',
    'https://www.ehongoto.jp',
]

SILENCED_SYSTEM_CHECKS = [
  'security.W002',  # iframe埋め込み対応のため
  'security.W003',  # REST API（DRF）のためCSRF middleware不要
  'security.W021',  # α版リリース後に対応
]
