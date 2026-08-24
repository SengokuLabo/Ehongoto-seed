

// ぐるぐるモーダル コンポーネント
export default function WaitModal({text}) {
  return (
    <div className='pdf_modal'>
      <div className='spinner'></div>
      <p className='spinner_p'>{text}．．．</p>
    </div>
  )
}
