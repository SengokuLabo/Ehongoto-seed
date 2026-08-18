import { useEffect, useState } from "react"
import { clientThemes, subscCancel } from "../api/client"
import { useNavigate } from "react-router-dom"

// クライアント ダッシュボード
export default function Client() {
  const navigate = useNavigate()
  const [client, setClient] = useState('')
  const [themes, setThemes] = useState([])
  const [subsc, setSubsc] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [isCancel, setIsCancel] = useState(false)
  const [logErr, setLogErr] = useState(false)
  const [resCancel, setResCancel] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        // クライアント情報 テーマ一覧取得
        const res = await clientThemes()
        if (!res.is_free && !res.subsc) {
          // サブスク未登録の場合は強制リダイレクト
          navigate('/client/subsc')
          return
        }
        setClient(res.client)
        setThemes(res.themes)
        setSubsc(res.subsc)
        setIsFree(res.is_free)
      } catch (err) {
        // 再ログイン
        setLogErr(true)
      }
    })()
  }, [])

  // サブスク解約処理
  const handleCancel = async () => {
    setResCancel(null)
    try {
      const res = await subscCancel()
      setIsCancel(false)
      setResCancel('解約しました\n次回更新日までは引き続きサービス利用可能です')
    } catch (err) {
      setIsCancel(false)
      setResCancel('解約処理に失敗しました。再度手続きをお願いします。')
    }
  }

  return (
    <div className='client'>
      <h2>クライアント ダッシュボード</h2>
      <div className='theme_head'>
        <h3><small>クライアント名:</small> {client}</h3>
        {!isFree &&
          <button className='btn_back' onClick={() => setIsCancel(true)}>解約</button>
        }
      </div>
      {/* 解約処理結果 */}
      {resCancel && <p className='cancel_err'>{resCancel}</p>}
      {isFree && <p>- サブスク不要アカウント</p>}
      {subsc &&
        <table className='subsc_info'>
          <thead>
            <tr><td>ステータス</td><td>プラン</td><td>登録日</td></tr>
          </thead>
          <tbody>
            <tr>
              <td>{subsc.status}</td>
              <td>{subsc.plan}</td>
              <td>{new Date(subsc.start_at).toLocaleDateString('ja-JP')}</td>
            </tr>
          </tbody>
        </table>
      }
      {themes.map((t, i) => (
        <div key={t.id} className='theme_list'>
          <div className='theme_head'>
            <h3><small>テーマ:</small> {t.name}{t.year && (<small> 【{t.year}年】</small>)}</h3>

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
            <p>クーポンはまだありません</p>
          )}
        </div>
      ))}

      {/* ログインエラー */}
      {logErr && <RetryModal onClose={() => setLogErr(false)} />}

      {/* 解約確認 */}
      {isCancel && <CancelModal onClose={() => setIsCancel(false)} onCancel={handleCancel} />}
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
      aria-label='ログイン失敗'
    >
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <button className='modal_close' onClick={onClose} aria-label='閉じる'>❌</button>
        <h2>ログイン失敗</h2>
        <p>
          再ログインもしくは新規登録を<br />
          お願いします
        </p>
        <button className='btn_back' onClick={() => navigate('/client/login')}>ログイン</button>
      </div>
    </div>
  )
}

// 解約確認モーダル
function CancelModal({ onClose, onCancel }) {
  const [isCheck, setIsCheck] = useState(false)

  return (
    <div
      className='modal_bk'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-label='解約確認'
    >
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <h2>解約確認</h2>
        <button className='modal_close' onClick={onClose} aria-label='閉じる'>❌</button>
        <ul className='modal_cancel'>
          <li>解約すると一切のサービスがご利用できなくなります</li>
          <li>未使用クーポンは使用できなくなります</li>
          <li>解約後の再登録は、無料トライアルの対象外となります</li>
        </ul>
        <label className='input_check'>
          <input type='checkbox' onChange={e => setIsCheck(e.target.checked)} />本当に解約しますか？
        </label>
        <button className='btn_back' onClick={onCancel} disabled={!isCheck}>解約</button>
      </div>
    </div>
  )
}
