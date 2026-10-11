import { memo, useRef } from 'react'
import type { Wish } from '../api'
import { popHeart } from '../celebrate'
import { useLike } from '../hooks'
import { relativeTime } from '../time'
import { HeartIcon } from './HeartIcon'
import { PhotoCarousel } from './PhotoCarousel'

const DOUBLE_TAP_MS = 300

function WishCard({ wish }: { wish: Wish }) {
  const { liked, like } = useLike(wish.id)
  const lastTap = useRef(0)

  const handleLike = () => {
    if (liked) return
    like()
    popHeart()
  }

  // Double-tap (or double-click) a photo to like, Instagram style
  const handlePhotoTap = () => {
    const now = Date.now()
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      handleLike()
      lastTap.current = 0
    } else {
      lastTap.current = now
    }
  }

  const initial = wish.name.trim().charAt(0).toUpperCase() || '♥'

  return (
    <article
      className='wish-card'
      id={`wish-${wish.id}`}
    >
      <header className='wish-header'>
        <div
          className='wish-avatar'
          aria-hidden='true'
        >
          {initial}
        </div>
        <div>
          <h3 className='wish-author'>{wish.name}</h3>
          <time
            className='wish-date'
            dateTime={wish.createdAt.toISOString()}
          >
            {relativeTime(wish.createdAt)}
          </time>
        </div>
      </header>

      <p className='wish-message'>{wish.message}</p>

      {wish.photoURLs.length > 0 && (
        <div
          className='wish-photos'
          onClick={handlePhotoTap}
        >
          {wish.photoURLs.length > 1 ? (
            <PhotoCarousel photos={wish.photoURLs} />
          ) : (
            <img
              className='wish-photo'
              src={wish.photoURLs[0]}
              alt={`รูปจาก ${wish.name}`}
              loading='lazy'
              decoding='async'
            />
          )}
        </div>
      )}

      <footer className='wish-footer'>
        <button
          type='button'
          className={`wish-like${liked ? ' liked' : ''}`}
          onClick={handleLike}
          aria-pressed={liked}
          aria-label={liked ? `ถูกใจแล้ว (${wish.reactions})` : `ถูกใจ (${wish.reactions})`}
        >
          <HeartIcon />
          <span>{wish.reactions}</span>
        </button>
      </footer>
    </article>
  )
}

export default memo(WishCard)
