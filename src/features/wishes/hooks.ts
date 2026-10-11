import { useEffect, useState } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {
  addWish,
  getWishes,
  likeWish,
  subscribeToLatest,
  type NewWish,
  type Wish,
  type WishCursor,
  type WishPage,
} from './api'
import { LIKED_STORAGE_KEY } from './config'

const WISHES_KEY = ['wishes'] as const

type WishesData = InfiniteData<WishPage, WishCursor | null>

/** Infinite, newest-first feed whose first page stays live via onSnapshot */
export const useWishesFeed = () => {
  const queryClient = useQueryClient()

  useEffect(
    () =>
      subscribeToLatest((latest) => {
        queryClient.setQueryData<WishesData>(WISHES_KEY, (data) => {
          if (!data) return data
          // Merge the live page into the first page instead of replacing it,
          // so a wish pushed past the live window by a new one doesn't vanish
          const latestIds = new Set(latest.map((wish) => wish.id))
          const [first, ...rest] = data.pages
          const firstWishes = [
            ...latest,
            ...first.wishes.filter((wish) => !latestIds.has(wish.id)),
          ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

          return {
            ...data,
            pages: [
              { ...first, wishes: firstWishes },
              ...rest.map((page) => ({
                ...page,
                wishes: page.wishes.filter((wish) => !latestIds.has(wish.id)),
              })),
            ],
          }
        })
      }),
    [queryClient]
  )

  return useInfiniteQuery({
    queryKey: WISHES_KEY,
    queryFn: ({ pageParam }) => getWishes(pageParam),
    initialPageParam: null as WishCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: Infinity, // kept fresh by the live subscription
  })
}

export const useAddWish = () =>
  useMutation({ mutationFn: (wish: NewWish) => addWish(wish) })

// ---------- Likes (one per wish per browser) ----------

const readLiked = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(LIKED_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

const rememberLiked = (wishId: string) => {
  try {
    const liked = readLiked()
    if (!liked.includes(wishId)) {
      localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...liked, wishId]))
    }
  } catch {
    // Private mode / storage disabled: the like still counts, it just isn't remembered
  }
}

const bumpReactions = (data: WishesData | undefined, wishId: string) =>
  data && {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      wishes: page.wishes.map((wish: Wish) =>
        wish.id === wishId ? { ...wish, reactions: wish.reactions + 1 } : wish
      ),
    })),
  }

/** Whether this browser already liked the wish, and a like() that counts once */
export const useLike = (wishId: string) => {
  const queryClient = useQueryClient()
  const [liked, setLiked] = useState(() => readLiked().includes(wishId))

  const mutation = useMutation({
    mutationFn: () => likeWish(wishId),
    onMutate: () => {
      // Optimistic: show the like immediately, even if the network is slow
      setLiked(true)
      rememberLiked(wishId)
      queryClient.setQueryData<WishesData>(WISHES_KEY, (data) =>
        bumpReactions(data, wishId)
      )
    },
    onError: (error) => console.error('Like failed:', error),
  })

  const like = () => {
    if (!liked && !mutation.isPending) mutation.mutate()
  }

  return { liked, like }
}
