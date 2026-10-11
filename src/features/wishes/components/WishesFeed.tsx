import { useEffect, useRef, useState } from 'react'
import { isConfigured } from '../config'
import { useWishesFeed } from '../hooks'
import { NotConfigured } from './NotConfigured'
import { QueryProvider } from './QueryProvider'
import WishCard from './WishCard'

// Masonry columns: 1 on phones, 2 from 900px, 3 from 1280px
const COLUMN_QUERIES = ['(min-width: 1280px)', '(min-width: 900px)']

const useColumnCount = () => {
  const count = () => {
    const index = COLUMN_QUERIES.findIndex((query) => window.matchMedia(query).matches)
    return index === -1 ? 1 : COLUMN_QUERIES.length + 1 - index
  }
  const [columns, setColumns] = useState(count)

  useEffect(() => {
    const lists = COLUMN_QUERIES.map((query) => window.matchMedia(query))
    const update = () => setColumns(count())
    lists.forEach((list) => list.addEventListener('change', update))
    return () => lists.forEach((list) => list.removeEventListener('change', update))
  }, [])

  return columns
}

const SKELETON_CARDS = 6

/** Grey placeholder in the shape of a wish card, shown while wishes load */
function SkeletonCard({ withPhoto }: { withPhoto: boolean }) {
  return (
    <div
      className='wish-card wish-skeleton'
      aria-hidden='true'
    >
      <div className='wish-header'>
        <span className='skeleton-block skeleton-avatar' />
        <div className='skeleton-lines'>
          <span className='skeleton-block skeleton-name' />
          <span className='skeleton-block skeleton-date' />
        </div>
      </div>
      <span className='skeleton-block' />
      <span className='skeleton-block skeleton-short' />
      {withPhoto && <span className='skeleton-block skeleton-photo' />}
    </div>
  )
}

/** Placeholder cards laid out in the same columns as the feed */
function Skeletons({ columns, count, label }: { columns: number; count: number; label: string }) {
  return (
    <>
      <p
        className='visually-hidden'
        role='status'
      >
        {label}
      </p>
      <div
        className='wishes-list'
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, column) => (
          <div
            className='wishes-column'
            key={column}
          >
            {Array.from({ length: count }, (_, index) => index)
              .filter((index) => index % columns === column)
              .map((index) => (
                <SkeletonCard
                  key={index}
                  withPhoto={index % 2 === 0}
                />
              ))}
          </div>
        ))}
      </div>
    </>
  )
}

function Feed() {
  const columnCount = useColumnCount()
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useWishesFeed()
  const sentinel = useRef<HTMLDivElement>(null)

  // Infinite scroll: load the next page when the sentinel comes near the viewport
  useEffect(() => {
    const element = sentinel.current
    if (!element || !hasNextPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '400px 0px' }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (isPending) {
    return (
      <Skeletons
        columns={columnCount}
        count={SKELETON_CARDS}
        label='กำลังโหลดคำอวยพร...'
      />
    )
  }

  if (isError) {
    return <p className='wishes-status'>โหลดคำอวยพรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>
  }

  const wishes = data.pages.flatMap((page) => page.wishes)

  if (wishes.length === 0) {
    return <p className='wishes-status'>ยังไม่มีคำอวยพร มาเป็นคนแรกกันเถอะ</p>
  }

  return (
    <>
      <p className='wishes-count'>{wishes.length}{hasNextPage ? '+' : ''} คำอวยพร</p>
      {/* Round-robin into columns so newest-first still reads left to right */}
      <div
        className='wishes-list'
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columnCount }, (_, column) => (
          <div
            className='wishes-column'
            key={column}
          >
            {wishes
              .filter((_, index) => index % columnCount === column)
              .map((wish) => (
                <WishCard
                  key={wish.id}
                  wish={wish}
                />
              ))}
          </div>
        ))}
      </div>
      <div
        ref={sentinel}
        aria-hidden='true'
      />
      {isFetchingNextPage && (
        <div className='wishes-more'>
          <Skeletons
            columns={columnCount}
            count={columnCount}
            label='กำลังโหลดเพิ่มเติม...'
          />
        </div>
      )}
      {!hasNextPage && <p className='wishes-status small'>คุณดูคำอวยพรครบทั้งหมดแล้ว ♥</p>}
    </>
  )
}

/** /wishes island: live, infinitely scrolling guestbook */
export default function WishesFeed() {
  if (!isConfigured) return <NotConfigured />
  return (
    <QueryProvider>
      <Feed />
    </QueryProvider>
  )
}
