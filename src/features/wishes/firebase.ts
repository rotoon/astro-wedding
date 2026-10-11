import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { emulatorHost, firebaseConfig } from './config'

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const storage = getStorage(app)

if (emulatorHost) {
  connectFirestoreEmulator(db, emulatorHost, 8080)
  connectStorageEmulator(storage, emulatorHost, 9199)
}
