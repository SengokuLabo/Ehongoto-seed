import { useEffect, useState } from "react"
import { clientThemes, couponDist, subscCancel, subscPortal } from "../api/client"
import { useNavigate } from "react-router-dom"
import Modal from '../components/Modal'
import { useFadeIn } from '../hooks/useFadeIn'

// クライアント ダッシュボード
export default function Client() {
  const navigate = useNavigate()

  const [client, setClient] = useState('')          // クライアント名
  const [themes, setThemes] = useState([])          // テーマリスト
  const [logErr, setLogErr] = useState(false)       // ログインエラーモーダル

  const [maxCnt, setMaxCnt] = useState(0)           // クーポン総数
  const [totalCnt, setTotalCnt] = useState(0)       // クーポン入力数
  const [dist, setDist] = useState({})              // クーポン割振
  const [resDist, setResDist] = useState(null)      // クーポン分配モーダル

  const [subsc, setSubsc] = useState('')            // サブスク情報
  const [isFree, setIsFree] = useState(false)       // サブスク不要アカウント判定
  const [resCancel, setResCancel] = useState(null)  // サブスク解約結果
  const [isCancel, setIsCancel] = useState(false)   // サブスク解約モーダル
  const [isCheck, setIsCheck] = useState(false)     // サブスク解約チェック

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
        setMaxCnt(res.max_cnt)
        setTotalCnt(res.max_cnt)
        setSubsc(res.subsc)
        setIsFree(res.is_free)
        setDist(Object.fromEntries(res.themes.map(t => [t.name, t.coupon_cnt ?? 0])))
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

  // サブスク登録更新ポータル
  const handlePortal = async () => {
    try {
      const res = await subscPortal()
      window.location.href = res.portal_url
    } catch (err) {
      console.error(err)
    }
  }

  // クーポン分配登録
  const handleDistChange = (name, num) => {
    const newDist = { ...dist, [name]: num}
    const total = Object.values(newDist).reduce((a, d) => a + d, 0)
    if (total > maxCnt) return
    setDist(newDist)
    setTotalCnt(total)
  }

  // クーポン分配登録
  const handleDistSave = async () => {
    try {
      const body = Object.entries(dist).map(([theme, cnt]) => ({ theme, cnt }))
      await couponDist(body)
      setResDist(<p>クーポンの分配を確定しました<br />次回更新時より適用されます</p>)
    } catch (err) {
      setResDist(<p>{err.error || '配分の登録に失敗しました'}</p>)
    }
  }

  // フェードインアニメーション
  useFadeIn(client)

  return (
    <section className='client'>
      <div className='section_cont'>
        <h2 className='fade_in'>クライアント ダッシュボード</h2>
        <div className='client_head'>
          <h3 className='fade_in'><small>クライアント名:</small> {client}</h3>
          {!isFree &&
            <button className='btn_pre fade_in' onClick={() => setIsCancel(true)}>解約</button>
          }
        </div>
        {/* 解約処理結果 */}
        {resCancel && <p className='cancel_err'>{resCancel}</p>}
        {isFree && <p className='fade_in'>- サブスク不要アカウント</p>}

        {/* サブスク情報 */}
        {subsc &&
          <div className='subsc_info fade_in'>
            <table>
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
            <div className='btns'>
              <div></div>
              <button className='btn_driv' onClick={handlePortal}>サブスク情報を確認</button>
            </div>
          </div>
        }

        {/* クーポン */}
        {maxCnt > 0 &&
          <div className='coupon_dist'>
            <div className='client_head fade_in'>
              <div>
                <h3>クーポン配分設定</h3>
                <p>- 毎月更新のタイミングで配布されます</p>
              </div>
              <p>{totalCnt} / {maxCnt} 枚</p>
              <button className='btn_nxt fade_in' onClick={handleDistSave} disabled={totalCnt!=maxCnt}>分配確定</button>
            </div>

            <table className='fade_in'>
              <thead>
                <tr><td>テーマ</td><td>枚数</td></tr>
              </thead>
              <tbody>
                {themes.map(t => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>
                      <input type='number' placeholder={t.coupon_cnt} min={0} value={dist[t.name]}
                        onChange={(e) => handleDistChange(t.name, Number(e.target.value))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }

        {/* テーマ情報 */}
        {themes.map((t, i) => (
          <div key={t.id} className='theme_list'>
            <div className='client_head fade_in'>
              <h3><small>テーマ:</small> {t.name}{t.year && (<small> 【{t.year}年】</small>)}</h3>

              <div className='theme_head_price'>
                <p>PDF価格：{t.pdf} 円</p>
                <button className='btn_driv' onClick={() => navigate('/client/coupon', { state: { theme_id: t.id, theme: t.name, pdf: t.pdf } })}>
                  クーポン購入
                </button>
              </div>
            </div>

            {t.coupons.length > 0 && (
              <table className='coupons fade_in'>
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
              <p className='fade_in'>クーポンはまだありません</p>
            )}
          </div>
        ))}

        {/* ログインエラー */}
        {logErr &&
          <Modal onClose={() => setLogErr(false)} title='ログイン失敗'
          cont={<>
            <p>
              再ログインもしくは新規登録を<br />
              お願いします
            </p>
            <button className='btn_back' onClick={() => navigate('/client/login')}>ログイン</button>
          </>}
          />}

        {/* 分配確定 */}
        {resDist &&
          <Modal onClose={() => setResDist(null)} title='クーポン分配確定'
          cont={<>{resDist}</>}
          />}

        {/* 解約確認 */}
        {isCancel &&
          <Modal onClose={() => setIsCancel(false)} title='解約確認'
          cont={<>
            <ul className='modal_cancel'>
              <li>解約すると一切のサービスがご利用できなくなります</li>
              <li>未使用クーポンは使用できなくなります</li>
              <li>解約後の再登録は、無料トライアルの対象外となります</li>
            </ul>
            <label className='input_check'>
              <input type='checkbox' onChange={e => setIsCheck(e.target.checked)} />本当に解約しますか？
            </label>
            <button className='btn_back' onClick={handleCancel} disabled={!isCheck}>解約</button>
          </>}
          />}
      </div>
    </section>
  )
}
