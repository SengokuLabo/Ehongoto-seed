// APIクライアント（全エンドポイント）
// 詳細は docs/api-design.md 参照
//
// 接続先: 環境変数 VITE_API_BASE_URL にバックエンドURLを設定する
//   例: VITE_API_BASE_URL=http://localhost:8001/api  (ローカル)
//       VITE_API_BASE_URL=https://maker.ehongoto.jp/api  (本番)

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

// 1. GET /api/questions
// 質問取得
export const getQuestions = (client, theme, year) => {
  const params = new URLSearchParams({
    client,
    theme,
  })
  if (year) params.append('year', year)
  return request(`/questions?${params}`)
}

// 2. POST /api/generate
// 物語作成
export const generate = (body) =>
  request('/generate', { method: 'POST', body: JSON.stringify(body) })

// 3. POST /api/payment
// 決済要求
export const payment = (body) =>
  request('/payment', { method: 'POST', body: JSON.stringify(body) })

// 4. POST /api/payment/callback
// Stripe決済完了後の受け取りエンドポイントのためここに処理は不要

// 5. GET /api/ehon/:token
// 絵本データ取得
export const getEhon = (token) =>
  request(`/ehon/${token}`)

// 6. POST /api/contact
// 問い合わせメール処理
export const contact = (body) =>
  request('/contact', { method: 'POST', body: JSON.stringify(body) })


// 7. POST /api/client/add
export const clientAdd = (body) =>
  request('/client/add', { method: 'POST', body: JSON.stringify(body) })

// 8. GET /api/client/verify/{token}
export const clientVerify = (token) =>
  request(`/client/verify/${token}`)

// 9. POST /api/client/login
export const clientLogin = (body) =>
  request('/client/login', { method: 'POST', body: JSON.stringify(body) })

// 10. GET /api/client/themes
export const clientThemes = () =>
  request('/client/themes')

// 11. POST /api/client/coupon/purchase
export const clientCoupon = (body) =>
  request('/client/coupon/purchase', { method: 'POST', body: JSON.stringify(body) })

// 12. POST /api/coupon/check
export const couponCheck = (body) =>
  request('/coupon/check', { method: 'POST', body: JSON.stringify(body) })

// 13. POST /api/coupon/use
export const couponUse = (body) =>
  request('/coupon/use', { method: 'POST', body: JSON.stringify(body) })

// 14. GET /api/themes
export const themes = (client) =>
  request(`/themes?client=${client}`)
