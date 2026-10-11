import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { celebrate } from '../celebrate'
import {
  isConfigured,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PHOTOS,
} from '../config'
import { useAddWish } from '../hooks'
import { validatePhoto } from '../image'
import { NotConfigured } from './NotConfigured'
import { QueryProvider } from './QueryProvider'

const REDIRECT_DELAY_MS = 1500 // let the confetti play before going back to the feed

interface Photo {
  file: File
  preview: string
}

function Form({ backHref }: { backHref: string }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const { mutate, isPending } = useAddWish()

  // Release preview object URLs when photos are removed or the form unmounts
  const photosRef = useRef(photos)
  photosRef.current = photos
  useEffect(
    () => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview)),
    []
  )

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = '' // allow picking the same file again
    if (files.length === 0) return

    const invalid = files.map(validatePhoto).find(Boolean)
    if (invalid) {
      setError(invalid)
      return
    }
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`อัปโหลดได้สูงสุด ${MAX_PHOTOS} รูป`)
      return
    }

    setError('')
    setPhotos((current) => [
      ...current,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ])
  }

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].preview)
      return current.filter((_, i) => i !== index)
    })
  }

  const submit = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    if (!name.trim() || !message.trim()) {
      setError('กรุณากรอกชื่อและข้อความ')
      return
    }

    setError('')
    mutate(
      { name, message, photos: photos.map((photo) => photo.file) },
      {
        onSuccess: () => {
          setSent(true)
          celebrate()
          setTimeout(() => window.location.assign(backHref), REDIRECT_DELAY_MS)
        },
        onError: (err) =>
          setError(err instanceof Error ? err.message : 'ส่งคำอวยพรไม่สำเร็จ กรุณาลองใหม่'),
      }
    )
  }

  if (sent) {
    return (
      <p
        className='wishes-status sent'
        role='status'
      >
        ขอบคุณสำหรับคำอวยพรนะ ♥
      </p>
    )
  }

  return (
    <form
      className='wish-form'
      onSubmit={submit}
      noValidate
    >
      <label className='wish-field'>
        <span>ชื่อ / Name</span>
        <input
          type='text'
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder='ชื่อของคุณ'
          autoComplete='name'
          required
        />
      </label>

      <label className='wish-field'>
        <span>ข้อความ / Message</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder='เขียนคำอวยพรถึงบ่าวสาว'
          rows={5}
          required
        />
        <small className='wish-counter'>
          {message.length}/{MAX_MESSAGE_LENGTH}
        </small>
      </label>

      <div className='wish-field'>
        <span>
          เพิ่มรูป (ไม่บังคับ) · สูงสุด {MAX_PHOTOS} รูป
        </span>
        <input
          ref={fileInput}
          id='wish-photos'
          className='visually-hidden'
          type='file'
          accept='image/*'
          multiple
          onChange={addPhotos}
          disabled={photos.length >= MAX_PHOTOS}
        />
        <label
          htmlFor='wish-photos'
          className={`wish-photo-picker${photos.length >= MAX_PHOTOS ? ' disabled' : ''}`}
        >
          + เลือกรูปภาพ / Choose photos
        </label>

        {photos.length > 0 && (
          <ul className='wish-previews'>
            {photos.map((photo, index) => (
              <li key={photo.preview}>
                <img
                  src={photo.preview}
                  alt={`รูปที่ ${index + 1}`}
                />
                <button
                  type='button'
                  onClick={() => removePhoto(index)}
                  aria-label={`ลบรูปที่ ${index + 1}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p
          className='wish-error'
          role='alert'
        >
          {error}
        </p>
      )}

      <div className='wish-actions'>
        <a
          className='wish-btn secondary'
          href={backHref}
        >
          ย้อนกลับ
        </a>
        <button
          type='submit'
          className='wish-btn primary'
          disabled={isPending}
        >
          {isPending ? 'กำลังส่ง...' : 'ส่งคำอวยพร'}
        </button>
      </div>
    </form>
  )
}

/** /wishes/new island */
export default function AddWishForm({ backHref = '/wishes' }: { backHref?: string }) {
  if (!isConfigured) return <NotConfigured />
  return (
    <QueryProvider>
      <Form backHref={backHref} />
    </QueryProvider>
  )
}
