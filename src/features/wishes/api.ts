import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import {
  isStoragePhotoURL,
  MAX_PHOTOS,
  PAGE_SIZE,
  STORAGE_FOLDER,
  WISHES_COLLECTION,
} from './config'
import { db, storage } from './firebase'
import { resizePhoto, validatePhoto } from './image'

export interface Wish {
  id: string
  name: string
  message: string
  photoURLs: string[]
  createdAt: Date
  reactions: number
}

export interface NewWish {
  name: string
  message: string
  photos: File[]
}

export type WishCursor = QueryDocumentSnapshot<DocumentData>

export interface WishPage {
  wishes: Wish[]
  /** Pass to the next getWishes() call; null when there are no more pages */
  nextCursor: WishCursor | null
}

const wishesRef = collection(db, WISHES_COLLECTION)

const toWish = (snapshot: WishCursor): Wish => {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    name: data.name ?? '',
    message: data.message ?? '',
    // Older wishes may have no photos (null) or a single legacy `photoURL`
    photoURLs: (Array.isArray(data.photoURLs)
      ? data.photoURLs
      : data.photoURL
        ? [data.photoURL]
        : []
    ).filter((url: unknown) => typeof url === 'string' && isStoragePhotoURL(url)),
    // null for a moment while serverTimestamp() is pending on a fresh local write
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    reactions: data.reactions ?? 0,
  }
}

const newestFirst = (pageSize: number, after?: WishCursor | null) =>
  after
    ? query(wishesRef, orderBy('createdAt', 'desc'), startAfter(after), limit(pageSize))
    : query(wishesRef, orderBy('createdAt', 'desc'), limit(pageSize))

/** One page of wishes, newest first */
export const getWishes = async (
  after: WishCursor | null = null,
  pageSize = PAGE_SIZE
): Promise<WishPage> => {
  const snapshot = await getDocs(newestFirst(pageSize, after))
  const docs = snapshot.docs

  return {
    wishes: docs.map(toWish),
    nextCursor: docs.length === pageSize ? docs[docs.length - 1] : null,
  }
}

/** Live updates of the newest page; returns the unsubscribe function */
export const subscribeToLatest = (
  onChange: (wishes: Wish[]) => void,
  pageSize = PAGE_SIZE
) =>
  onSnapshot(
    newestFirst(pageSize),
    (snapshot) => onChange(snapshot.docs.map(toWish)),
    (error) => console.error('Wishes subscription failed:', error)
  )

const uploadPhoto = async (photo: File): Promise<string> => {
  const blob = await resizePhoto(photo)
  const safeName = photo.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const photoRef = ref(storage, `${STORAGE_FOLDER}/${Date.now()}_${safeName}`)

  const result = await uploadBytes(photoRef, blob, {
    contentType: blob.type,
    customMetadata: { originalName: photo.name, uploadedBy: 'wedding-guest' },
  })
  return getDownloadURL(result.ref)
}

/** Uploads the photos (resized) and stores the wish; returns its id */
export const addWish = async ({ name, message, photos }: NewWish): Promise<string> => {
  const validPhotos = photos.filter((photo) => !validatePhoto(photo)).slice(0, MAX_PHOTOS)

  const uploads = await Promise.allSettled(validPhotos.map(uploadPhoto))
  const photoURLs = uploads.flatMap((upload) =>
    upload.status === 'fulfilled' ? [upload.value] : []
  )

  if (validPhotos.length > 0 && photoURLs.length === 0) {
    throw new Error('อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  }

  const created = await addDoc(wishesRef, {
    name: name.trim(),
    message: message.trim(),
    photoURLs: photoURLs.length > 0 ? photoURLs : null,
    reactions: 0,
    // Server time: a guest's fast device clock can't make the write fail the rules
    createdAt: serverTimestamp(),
  })
  return created.id
}

/** +1 like (the Firestore rules only allow increments of exactly one) */
export const likeWish = (wishId: string) =>
  updateDoc(doc(db, WISHES_COLLECTION, wishId), { reactions: increment(1) })
