import { useRef, useState, type TouchEvent } from 'react'

const SWIPE_DISTANCE = 50 // px

/** Swipeable photo strip for wishes with more than one photo */
export function PhotoCarousel({ photos }: { photos: string[] }) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const go = (step: number) =>
    setIndex((current) => (current + step + photos.length) % photos.length)

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0].clientX
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current === null) return
    const distance = touchStartX.current - event.changedTouches[0].clientX
    if (Math.abs(distance) > SWIPE_DISTANCE) go(distance > 0 ? 1 : -1)
    touchStartX.current = null
  }

  return (
    <div
      className='wish-carousel'
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription='carousel'
    >
      <div
        className='wish-carousel-track'
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {photos.map((src, i) => (
          <img
            key={src}
            className='wish-photo'
            src={src}
            alt={`รูปที่ ${i + 1} จาก ${photos.length}`}
            loading='lazy'
            decoding='async'
            draggable={false}
          />
        ))}
      </div>
      <button
        type='button'
        className='wish-carousel-btn prev'
        onClick={(event) => {
          event.stopPropagation()
          go(-1)
        }}
        aria-label='รูปก่อนหน้า'
      >
        ‹
      </button>
      <button
        type='button'
        className='wish-carousel-btn next'
        onClick={(event) => {
          event.stopPropagation()
          go(1)
        }}
        aria-label='รูปถัดไป'
      >
        ›
      </button>
      <div
        className='wish-carousel-dots'
        aria-hidden='true'
      >
        {photos.map((src, i) => (
          <span
            key={src}
            className={i === index ? 'active' : undefined}
          />
        ))}
      </div>
    </div>
  )
}
