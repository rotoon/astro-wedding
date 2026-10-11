/** Shown when the site was built without the PUBLIC_FIREBASE_* env vars */
export function NotConfigured() {
  return (
    <p className='wishes-status'>
      สมุดอวยพรยังไม่พร้อมใช้งาน
      <br />
      <small>(Guestbook is not configured)</small>
    </p>
  )
}
