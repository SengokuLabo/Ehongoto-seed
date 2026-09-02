import { useEffect, useState } from 'react'
import { Routes, Route, useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Question from './pages/Question'
import Image from './pages/Image'
import Face from './pages/Face'
import Preview from './pages/Preview'
import Purchase from './pages/Purchase'
import Contact from './pages/Contact'
import FaceConfig from './pages/FaceConfig'
import ContactForm from './components/ContactForm'
import Themes from './pages/Themes'
import Coupon from './pages/Coupon'
import Client from './pages/Client'
import ClientAdd from './pages/ClientAdd'
import ClientLogin from './pages/ClientLogin'
import ClientSubsc from './pages/ClientSubsc'
import ClientCoupon from './pages/ClientCoupon'
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
          {/* テーマ一覧 or 質問回答 */}
          <Route path='/' element={<TopPage />} />
          {/* 顔パーツ選択 */}
          <Route path='/face' element={<Face />} />
          {/* 画像選択 */}
          <Route path='/image' element={<Image />} />
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

          {/* クーポン入力 */}
          <Route path='/coupon' element={<Coupon />} />

          {/* クライアント ダッシュボード */}
          <Route path='/client' element={<Client />} />
          {/* クライアント 仮登録 */}
          <Route path='/client/add' element={<ClientAdd />} />
          {/* クライアント ログイン */}
          <Route path='/client/login' element={<ClientLogin />} />
          {/* クライアント サブスク登録 */}
          <Route path='/client/subsc' element={<ClientSubsc />} />
          {/* クライアント クーポン購入 */}
          <Route path='/client/coupon' element={<ClientCoupon />} />

        </Routes>
      </div>

      {/* ヒントモーダル */}
      <HintModal />

      <Footer />
    </>
  )
}

// ホーム画面分岐処理
function TopPage() {
  const [searchParams] = useSearchParams()
  const client = searchParams.get('client')
  const theme = searchParams.get('theme')
  // パラメータなし        → Home
  // クライアントのみ      → Themes
  // クライアント + テーマ → Question
  return theme ? <Question />
    : client ? <Themes />
      : <Home />
}

// ページトップにスクローク
function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// ヘッダー
function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isContact, setIsContact] = useState(false)
  const [isDialog, setIsDialog] = useState(false)
  const params = searchParams.toString()

  let idx = -1
  if (location.pathname == '/' && params)  {
    // 質問 or テーマ一覧
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
      <button onClick={() => {idx > 0 ? setIsDialog(true): navigate('/')}}>
        <div className='header_icon'>
          <img src='/media/logos/EhongotoSeed.png' alt='EhongotoSeed' />
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

      <div className='btns_head'>
        {idx < 1 &&
          <button className='btn_login' onClick={() => navigate('/client/login')}>
            <img src='/media/logos/icon_login.png' alt='クライアント ログイン' />
          </button>
        }
        <button className='btn_contact' onClick={() => setIsContact(true)}>
          <img src='/media/logos/icon_mail.png' alt='お問い合わせ' />
        </button>
      </div>

      {/* 問い合わせモーダル */}
      {isContact &&
        <ContactForm
          isModal={true}
          onClose={() => setIsContact(false)}
        />
      }

      {/* ホームへ戻る際のダイアログ */}
      {isDialog &&
        <HomeDialog
          onOk={() => { setIsDialog(false); navigate('/') }}
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
  const params = searchParams.toString()

  let idx = -1
  if (location.pathname == '/' && params)  {
    // 質問 or テーマ一覧
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
    <>
      {/* えほんごと */}
      <div className='ehongoto'>
        <h4>もっと深く、伝えたい想いへ</h4>
        <p>あなたの想いをじっくり伺い<br />物語も絵も、世界にひとつの一冊をつくります</p>
        <a href='https://www.ehongoto.jp' target='_blank' rel='noreferror'>
          <img src='/media/logos/EHONGOTO.png' alt='EHONGOTO' />
        </a>
      </div>

      {/* フッター */}
      <div className='footer'>
        <ul>
          <li>
            <button className='btn_home' onClick={() => {idx > 0 ? setIsDialog(true) : navigate('/')}}
              style={{cursor: location.pathname == '/' ? 'default' : 'pointer'}}
            >
              <div className='footer_icon'>
                <img src='/media/logos/EhongotoSeed.png' alt='EhongotoSeed' />
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
        {isDialog &&
          <HomeDialog
            onOk={() => { setIsDialog(false); navigate('/') }}
            onCancel={() => setIsDialog(false)}
          />
        }
      </div>
    </>
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


// ヒントモーダル
function HintModal() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const HINTS = {
    '/': '質問を答えるとAIが物語を生成します\n回答が難しい質問は未回答でも大丈夫です',
    '/face': '主人公の顔パーツを選択してください\n作成した顔で絵本が生成されます',
    '/image': '各ページの文にマッチするイラストを選択してください',
    '/preview': '購入すると sample 文字が消えます\nSNSシェアをしてくれると とても嬉しいです☺️',
    '/purchase': '製本タイプを選択してください',
    '/coupon': 'クーポンコードを入力してください',
  }
  const text = HINTS[location.pathname]
  if (!text) return null

  return (
    <>
      <button className='btn_hint' onClick={() => setIsOpen(true)}>？</button>
      {isOpen &&
        <div className='modal_bk' onClick={() => setIsOpen(false)} role='dialog' aria-modal='true' aria-label='ヒント'>
          <div className='modal modal_hint' onClick={(e) => e.stopPropagation()}>
            <button className='modal_close' onClick={() => setIsOpen(false)} aria-label='閉じる'>✖︎</button>
            <h2>ヒント</h2>
            <p>{text}</p>
          </div>
        </div>
      }
    </>
  )
}
