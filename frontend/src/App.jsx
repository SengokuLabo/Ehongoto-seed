import { useEffect, useState } from 'react'
import { Routes, Route, useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import QuestionForm from './pages/QuestionForm'
import ImageSelect from './pages/ImageSelect'
import FaceSelect from './pages/FaceSelect'
import Preview from './pages/Preview'
import Purchase from './pages/Purchase'
import Contact from './pages/Contact'
import FaceConfig from './pages/FaceConfig'
import ContactForm from './components/ContactForm'
import './reset.scss'
import './app.scss'

// 共通画面
export default function App() {
  return (
    <>
      <ScrollTop />
      <Header />

      <div className='main'>
        <Routes>
          {/* 質問回答 */}
          <Route path='/' element={<QuestionForm />} />
          {/* 顔パーツ選択 */}
          <Route path='/face' element={<FaceSelect />} />
          {/* 画像選択 */}
          <Route path='/image' element={<ImageSelect />} />
          {/* 絵本プレビュー・SNSシェア */}
          <Route path='/preview' element={<Preview />} />
          {/* 購入選択 */}
          <Route path='/purchase' element={<Purchase />} />
          {/* 購入完了・ダウンロード */}
          <Route path='/ehon/:token' element={<Preview />} />
          {/* お問い合わせ */}
          <Route path='/contact' element={<Contact />} />
          {/* 顔パーツ配置設定（管理用） */}
          <Route path='/face_config' element={<FaceConfig />} />
        </Routes>
      </div>

      <Footer />
    </>
  )
}

// ページトップにスクローク
function ScrollTop() {
  const { pothname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pothname])
  return null
}

// ヘッダー
function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isContact, setIsContact] = useState(false)
  const [isDialog, setIsDialog] = useState(false)
  const [home, setHome] = useState('/')

  // パラメータ取得
  useEffect(() => {
    const params = searchParams.toString()
    setHome(params ? `/?${params}` : '/')
  }, [])
  let idx = -1

  if (location.pathname == '/') {
    // 質問
    idx = 1
  } else if (location.pathname == '/face') {
    // 顔パーツ選択
    idx = 2
  } else if (location.pathname == '/image') {
    // 画像選択
    idx = 3
  } else if (location.pathname == '/preview') {
    // プレビュー
    idx = 4
  } else if (location.pathname == '/purchase') {
    // 注文
    idx = 5
  } else {
    idx = -1
  }

  return (
    <div className='header'>
      <button onClick={() => setIsDialog(true)}>
        <div className='header_icon'>
          <img src='/media/EhongotoSeed.png' alt='EhongotoSeed' />
        </div>
      </button>
        <h4>えほんごとのたね</h4>
      {idx >= 0 &&
        <ol>
          <li className={idx === 1 ? 'active': 'unactive'}>📝 質問 </li>
          <li className={idx === 2 ? 'active': 'unactive'}>😊 顔作成</li>
          <li className={idx === 3 ? 'active': 'unactive'}>🖼 選ぶ</li>
          <li className={idx === 4 ? 'active': 'unactive'}>📖 確認</li>
          <li className={idx === 5 ? 'active': 'unactive'}>🛒 注文</li>
        </ol>
      }

      <button className='btn_contact' onClick={() => setIsContact(true)}>お問い合わせ</button>

      {/* 問い合わせモーダル */}
      {isContact &&
        <ContactForm
          isModal={true}
          onClose={() => setIsContact(false)}
        />
      }

      {/* ホームへ戻る際のダイアログ */}
      {isDialog && location.pathname != '/' &&
        <HomeDialog
          onOk={() => { setIsDialog(false); navigate(home) }}
          onCancel={() => setIsDialog(false)}
        />
      }
    </div>
  )
}


// フッター
function Footer() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isContact, setIsContact] = useState(false)
  const [isDialog, setIsDialog] = useState(false)
  const [home, setHome] = useState('/')

  // パラメータ取得
  useEffect(() => {
    const params = searchParams.toString()
    setHome(params ? `/?${params}` : '/')
  }, [])

  return (
    <div className='footer'>
      <ul>
        <li>
          <button className='btn_home' onClick={() => setIsDialog(true)}
            style={{cursor: location.pathname == '/' ? 'default' : 'pointer'}}
          >
            <div className='footer_icon'>
              <img src='/media/EhongotoSeed.png' alt='EhongotoSeed' />
            </div>
            <h4>えほんごとのたね</h4>
            <p>ホーム</p>
          </button>
        </li>
        <li>
          <button onClick={() => setIsContact(true)} disabled={location.pathname == '/contact'}>お問い合わせ</button>
        </li>
        <li><a href='https://sengoku-labo.com/legal.php' target='_blank' rel='noopener noreferrer'>
          特定商取引法
        </a></li>
      </ul>

      <h5>©️2026 センゴクラボ</h5>

      {/* 問い合わせモーダル */}
      {isContact &&
        <ContactForm
          isModal={true}
          onClose={() => setIsContact(false)}
        />
      }

      {/* ホームへ戻る際のダイアログ */}
      {isDialog && location.pathname != '/' &&
        <HomeDialog
          onOk={() => { setIsDialog(false); navigate(home) }}
          onCancel={() => setIsDialog(false)}
        />
      }
    </div>
  )
}


// ホームへ戻る際のダイアログ
function HomeDialog({onOk, onCancel}) {
  return (
    <div className='modal_bk' onClick={onCancel}>
      <div className='modal modal_home' onClick={e => e.stopPropagation()}>
        <h3>ホームに戻ると入力内容がリセットされます</h3>
        <button className='btn_back' onClick={onOk}>ホーム</button>
        <button className='btn_cancel' onClick={onCancel}>キャンセル</button>
      </div>
    </div>
  )
}
