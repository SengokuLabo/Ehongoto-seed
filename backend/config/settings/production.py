from .base import *

DEBUG = False

# HTTPS強制（Nginxがプロキシ経由でHTTPSを終端するため、ヘッダーで判定）
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# 許可するオリジン（えほんごとのたね本番ドメインのみ）
CORS_ALLOWED_ORIGINS = [
    'https://ehongoto-seed.com',
    'https://www.ehongoto-seed.com',
]

SILENCED_SYSTEM_CHECKS = [
  'security.W002',  # iframe埋め込み対応のため
  'security.W003',  # REST API（DRF）のためCSRF middleware不要
  'security.W021',  # α版リリース後に対応
]
