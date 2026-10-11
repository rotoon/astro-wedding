/** Guestbook settings shared by the islands, the API and the homepage wall */
export const WISHES_COLLECTION = 'wishes'
export const STORAGE_FOLDER = 'wishes'

export const PAGE_SIZE = 10
export const MAX_PHOTOS = 5
export const MAX_PHOTO_MB = 5
export const MAX_NAME_LENGTH = 100
export const MAX_MESSAGE_LENGTH = 2000

/** Uploaded photos are resized client-side to fit this box */
export const PHOTO_MAX_SIZE = 1200
export const PHOTO_QUALITY = 0.8

export const LIKED_STORAGE_KEY = 'likedWishes'

export const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
}

export const emulatorHost = import.meta.env.PUBLIC_FIREBASE_EMULATOR_HOST

/**
 * The Firestore rules don't check photo URLs, so only show photos from our own
 * Storage: a crafted "javascript:" or third-party URL never reaches the page
 */
export const isStoragePhotoURL = (url: string) => {
  try {
    const { protocol, host } = new URL(url)
    if (emulatorHost) return host === `${emulatorHost}:9199`
    return protocol === 'https:' && host === 'firebasestorage.googleapis.com'
  } catch {
    return false
  }
}

/** True when the site was built with a Firebase project configured */
export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
