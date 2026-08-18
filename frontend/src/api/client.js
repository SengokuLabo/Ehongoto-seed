// APIクライアント（全エンドポイント）
const BASE_URL = import.meta.env.VITE_API_BASE_URL

// 接続関数
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json()
    throw {status: res.status, ...body}
  }
  return res.json()
}

// ***** エンドユーザー向け *****
// 1. GET /api/themes テーマ一覧取得
export const themes = (client) =>
  request(`/themes?client=${client}`)

// 2. GET /api/questions 質問一覧取得
export const getQuestions = (client, theme, year) => {
  const params = new URLSearchParams({client, theme,})
  if (year) params.append('year', year)
  return request(`/questions?${params}`)
}

// 3. POST /api/generate 物語作成 + 物語パーツ取得
export const generate = (body) =>
  request('/generate', { method: 'POST', body: JSON.stringify(body) })

// 4. POST /api/coupon/check クーポン検証
export const couponCheck = (body) =>
  request('/coupon/check', { method: 'POST', body: JSON.stringify(body) })

// 5. POST /api/coupon/use クーポン使用
export const couponUse = (body) =>
  request('/coupon/use', { method: 'POST', body: JSON.stringify(body) })

// 6. POST /api/payment 決済要求
export const payment = (body) =>
  request('/payment', { method: 'POST', body: JSON.stringify(body) })

// 7. POST /api/payment/callback Stripe Webhook
// 8. POST /api/payment/paypay_callback PayPay Webhook

// 9. GET /api/ehon/:token 絵本データ取得
export const getEhon = (token) =>
  request(`/ehon/${token}`)

// 10. POST /api/contact 問い合わせメール処理
export const contact = (body) =>
  request('/contact', { method: 'POST', body: JSON.stringify(body) })


// ***** クライアント向け *****
// 11. POST /api/client/add 仮登録
export const clientAdd = (body) =>
  request('/client/add', { method: 'POST', body: JSON.stringify(body) })

// 12. GET /api/client/verify/{token} 本登録
export const clientVerify = (token) =>
  request(`/client/verify/${token}`)

// 13. POST /api/client/login ログイン
export const clientLogin = (body) =>
  request('/client/login', { method: 'POST', body: JSON.stringify(body) })

// 14. GET /api/client/themes テーマ・クーポン一覧
export const clientThemes = () =>
  request('/client/themes')

// 15. GET /api/client/subsc/plans サブスク一覧取得
export const subscPlans = () =>
  request('/client/subsc/plans')

// 16. POST /api/client/subsc/signup サブスク登録
export const subscSignup = (body) =>
  request('/client/subsc/signup', { method: 'POST', body: JSON.stringify(body) })

// 17. POST /api/client/subsc/cancel サブスク解約
export const subscCancel = () =>
  request('/client/subsc/cancel', { method: 'POST' })

// 18. PUT /api/client/coupon_dist クーポン配分更新
export const couponDist = (body) =>
  request('/client/coupon_dist', { method: 'PUT', body: JSON.stringify(body) })

// 19. POST /api/client/coupon/purchase クーポン購入
export const clientCoupon = (body) =>
  request('/client/coupon/purchase', { method: 'POST', body: JSON.stringify(body) })

// 20. PUT /api/client/questions 質問更新
export const questions = (body) =>
  request('/client/questions', { method: 'PUT', body: JSON.stringify(body) })

// 21. POST /api/client/img イメージ登録
export const imgUpload = (img, theme) =>
  request(`/client/img?img=${img}&theme=${theme}`)
