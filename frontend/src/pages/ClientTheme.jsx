import { useLocation, useNavigate } from 'react-router-dom'
import { useFadeIn } from '../hooks/useFadeIn'
import { useState } from 'react'
import { themeAdd } from '../api/client'
import Modal from '../components/Modal'

// クライアント　テーマ追加画面
export default function ClinetTheme() {
  const navigate = useNavigate()
  const locate = useLocation()
  const isFree = locate.state?.isFree

  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [desc, setDesc] = useState('')
  const [isFace, setIsFace] = useState(false)
  const [res, setRes] = useState('')
  const [theme, setTheme] = useState(null)
  const [isCheck, setIsCheck] = useState(false)
  const isNmOk = /^[a-zA-Z0-9_]+$/.test(name)
  const isOK = name && label && desc && isNmOk

  // 登録処理
  const handleAdd = async () => {
    try {
      const res = await themeAdd({ 'name': name, 'label': label, 'desc': desc, 'is_face': isFace })
      setIsCheck(false)
      setTheme(res?.theme_id)
      setRes('登録完了しました')
    } catch (err) {
      setIsCheck(false)
      setRes(`登録失敗しました：${err.error || err.message}`)
    }
  }

  // フェードインアニメーション
  useFadeIn()

  return (
    <section className='client_theme'>
      <div className='section_cont'>
        <h2 className='fade_in'>テーマ追加</h2>

        <div className='contact_user'>
          <label className='fade_in'>テーマ名
            <input type='text' placeholder='life' onChange={e => setName(e.target.value)} />
            {name && !isNmOk && (<p className='err'>英数字で入力してください</p>)}
          </label>
          <label className='fade_in'>テーマラベル
            <input type='text' placeholder='わたしの人生' onChange={e => setLabel(e.target.value)} />
          </label>
          <label className='fade_in'>テーマ説明
            <textarea placeholder='あなたの想いや人生を、世界に一つの物語に。' onChange={e => setDesc(e.target.value)} />
          </label>
        </div>
        <label className='input_check fade_in'>
          <input type='checkbox' placeholder='えほんごと' onChange={e => setIsFace(e.target.checked)} checked={isFace} />顔パーツ有無
        </label>

        <div className='btns fade_in'>
          <button className='btn_back' onClick={() => navigate('/client')}>戻る</button>
          <button className='btn_driv' onClick={() => setIsCheck(true)} disabled={!isOK} >確認</button>
        </div>
      </div>

      {/* 登録確認モーダル */}
      {isCheck &&
        <Modal onClose={() => setIsCheck(false)} title={'テーマ追加確認'}
        cont={
          (<div>
            <p>お間違いがないかの確認をお願いします</p>
            <p>登録後の変更は、再度新規登録する必要があります</p>
            {!isFree && <p>※サブスク金額が500円追加されます</p>}
            <table>
              <tr><td>テーマ名</td><td>{name}</td></tr>
              <tr><td>テーマラベル</td><td>{label}</td></tr>
              <tr><td>テーマ説明</td><td>{desc}</td></tr>
              <tr><td>顔パーツ</td><td>{isFace ? 'あり' : 'なし'}</td></tr>
            </table>
            <div className='btns'>
              <button className='btn_back' onClick={() => setIsCheck(false)}>戻る</button>
              <button className='btn_driv' onClick={handleAdd}>登録</button>
            </div>
          </div>)
          }
        />
      }

      {/* 登録結果モーダル */}
      {res &&
        <Modal onClose={() => theme ? navigate('/client/qs', { state: { 'theme': theme} }) : setRes('')} title={'テーマ登録'} cont={res} />
      }
    </section>
  )
}
