import { useState } from 'react'
import { contact } from '../api/client'

// 問い合わせフォーム
export default function ContactForm({ isModal, onClose }) {
  const [type, setType] = useState('normal')
  const [fName, setFName] = useState('')
  const [eName, setEName] = useState('')
  const [email, setEmail] = useState('')
  const [tel, setTel] = useState('')
  const [message, setMessage] = useState('')
  const [num, setNum] = useState(1)
  const [company, setCompany] = useState('')

  const [contacting, setContacting] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  let placeholder = ''
  if (type === 'normal') {
    placeholder = '感謝の気持ちを伝えたいです。'
  } else if (type === 'defect') {
    placeholder = 'ダウンロード用メールが受信できません。'
  } else if (type === 'multi') {
    placeholder = '複数冊まとめて製本依頼したいです。'
  } else if (type === 'hard') {
    placeholder = 'ハードタイプの絵本にて製本を依頼したいです。'
  } else if (type === 'client') {
    placeholder = '私も独自のテーマを作成し、絵本を展開させてみたいです。'
  }

  const canContact = type == 'defect'
    ? fName && eName && email && message && tel
    : fName && eName && email && message

  // SESメール送信API
  const handleSend = async () => {
    setContacting(true)
    setResult(null)
    setError(null)
    try {
      await contact({
        type: type,
        name: `${fName} ${eName}`,
        email: email,
        tel: tel,
        message: message,
        num: num,
        company: company,
      })

      setResult('お問い合わせありがとうございます。改めてご連絡いたします。')
    } catch (err) {
      setError('問い合わせに失敗しました。申し訳ございませんが、再度問い合わせください。')
    } finally {
      setContacting(false)
    }
  }

  return (
    <div className={isModal ? 'contact modal_bk' : 'contact'}
      onClick={onClose}
      role={isModal ? 'dialog' : null}
      aria-modal={isModal}
      aria-label='お問い合わせ'
    >
      <div className={isModal ? 'modal modal_contact' : ''} onClick={(e) => e.stopPropagation()}>
        <button className='modal_close' onClick={onClose} aria-label='閉じる' hidden={!isModal}>✖︎</button>
        <h3>お問い合わせ</h3>
        <h5>お問い合わせ内容を選択ください</h5>
        <div className='contact_type'>
          <label>
            <input type='radio' name='contact_type' value='multi' onChange={(e) => setType(e.target.value)} checked={type === 'multi'} />
            複数冊購入
          </label>
          <label>
            <input type='radio' name='contact_type' value='hard' onChange={(e) => setType(e.target.value)} checked={type === 'hard'} />
            ハードカバー購入希望
          </label>
          <label>
            <input type='radio' name='contact_type' value='defect' onChange={(e) => setType(e.target.value)} checked={type === 'defect'} />
            メールが届かない
          </label>
          <label>
            <input type='radio' name='contact_type' value='client' onChange={(e) => setType(e.target.value)} checked={type === 'client'} />
            新テーマ作成<span>（クライアント様向け）</span>
          </label>
          <label>
            <input type='radio' name='contact_type' value='normal' onChange={(e) => setType(e.target.value)} checked={type === 'normal'} />
            その他
          </label>
        </div>

        {/* ユーザー情報 */}
        <div className='contact_user'>
          <label>名前
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
          {type === 'client' &&
            <label>会社名
              <input
                type='text'
                placeholder='えほん会社'
                onChange={e => setCompany(e.target.value)}
                />
            </label>
          }
          <label>メール
            <input
              type='email'
              placeholder='example@mail.com'
              onChange={e => setEmail(e.target.value)}
              />
          </label>
          {type === 'defect' &&
            <label>電話番号
              <input
                type='tel'
                placeholder='09012345678'
                onChange={e => setTel(e.target.value)}
                />
            </label>
          }
          <label>
            お問い合わせ内容
            <textarea
              placeholder={placeholder}
              onChange={e => setMessage(e.target.value)}
            ></textarea>
          </label>
          {type === 'multi' &&
            <label>
              数量
              <input
                type='number'
                value={num}
                onChange={e => setNum(e.target.value)}
                />
            </label>
          }
        </div>

        <div className='contact_btns'>
          {!isModal &&
            <button className='btn_back' onClick={() => navigate(-1)}>戻る</button>
          }
          <button className='btn_driv' onClick={handleSend} disabled={!canContact || contacting}>送信</button>
        </div>

        {/* 送信結果 */}
        {result &&
          <p className='result'>{result}</p>
        }

        {/* エラー表示 */}
        {error &&
          <p className='error'>{error}</p>
        }
      </div>
    </div>
  )
}
