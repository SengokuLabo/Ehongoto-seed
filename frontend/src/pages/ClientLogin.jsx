import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { clientLogin } from "../api/client"
import { useFadeIn } from '../hooks/useFadeIn'

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

  // フェードインアニメーション
  useFadeIn()

  return (
    <section className='client_login'>
      <div className='section_cont'>
        <h2 className='fade_in'>クライアント ログイン</h2>
        <div className='contact_user'>
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
              onKeyDown={e => e.key === 'Enter' && isOK && handleNext()}
            />
          </label>
        </div>

        {resErr && (
          <p>
            ログインに失敗しました。
          </p>
        )}

        <div className='btns fade_in'>
          <button className='btn_pre' onClick={() => navigate('/client/add')}>新規登録</button>
          <button className='btn_driv' onClick={handleNext} disabled={!isOK}>ログイン</button>
        </div>
      </div>
    </section>
  )
}
