import { useEffect, useState } from 'react'
import { subscPlans, subscSignup } from '../api/client'
import { useNavigate } from 'react-router-dom'
import { useFadeIn } from '../hooks/useFadeIn'

// サブスク登録フォーム
export default function ClientSubsc() {
  const navigate = useNavigate()
  const [subscs, setSubscs] = useState([])
  const [subscId, setSubscId] = useState(1)
  const [signupCheck, setSignupCheck] = useState(false)
  const [signing, setSigning] = useState(false)
  const [resErr, setResErr] = useState(null)
  const [isModal, setIsModal] = useState(false)

  // プラン一覧取得
  useEffect(() => {
    (async () => {
      try {
        const res = await subscPlans()
        setSubscs(res)
        setSubscId(res[0]?.id)
      } catch (err) {
        setResErr(<p>プラン取得失敗しました。<br />申し訳ございませんが、時間をおいて再実施をお願いします。</p>)
      }
    })()
  }, [])

  // サブスク登録
  const handleSignup = async () => {
    setSigning(true)
    setResErr(null)
    try {
      const res = await subscSignup({ subsc_id: subscId })
      // ダッシュボードへ移動
      window.location.href = res.ck_url
    } catch (err) {
      setResErr(<p>決済に失敗しました<br />もう一度お試しください</p>)
    } finally {
      setSigning(false)
    }
  }

  // フェードインアニメーション
  useFadeIn()

  return (
    <section className='client_subsc'>
      <div className='section_cont'>
        <h2 className='fade_in'>クライアント 契約</h2>
        {resErr}
        <div className='subsc_list fade_in'>
          <table>
            <thead><tr><td>選択</td><td>プラン名</td><td>月額</td><td>クーポン枚数</td></tr></thead>
            <tbody>
              {subscs.map((s, i) => (
                <tr key={s.id}>
                  <td><input type='radio' name='plan' value={s.id} onChange={() => setSubscId(s.id)} defaultChecked={s.id == subscs[0].id} /></td>
                  <td>{s.name}</td>
                  <td>¥ {s.price.toLocaleString('ja-JP')} /月</td>
                  <td>{s.base_cnt} 枚</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 登録確認 */}
        <label className='input_check fade_in'>
          <input
            type='checkbox'
            onChange={e => setSignupCheck(e.target.checked)}
          />
          <span className='link' onClick={e => { e.preventDefault(); setIsModal(true)}}>ご利用規約・注意事項</span>に同意する
        </label>

        <div className="btns btns_pur fade_in">
          <button className='btn_back' onClick={() => navigate(-1)}>戻る</button>
          <button className='btn_driv' onClick={handleSignup} disabled={!signupCheck || signing}>
            {signing ? '決済中．．．' : '登録'}
          </button>
        </div>

        {/* 登録確認モーダル */}
        {isModal && (
          <CheckModal onClose={() => setIsModal(false)} />
        )}
      </div>
    </section>
  )
}


// 登録確認モーダル
function CheckModal({ onClose }) {
  return (
    <div
      className='modal_bk'
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="ご利用規約・注意事項"
    >
      <div className='modal modal_purchase' onClick={(e) => e.stopPropagation()}>
        <button className="modal_close" onClick={onClose} aria-label="閉じる">✖︎</button>
        <h3>ご利用規約・注意事項</h3>

        <div className="check_thumb">
          <h4>無料トライアル</h4>
          <ul>
            <li>登録から30日間は、無料でご利用いただけます</li>
            <li>トライアル期間終了後、自動的に月額課金が開始されます</li>
          </ul>

          <h4>月額課金について</h4>
          <ul>
            <li>毎月自動で更新されます</li>
            <li>クーポンは毎月更新時に配布されます</li>
            <li>毎月配布分のクーポンは翌月に繰り越しできません</li>
          </ul>

          <h4>プラン変更・解約について</h4>
          <ul>
            <li>ダッシュボードからいつでもプラン変更・解約可能です</li>
            <li>トライアル期間中であれば、課金は発生しないです</li>
            <li>解約後であっても、次回更新日時まではご利用可能です</li>
            <li>ご利用期間終了後は、すべてのサービスが利用できなくなります</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
