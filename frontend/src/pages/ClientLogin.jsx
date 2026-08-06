import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { clientLogin } from "../api/client"

// ログインフォーム
export default function ClientLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [resErr, setResErr] = useState(false)
  const isOK = email && pass

  const handleNext = async () => {
    try {
      await clientLogin({ email: email, password: pass })
      navigate('/client')
    } catch(err) {
      setResErr(true)
    }
  }

  return (
    <div className='client_login'>
      <h2>クライアント ログイン</h2>
      <div className='contact_user'>
        <label>メール
          <input
            type='email'
            placeholder='example@mail.com'
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        <label>パスワード
          <input
            type='password'
            placeholder='8文字以上'
            onChange={e => setPass(e.target.value)}
          />
        </label>
      </div>

      {resErr && (
        <p>
          ログインに失敗しました。
        </p>
      )}

      <div className='btns'>
        <button className='btn_pre' onClick={() => navigate('/client/add')}>新規登録</button>
        <button className='btn_driv' onClick={handleNext} disabled={!isOK}>ログイン</button>
      </div>
    </div>
  )
}
