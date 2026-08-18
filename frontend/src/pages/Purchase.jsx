import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { payment } from "../api/client";
import { mockData } from '../mock';

const mock = import.meta.env.DEV ? mockData : null

// 購入選択フォーム
export default function Purchase() {
  const navigate = useNavigate()
  const location = useLocation()
  const { result, face } = location.state || {}

  const [paying, setPaying] = useState(false)
  const [error, setError] = useState(null)
  const [type, setType] = useState('pdf')     // タイプ(pdf, soft, hard)

  const [fName, setFName] = useState('')
  const [eName, setEName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [post, setPost] = useState('')
  const [address, setAddress] = useState('')
  const [mailOk, setMailOk] = useState(false)
  const [payCheck, setPayCheck] = useState(false)
  const [isModal, setIsModal] = useState(false)

  const spreads = result?.spreads ?? mock.spreads
  const price = result?.price?.[type] ?? mock.price?.[type]
  const toHalf = (str) => str.replace(/[０-９]/g, s=> String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/-/g, '')

  // 入力チェック
  const canPayment = type === 'pdf'
    ? fName && eName && email && payCheck
    : fName && eName && email && phone && post && address && payCheck

  // payment処理
  const handlePayment = async () => {
    setPaying(true)
    setError(null)
    try {
      // result [ck_url]
      const ckResult = await payment({
        type: type,
        client: result?.client,
        theme: result?.theme,
        buyer: {
          name: `${fName} ${eName}`,
          email: email,
          phone: phone,
          post: post,
          address: address,
          mail_ok: mailOk,
        },
        face: face,
        spreads: spreads,
        log_id: result?.log_id,
      })

      // 決済完了画面へ遷移
      window.location.href = ckResult.ck_url
    } catch (err) {
      setError('決済に失敗しました もう一度お試しください')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="purchase">
      <h2>絵本を注文</h2>

      {/* 購入タイプ */}
      <div className="pur_type">
        <label>
          <input type='radio' name='type' onChange={() => setType('pdf')} checked={type==='pdf'} />
          PDF
        </label>
        <label>
          <input type='radio' name='type' onChange={() => setType('soft')} checked={type==='soft'} />
          製本(小冊子)
        </label>
        <label hidden={true}>
          <input type='radio' name='type' onChange={() => setType('hard')} checked={type==='hard'} />
          製本(ハードカバー)
        </label>
      </div>
      <h4 className='pur_price'><strong>{ price?.toLocaleString('ja-JP') }</strong> 円(税込)</h4>

      {/* 購入者情報 */}
      <div className="pur_buyer">
        <label>名前
          <div className="input_name">
            <input
              type='text'
              placeholder='絵本'
              autoComplete='family-name'
              onChange={e => setFName(e.target.value)}
              />
            <input
              type='text'
              autoComplete='given-name'
              placeholder='花子'
              onChange={e => setEName(e.target.value)}
            />
          </div>
        </label>
        <label>メール
          <input
            type='email'
            placeholder='example@mail.com'
            onChange={e => setEmail(e.target.value)}
            />
        </label>
        <label>電話番号
          <input
            type='tel'
            placeholder={type === 'pdf' ? '-' : '09012345678'}
            onChange={e => setPhone(toHalf(e.target.value))}
            disabled={type==='pdf'}
          />
        </label>
        <label>郵便番号
          <input
            type='text'
            placeholder={type === 'pdf' ? '-' : '1234567'}
            onChange={e => setPost(toHalf(e.target.value))}
            disabled={type==='pdf'}
          />
        </label>
        <label>住所
          <input
            type='text'
            placeholder={type === 'pdf' ? '-' : '東京都渋谷区〇〇1-2-3'}
            onChange={e => setAddress(e.target.value)}
            disabled={type==='pdf'}
          />
        </label>
      </div>

      {/* 購入確認 */}
      <label className='input_check'>
        <input
          type='checkbox'
          onChange={e => setPayCheck(e.target.checked)}
        />
        <span className='link' onClick={e => { e.preventDefault(); setIsModal(true)}}>購入確認</span>に同意する
      </label>

      <div className="btns btns_pur">
        <button className='btn_back' onClick={() => navigate(-1)}>戻る</button>
        <button className='btn_driv' onClick={handlePayment} disabled={!canPayment || paying}>
          {paying ? '決済中．．．' : '購入'}
        </button>
      </div>

      {/* キャンペーンメール */}
      <label className='input_check'>
        <input
          type='checkbox'
          onChange={e => setMailOk(e.target.checked)}
        />
        キャンペーン情報をメールで受け取る
      </label>

      {/* エラー表示 */}
      {error && <p className='error'>{error}</p>}

      {/* 購入確認モーダル */}
      {isModal && (
        <CheckModal onClose={() => setIsModal(false)} />
      )}

    </div>
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
        <button className="modal_close" onClick={onClose} aria-label="閉じる">✖︎</button>
        <h3>購入確認</h3>

        <div className="check_thumb">
          <ul>
            <li>注文確定後のキャンセル・内容変更は、不可となります</li>
          </ul>

          <h4>PDF購入</h4>
          <ul>
            <li>ダウンロードリンクの有効期限は、30日間となります</li>
            <li>期限後の再ダウンロードは、再購入が必要です</li>
          </ul>

          <h4>製本購入</h4>
          <ul>
            <li>製本・発送には約2週間ほどかかります</li>
            <li>配送先住所不備などにて再送となる場合の送料は、お客様負担となります</li>
            <li>離島・一部地域は、配送に追加日数がかかる場合があります</li>
            <li>配送中の破損などは、到着後7日以内にご連絡ください</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
