import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { generate, getQuestions } from '../api/client';

// 質問フォーム
export default function QuestionForm() {
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

  // FaceSelectから戻ってきた場合
  useEffect(() => {
    if (location.state?.answers) {
      setStep(chapters.length)
    }
  }, [chapters])

  if (!client || !theme || paramError) {
    return (
      <div>
        <p>このURLは無効です</p>
        <p>えほんごとのたね のページからアクセスしてください</p>
      </div>
    )
  }

  // 導出値セット
  const isLastStep = step === chapters.length
  const curChapter = chapters[step]

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
      navigate('/face', { state: { ...location.state, answers, styleSelections, lkToken } })
      return
    }

    setGenerating(true)
    setGenError(null)
    try {
      // result [theme, title, pages, face_parts, hair_colors, skin_colors, images]
      const result = await generate({
        theme: theme,
        answers,
        styles: styleSelections,
      })
      // FaceSelectへ遷移
      navigate('/face', {state: {search: location.search, result, answers, styleSelections, lkToken}})
    } catch (err) {
      setGenError('生成に失敗しました。もう一度お試しください')
    } finally {
      setGenerating(false)
    }
  }

  // 入力チェック
  const canGenerate = isLastStep && styles.every(s => styleSelections[s.key])

  // JSXの骨格
  return (
    <div className='question'>
      {/* ステップ */}
      <p>{step + 1} / {chapters.length + 1}</p>

      {/* 質問 */}
      {!isLastStep && curChapter && (
        <div className='q_lists'>
          <h2>質問</h2>
          <h3>{curChapter.title}</h3>
          {curChapter.questions.map((q, i) => (
            <div key={q.sort} className='q_list'>
              <h4><strong>Q{q.sort}.</strong> {q.text}</h4>
              <textarea
                autoFocus={i === 0}
                value={answers[`q${q.sort}`] || ''}
                onChange={e => setAnswers(prev => ({...prev, [`q${q.sort}`]: e.target.value}))}
              />
            </div>
          ))}
        </div>
      )}

      {isLastStep && (
        // スタイル選択画面
        <div className='q_styles'>
          <h2>スタイル選択</h2>
          {styles.map(s => (
            <div key={s.key} className='q_style'>
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
        </div>
      )}

      {/* ボタン */}
      <div className='btns'>
        {step > 0
          ? <button className='btn_back' onClick={() => setStep(s => s - 1)}>戻る</button>
          : <div></div>
        }
        <button
          className='btn_driv'
          onClick={isLastStep ? handleGenerate : nextQuestion}
          disabled={isLastStep ? !canGenerate || generating : false}
        >
          {generating ? '生成中．．．' : isLastStep ? '生成する' : '次へ'}
        </button>
      </div>

      {/* ローディング描写 */}
      {generating && (
        <div className='pdf_modal'>
          <div className='spinner'></div>
          <p>物語を生成中．．．</p>
        </div>
      )}

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
  )
}
