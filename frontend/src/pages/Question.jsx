import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { generate, getQuestions } from '../api/client';
import WaitModal from '../components/WaitModal';
import { useFadeIn } from '../hooks/useFadeIn';

// 質問フォーム
export default function Question() {
  const navigate = useNavigate()
  const location = useLocation()
  const [chapters, setChapters] = useState([])
  const [styles, setStyles] = useState([])
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(location.state?.answers ?? {})
  const [styleSelections, setStyleSelections] = useState(location.state?.styleSelections ?? {})
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [paramError, setParamError] = useState(false)
  const lkToken = location.state?.lkToken ?? ''

  // パラメータ取得
  const [searchParams] = useSearchParams()
  const client = searchParams.get('client')
  const theme = searchParams.get('theme')
  const year = searchParams.get('year')

  // 質問取得
  useEffect(() => {
    if (!client || !theme) return
    getQuestions(client, theme, year)
      .then(data => {
        // chapter毎にグループ化
        const order = []
        const map = {}
        data.questions.forEach(q => {
          if (!map[q.chapter]) {
            // chapterが未登録の場合
            map[q.chapter] = { title: q.chapter, questions: [] }
            order.push(q.chapter)
          }
          map[q.chapter].questions.push(q)
        })
        setChapters(order.map(t => map[t]))
        // スタイルセット
        setStyles(data.styles)
      })
      .catch(() => {
        setParamError(true)
      })
  }, [client, theme, year])

  // Faceから戻ってきた場合
  useEffect(() => {
    if (location.state?.answers) {
      setStep(chapters.length)
    }
  }, [chapters])

  // スタイル遷移時にスクロールアップ
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  if (!client || !theme || paramError) {
    return (
      <div className='section_cont'>
        <p>このURLは無効です</p>
        <p>えほんごとのたね のページからアクセスしてください</p>
      </div>
    )
  }

  // 導出値セット
  const isLastStep = step === chapters.length
  const curChapter = chapters[step]
  const isAllEmpty = curChapter?.questions?.every(q => !answers[`q${q.sort}`]?.trim())

  // 次へ処理
  const nextQuestion = () => {
    // 入力チェック
    if (!curChapter?.questions.every(q => answers[`q${q.sort}`]?.trim())) {
      // モーダル表示
      setShowConfirm(true)
    } else {
      // 次のchapterへ遷移
      setStep(s => s + 1)
    }
  }

  // 未回答項目がある場合は、モーダル表示後に回答更新
  const updateAnswers = () => {
    // 未入力項目に「未回答」をセット
    const updates = {}
    curChapter.questions.forEach(q => {
      if (!answers[`q${q.sort}`]?.trim()) updates[`q${q.sort}`] = '未回答'
    })
    setAnswers(prev => ({ ...prev, ...updates }))

    // 次のchapterへ遷移
    setStep(s => s + 1)
  }

  // 入力更新チェックフラグ
  const hasChanged =
    JSON.stringify(answers) !== JSON.stringify(location.state?.answers) ||
    JSON.stringify(styleSelections) !== JSON.stringify(location.state?.styleSelections)

  // generate処理
  const handleGenerate = async () => {
    // すでにgenerate処理後で入力更新されていない場合
    if (!hasChanged && location.state?.result) {
      const result = location.state.result
      if (result.face_parts && Object.keys(result.face_parts).length > 0) {
        // 顔パーツありテーマ
        navigate('/face', { state: { ...location.state, answers, styleSelections, lkToken } })
      } else {
        // 顔パーツなしテーマ
        navigate('/image', {state: { ...location.state, answers, styleSelections, lkToken } })
      }
      return
    }

    setGenerating(true)
    setGenError(null)
    try {
      // result [theme, title, pages, face_parts, hair_colors, skin_colors, images]
      const result = await generate({
        client: client,
        theme: theme,
        answers,
        styles: styleSelections,
      })
      if (result.face_parts && Object.keys(result.face_parts).length > 0) {
        // 顔パーツありテーマ → Faceへ遷移
        navigate('/face', {state: {search: location.search, result, answers, styleSelections, lkToken}})
      } else {
        // 顔パーツなしテーマ → Imageへ遷移
        navigate('/image', {state: {search: location.search, result, answers, styleSelections, lkToken}})
      }
    } catch (err) {
      setGenError('生成に失敗しました。もう一度お試しください')
    } finally {
      setGenerating(false)
    }
  }

  // 入力チェック
  const canGenerate = isLastStep && styles.every(s => styleSelections[s.key])

  // フェードインアニメーション
  useFadeIn(curChapter, true)

  // JSXの骨格
  return (
    <section className='question'>
      <div className='section_cont'>
        {/* 質問 */}
        {!isLastStep && curChapter && (
          <div className='q_lists'>
            <h2 className='fade_in'>質問</h2>
            <h3 className='fade_in'>{curChapter.title}</h3>
            {curChapter.questions.map((q, i) => (
              <div key={q.sort} className='q_list fade_in'>
                <h4><strong>Q{q.sort}.</strong> {q.text}</h4>
                <textarea
                  autoFocus={i === 0}
                  value={answers[`q${q.sort}`] || ''}
                  onChange={e => setAnswers(prev => ({...prev, [`q${q.sort}`]: e.target.value}))}
                />
              </div>
            ))}

            {/* ボタン */}
            <div className='btns fade_in'>
              {step > 0
                ? <button className='btn_back' onClick={() => setStep(s => s - 1)}>戻る</button>
                : <div></div>
              }
              <button className='btn_driv' onClick={nextQuestion} disabled={isAllEmpty}>次へ</button>
            </div>

            {isAllEmpty &&
              <p className='err'>※回答の入力をお願いします</p>
            }
          </div>
        )}

        {isLastStep && (
          // スタイル選択画面
          <div className='q_styles'>
            <h2 className='fade_in'>スタイル選択</h2>
            {styles.map((s, i) => (
              <div key={s.key} className={`q_style fade_in`}>
                <h3>{s.label}</h3>
                <select
                  value={styleSelections[s.key] || ''}
                  onChange={e => setStyleSelections(prev => ({...prev, [s.key]: e.target.value}))}
                >
                  <option value=''>-- {s.label}を選択してください --</option>
                  {s.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}

            {/* ボタン */}
            <div className='btns fade_in'>
              <button className='btn_back' onClick={() => setStep(s => s - 1)}>戻る</button>
              <button className='btn_driv' onClick={handleGenerate} disabled={!canGenerate || generating}>
                {generating ? '生成中' : '生成する'}
              </button>
            </div>
          </div>
        )}

        {/* ローディング描写 */}
        {generating && <WaitModal text={'物語を生成中'} />}

        {/* エラー表示 */}
        {genError && <p className='error'>{genError}</p>}

        {/* 入力チェックモーダル */}
        {showConfirm && (
          <div className='modal_bk' onClick={() => setShowConfirm(false)}>
            <div className='modal' onClick={e => e.stopPropagation()}>
              <h3>未入力項目がありますが、進めますか？</h3>
              <p>※物語の内容に影響を与える可能性があります。</p>
              <button className='btn_back' onClick={() => setShowConfirm(false)}>戻る</button>
              <button className='btn_driv' onClick={() => { updateAnswers(); setShowConfirm(false) }}>進む</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
