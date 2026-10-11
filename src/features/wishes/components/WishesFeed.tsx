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
      <p
        className='wishes-status'
        role='status'
      >
        <span className='wishes-spinner' /> กำลังโหลดคำอวยพร...
      </p>
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
        <p
          className='wishes-status'
          role='status'
        >
          <span className='wishes-spinner' /> กำลังโหลดเพิ่มเติม...
        </p>
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
