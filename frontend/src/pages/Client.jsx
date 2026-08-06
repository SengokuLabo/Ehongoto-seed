import { useEffect, useState } from "react"
import { clientThemes } from "../api/client"
import { useNavigate } from "react-router-dom"

// クライアント ダッシュボード
export default function Client() {
  const navigate = useNavigate()
  const [themes, setThemes] = useState([])
  const [resErr, setResErr] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await clientThemes()
        setThemes(res.themes)
      } catch (err) {
        // 再ログイン
        setResErr(true)
      }
    })()
  }, [])

  return (
    <div className='client'>
      <h2>クライアント ダッシュボード</h2>
      {themes.map((t, i) => (
        <div key={t.id} className='theme_list'>
          <div className='theme_head'>
            <h3>{t.name}{t.year && (<small> 【{t.year}年】</small>)}</h3>

            <p>PDF価格：{t.pdf} 円</p>

            <button className='btn_driv' onClick={() => navigate('/client/coupon', { state: { theme_id: t.id, theme: t.name, pdf: t.pdf } })}>
              クーポン購入
            </button>
          </div>

          {t.coupons.length > 0 && (
            <table className='coupons'>
              <thead>
                <tr><td>コード</td><td>残数</td><td>有効期限</td></tr>
              </thead>
              <tbody>
                {t.coupons.map((c, i) => (
                  <tr key={c.code} className={
                    c.rest_cnt === 0 ||
                    (c.valid_until && new Date(c.valid_until).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0))
                    ? 'coupon_ng' : ''
                  }>
                    <td>{c.code}</td>
                    <td>{c.rest_cnt}/{c.max_uses}</td>
                    <td>{c.valid_until ? new Date(c.valid_until).toLocaleDateString('ja-JP') : '期限なし'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {t.coupons.length === 0 && (
            <p>テーマはまだありません</p>
          )}
        </div>
      ))}

      {resErr && <RetryModal onClose={() => setResErr(false)} />}
    </div>
  )
}

// 再ログインモーダル
function RetryModal({ onClose }) {
  const navigate = useNavigate()

  return (
    <div
      className='modal_bk'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-label='再ログイン'
    >
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <button className='modal_close' onClick={onClose} aria-label='閉じる'>×</button>
        <h2>再ログイン</h2>
        <p>
          ログインから一定時間経過しているため<br />
          再ログインお願いします。
        </p>
        <button className='btn_back' onClick={() => navigate('/client/login')}>ログイン</button>
      </div>
    </div>
  )
}
