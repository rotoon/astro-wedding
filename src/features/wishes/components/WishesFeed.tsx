import { useEffect, useRef } from 'react'
import { isConfigured } from '../config'
import { useWishesFeed } from '../hooks'
import { NotConfigured } from './NotConfigured'
import { QueryProvider } from './QueryProvider'
import WishCard from './WishCard'

function Feed() {
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
      <div className='wishes-list'>
        {wishes.map((wish) => (
          <WishCard
            key={wish.id}
            wish={wish}
          />
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
