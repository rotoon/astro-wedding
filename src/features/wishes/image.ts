import { MAX_PHOTO_MB, PHOTO_MAX_SIZE, PHOTO_QUALITY } from './config'

/** Returns an error message for files we refuse to upload, or null if fine */
export const validatePhoto = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return 'กรุณาเลือกรูปภาพเท่านั้น (JPEG, PNG, WebP หรือ GIF)'
  }
  if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
    return `ขนาดไฟล์แต่ละรูปต้องไม่เกิน ${MAX_PHOTO_MB}MB`
  }
  return null
}

/** Scales an image down to fit PHOTO_MAX_SIZE (keeping aspect ratio) and re-encodes it */
export const resizePhoto = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const scale = Math.min(1, PHOTO_MAX_SIZE / img.width, PHOTO_MAX_SIZE / img.height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Could not create canvas context'))
        return
      }

      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blob)
          else reject(new Error('Failed to encode image'))
        },
        // GIFs can't be re-encoded as GIF by canvas; JPEG keeps them small
        file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg',
        PHOTO_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }

    img.src = url
  })
