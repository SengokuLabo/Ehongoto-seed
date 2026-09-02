import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clientCoupon } from '../api/client'
import { useFadeIn } from '../hooks/useFadeIn'

// クーポン購入フォーム
export default function ClientCoupon() {
  const navigate = useNavigate()
  const locate = useLocation()
  const [count, setCount] = useState(1)
  const [resErr, setResErr] = useState(false)
  const [payCheck, setPayCheck] = useState(false)
  const [isModal, setIsModal] = useState(false)
  const theme_id = locate.state?.theme_id
  const theme = locate.state?.theme
  const pdf = locate.state?.pdf

  const handleNext = async() => {
    try {
      const res = await clientCoupon({ theme_id: theme_id, count: count })
      window.location.href = res.ck_url
    } catch (err) {
      setResErr(true)
    }
  }

  // フェードインアニメーション
  useFadeIn()

  return (
    <section className='client_coupon'>
      <div className='section_cont'>
        <h2 className='fade_in'>クーポン購入</h2>
        <h3 className='fade_in'>【 {theme} 】</h3>
        <div className='coupon_cnt fade_in'>
          <label>数量
            <input type='number' min={1} onChange={(e) => setCount(Number(e.target.value))} value={count}/>
          </label>
          <h4>価格：{count > 0 ? (count * pdf).toLocaleString('ja-JP') : 0} 円</h4>
        </div>

        {/* 購入確認 */}
        <label className='input_check fade_in'>
          <input
            type='checkbox'
            onChange={e => setPayCheck(e.target.checked)}
          />
          <span className='link' onClick={e => { e.preventDefault(); setIsModal(true) }}>購入確認</span>に同意する
        </label>
        <p className='fade_in'>※有効期限は90日間です。</p>

        <div className='btns fade_in'>
          <button className='btn_back' onClick={() => navigate(-1)}>戻る</button>
          <button className='btn_driv' onClick={handleNext} disabled={count<=0 || !payCheck}>購入</button>
        </div>

        {/* 購入確認モーダル */}
        {isModal && (
          <CheckModal onClose={() => setIsModal(false)} />
        )}

        {/* 購入失敗 */}
        {resErr && (
          <p>購入に失敗しました。<br />再購入お願いします。</p>
        )}
      </div>
    </section>
  )
}

// 購入確認モーダル
function CheckModal({ onClose }) {
  return (
    <div
      className='modal_bk'
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="購入確認"
    >
      <div className='modal modal_purchase' onClick={(e) => e.stopPropagation()}>
        <button className="modal_close" onClick={onClose} aria-label="閉じる">×</button>
        <h3>購入確認</h3>

        <div className="check_thumb">
          <ul>
            <li>注文確定後のキャンセル・内容変更は、不可となります</li>
            <li>有効期限は、90日間となります</li>
            <li>有効期限切れも含め払い戻しは、不可となります</li>
            <li>ご指定のテーマのみで使用可能です</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
