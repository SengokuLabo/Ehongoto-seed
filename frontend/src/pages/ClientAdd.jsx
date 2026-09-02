import { useState } from "react"
import { clientAdd } from "../api/client"
import { useFadeIn } from '../hooks/useFadeIn'

// クライアント 仮登録フォーム
export default function ClientAdd() {
  const [fName, setFName] = useState('')
  const [eName, setEName] = useState('')
  const [clientNm, setClientNm] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [addOk, setAddOk] = useState(false)
  const [resErr, setResErr] = useState('')
  const isClientNmOk = /^[a-zA-Z0-9]+$/.test(clientNm)
  const isOK = fName && eName && clientNm && isClientNmOk && email && pass && (pass === pass2) && pass.length >= 8

  const handleNext = async () => {
    try {
      await clientAdd({ name: `${fName} ${eName}`, email: email, password: pass, client_name: clientNm })
      setAddOk(true)
    } catch (err) {
      setResErr(err.status)
    }
  }

  // フェードインアニメーション
  useFadeIn()

  return (
    <section className='client_add'>
      <div className='section_cont'>
        <h2 className='fade_in'>クライアント登録</h2>

        <div className='contact_user'>
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
          <label className='fade_in'>クライアント名
            <input
              type='text'
              placeholder='ehongoto'
              onChange={e => setClientNm(e.target.value)}
            />
            {clientNm && !isClientNmOk && (<p className='err'>英数字で入力してください</p>)}
          </label>
          <label className='fade_in'>メール
            <input
              type='email'
              placeholder='example@mail.com'
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label className='fade_in'>パスワード
            <input
              type='password'
              placeholder='8文字以上'
              onChange={e => setPass(e.target.value)}
            />
            {pass && pass.length < 8 && (<p className='err'>パスワードは8文字以上で入力してください</p>)}
          </label>
          <label className='fade_in'>パスワード確認
            <input
              type='password'
              placeholder='パスワードを再入力'
              onChange={e => setPass2(e.target.value)}
            />
            {pass2 && pass !== pass2 && (<p className='err'>パスワードと同値を入力してください</p>)}
          </label>
        </div>

        {resErr === 400 && (
          <p>
            登録失敗しました。<br />
            再実行をお願いします。
          </p>
        )}
        {resErr === 409 && (
          <p>
            すでに登録済みです。
          </p>
        )}

        <div className='btns fade_in'>
          <div></div>
          <button className='btn_driv' onClick={handleNext} disabled={!isOK}>登録</button>
        </div>

        {addOk && (<AddModal onClose={() => setAddOk(false)} />)}
      </div>
    </section>
  )
}

// 仮登録完了モーダル
function AddModal({ onClose }) {
  return (
    <div
      className='modal_bk'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-label='仮登録完了'
    >
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <button className='modal_close' onClick={onClose} aria-label='閉じる'>×</button>
        <h2>仮登録完了</h2>
        <p>
          登録されたアドレスにメールを送信しております。<br />
          本登録をお願いします。<br />
          ※有効期限：24時間
        </p>
      </div>
    </div>
  )
}
