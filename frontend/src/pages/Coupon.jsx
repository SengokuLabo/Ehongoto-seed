import { useState } from "react"
import { couponCheck, couponUse } from "../api/client"
import { useLocation, useNavigate } from "react-router-dom"
import { useFadeIn } from '../hooks/useFadeIn'

// クーポン入力フォーム
export default function Coupon() {
  const location = useLocation()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [fName, setFName] = useState('')
  const [eName, setEName] = useState('')
  const [email, setEmail] = useState('')
  const [resErr, setResErr] = useState('')
  const { result } = location.state || {}
  const isOK = code && fName && eName && email

  // クーポンチェックAPI
  const handleNext = async () => {
    try {
      const ckResult = await couponCheck({ code: code, name: `${fName} ${eName}`, email: email })
      if (result) {
        // 再入力時
        const useResult = await couponUse({
          lk_token: ckResult.lk_token,
          face: location.state.face,
          spreads: result?.spreads,
          log_id: result?.log_id
        })
        navigate('/preview', {state: { ...location.state, lkToken: ckResult.lk_token, dlUrl: useResult.dl_url } })
      } else {
        // 初期入力時
        navigate(`/?client=${ckResult.client}&theme=${ckResult.theme}`, { state: { lkToken: ckResult.lk_token } })
      }
    } catch(err) {
      setResErr(err.status)
    }
  }

  // フェードインアニメーション
  useFadeIn()

  return (
    <section className='coupon'>
      <div className='section_cont'>
        <h2 className='fade_in'>クーポン入力フォーム</h2>

        {/* 入力クーポンが無効だった場合 */}
        {resErr === 410 && (
          <p>
            入力されたクーポンコードは有効期限が切れています。<br />
            クライアントにご確認ください。
          </p>
        )}
        {resErr === 409 && (
          <p>
            入力されたクーポンコードは定員に達しています。<br />
            クライアントにご確認ください。
          </p>
        )}
        {resErr && resErr !== 410 && resErr !== 409 && (
          <p>
            入力されたクーポンコードは使用できません。<br />
            コードを確認し、再実行をお願いします。<br />
            それでもダメな場合は、クライアントにご確認ください。
          </p>
        )}

        <div className='contact_user'>
          <label className='fade_in'>クーポンコード
            <input
              type='text'
              placeholder='EHG****'
              onChange={e => setCode(e.target.value)}
              />
          </label>
          <label className='fade_in'>名前
            <div className='input_name'>
              <input
                type='text'
                autoComplete='family-name'
                placeholder='姓'
                onChange={e => setFName(e.target.value)}
                />
              <input
                type='text'
                autoComplete='given-name'
                placeholder='名'
                onChange={e => setEName(e.target.value)}
              />
            </div>
          </label>
          <label className='fade_in'>メール
            <input
              type='email'
              placeholder='example@mail.com'
              onChange={e => setEmail(e.target.value)}
              />
          </label>
        </div>

        <div className='btns fade_in'>
          <div></div>
          <button className='btn_driv' onClick={handleNext} disabled={!isOK}>送信</button>
        </div>
      </div>
    </section>
  )
}
