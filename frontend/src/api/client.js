
// 接続関数
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
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

// 画像用接続関数
async function requestImg(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
  })
  if (!res.ok) {
    const b = await res.json(); throw { status: res.status, ...b }
  }
  return res.json()
}

// ***** エンドユーザー向け *****
// 101. GET /api/themes テーマ一覧取得
export const themes = (client) =>
  request(`/themes?client=${client}`)

// 102. GET /api/questions 質問一覧取得
export const getQuestions = (client, theme, year) => {
  const params = new URLSearchParams({client, theme,})
  if (year) params.append('year', year)
  return request(`/questions?${params}`)
}

// 103. POST /api/generate 物語作成 + 物語パーツ取得
export const generate = (body) =>
  request('/generate', { method: 'POST', body: JSON.stringify(body) })

// 104. POST /api/coupon/check クーポン検証
export const couponCheck = (body) =>
  request('/coupon/check', { method: 'POST', body: JSON.stringify(body) })

// 105. POST /api/coupon/use クーポン使用
export const couponUse = (body) =>
  request('/coupon/use', { method: 'POST', body: JSON.stringify(body) })

// 106. POST /api/payment 決済要求
export const payment = (body) =>
  request('/payment', { method: 'POST', body: JSON.stringify(body) })

// 107. POST /api/payment/callback Stripe Webhook
// 108. POST /api/payment/paypay_callback PayPay Webhook

// 109. GET /api/ehon/:token 絵本データ取得
export const getEhon = (token) =>
  request(`/ehon/${token}`)

// 110. POST /api/contact 問い合わせメール処理
export const contact = (body) =>
  request('/contact', { method: 'POST', body: JSON.stringify(body) })

// 111. PATCH /api/log/{log_id} ファネル記録
export const patchLog = (log_id) =>
  request(`/log/${log_id}`)

// 112. GET /api/home ホーム画面一括取得
export const getHome = () =>
  request('/home')


// ***** クライアント向け *****
// 201. POST /api/client/add 仮登録
export const clientAdd = (body) =>
  request('/client/add', { method: 'POST', body: JSON.stringify(body) })

// 202. GET /api/client/verify/{token} 本登録
export const clientVerify = (token) =>
  request(`/client/verify/${token}`)

// 203. POST /api/client/login ログイン
export const clientLogin = (body) =>
  request('/client/login', { method: 'POST', body: JSON.stringify(body) })

// 204. GET /api/client/themes テーマ・クーポン一覧
export const clientThemes = () =>
  request('/client/themes')

// 205. GET /api/client/subsc/plans サブスク一覧取得
export const subscPlans = () =>
  request('/client/subsc/plans')

// 206. POST /api/client/subsc/signup サブスク登録
export const subscSignup = (body) =>
  request('/client/subsc/signup', { method: 'POST', body: JSON.stringify(body) })

// 207. POST /api/client/subsc/cancel サブスク解約
export const subscCancel = () =>
  request('/client/subsc/cancel', { method: 'POST' })

// 208. PUT /api/client/coupon_dist クーポン配分更新
export const couponDist = (body) =>
  request('/client/coupon_dist', { method: 'PUT', body: JSON.stringify(body) })

// 209. POST /api/client/coupon/purchase クーポン購入
export const clientCoupon = (body) =>
  request('/client/coupon/purchase', { method: 'POST', body: JSON.stringify(body) })

// 210. GET /api/client/questions 質問一覧取得
export const themeQuestions = (themeId) =>
  request(`/client/questions?theme=${themeId}`)

// 211. PUT /api/client/questions 質問更新
export const questions = (body) =>
  request('/client/questions', { method: 'PUT', body: JSON.stringify(body) })

// 212. POST /api/client/img イメージ登録
export const imgUpload = (formData) =>
  requestImg('/client/img', { method: 'POST', body: formData })

// 213. GET /api/client/stats ファネル統計
export const clientStats = () =>
  request('/client/stats')

// 214. POST /api/client/theme テーマ追加
export const clientThemeAdd = (body) =>
  request('/client/theme', { method: 'POST', body: JSON.stringify(body) })

// 215. DELETE /api/client/theme/{id} テーマ無効化
export const clientThemeDelete = (id) =>
  request(`/client/theme/${id}`, { method: 'DELETE' })

// 216. PATCH /api/client/theme/{id} テーマ復元
export const clientThemeRestore = (id) =>
  request(`/client/theme/${id}`, { method: 'PATCH' })

// 217. POST /api/client/subsc/portal サブスク登録変更
export const subscPortal = () =>
  request('/client/subsc/portal', { method: 'POST' })

