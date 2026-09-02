

// 待機モーダル コンポーネント
export default function WaitModal({text}) {
  return (
    <div className='modal_wait'>
      <div className='spinner'>
        <img src='/media/logos/EhongotoSeed.png' alt='えほんごとのたね' />
      </div>
      <p>{text}...</p>
    </div>
  )
}
