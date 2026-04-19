'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './album.module.css'


type Album = {
  id: string
  name: string
  emoji: string
  space_id: string
}

type Space = {
  id: string
  name: string
  code: string
  upload_permission: string
  owner_id: string
}

type Photo = {
  id: string
  storage_path: string
  uploaded_by: string
  created_at: string
  file_type: string
  url?: string
}

const MAX_FILE_SIZE = 50 * 1024 * 1024

export default function AlbumPage() {
  const { code, albumId } = useParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [album, setAlbum] = useState<Album | null>(null)
  const [space, setSpace] = useState<Space | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [showDeleteAlbum, setShowDeleteAlbum] = useState(false)
  const [deleteAlbumInput, setDeleteAlbumInput] = useState('')
  const [deletingAlbum, setDeletingAlbum] = useState(false)
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null)

  const lightbox = lightboxIndex !== null ? photos[lightboxIndex] : null
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reportSent, setReportSent] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthReady(true)
    })
  }, [])

  useEffect(() => {
    if (authReady && albumId && code) fetchData()
  }, [authReady, albumId, code])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return
    if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? Math.min(i + 1, photos.length - 1) : null)
    if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null)
    if (e.key === 'Escape') setLightboxIndex(null)
  }, [lightboxIndex, photos.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  async function fetchData() {
    setLoading(true)
    const { data: albumData } = await supabase.from('albums').select('*').eq('id', albumId).single()
    if (!albumData) { setLoading(false); return }
    setAlbum(albumData)
    const { data: spaceData } = await supabase.from('spaces').select('*').eq('id', albumData.space_id).single()
    if (spaceData) setSpace(spaceData)
    await fetchPhotos()
    setLoading(false)
  }

  async function fetchPhotos() {
    const { data } = await supabase.from('photos').select('*').eq('album_id', albumId).order('created_at', { ascending: false })
    if (!data) return
    const withUrls = await Promise.all(
      data.map(async (photo) => {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(photo.storage_path)
        return { ...photo, url: urlData.publicUrl }
      })
    )
    setPhotos(withUrls)
  }

async function handleReport() {
  if (!lightbox) return
  setReporting(true)
  await supabase.from('reports').insert({
    photo_id: lightbox.id,
    space_id: space?.id,
    reported_by: user?.id || null,
    reason: reportReason.trim() || 'No reason given',
  })
  setReporting(false)
  setReportSent(true)
  setTimeout(() => {
    setShowReport(false)
    setReportSent(false)
    setReportReason('')
  }, 2000)
}

  function canUpload() {
    if (!space) return false
    const isOwner = user?.id === space.owner_id
    if (isOwner) return true
    if (space.upload_permission === 'owner_only') return false
    if (space.upload_permission === 'code_and_auth') return !!user
    if (space.upload_permission === 'code_only') return true
    return false
  }

  const isOwner = user?.id === space?.owner_id

  async function handleFiles(files: FileList) {
    if (!canUpload() || !album || !space) return
    setUploadError('')
    setUploading(true)
    setUploadProgress([])
    const validFiles = Array.from(files).filter(file => {
      if (file.size > MAX_FILE_SIZE) { setUploadError(file.name + ' is too large. Max 50MB.'); return false }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) { setUploadError(file.name + ' is not supported.'); return false }
      return true
    })
    for (const file of validFiles) {
      const ext = file.name.split('.').pop()
      const fileName = space.id + '/' + album.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
      setUploadProgress(prev => [...prev, 'uploading ' + file.name + '...'])
      const { error: uploadErr } = await supabase.storage.from('photos').upload(fileName, file)
      if (uploadErr) { setUploadError('Failed to upload ' + file.name); continue }
      await supabase.from('photos').insert({
        album_id: album.id,
        space_id: space.id,
        storage_path: fileName,
        uploaded_by: uploadName.trim() || user?.email || 'Anonymous',
        file_type: file.type,
      })
      setUploadProgress(prev => [...prev.slice(0, -1), 'done: ' + file.name])
    }
    await fetchPhotos()
    setUploading(false)
    setTimeout(() => setUploadProgress([]), 3000)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }

  async function handleDeletePhoto(photo: Photo) {
    if (!isOwner) return
    setDeletingPhoto(photo.id)
    await supabase.storage.from('photos').remove([photo.storage_path])
    await supabase.from('photos').delete().eq('id', photo.id)
    setLightboxIndex(null)
    await fetchPhotos()
    setDeletingPhoto(null)
  }

  async function handleDeleteAlbum() {
    if (!album || !isOwner) return
    setDeletingAlbum(true)
    const { data: albumPhotos } = await supabase.from('photos').select('storage_path').eq('album_id', album.id)
    if (albumPhotos && albumPhotos.length > 0) {
      const paths = albumPhotos.map(p => p.storage_path)
      await supabase.storage.from('photos').remove(paths)
    }
    await supabase.from('photos').delete().eq('album_id', album.id)
    await supabase.from('albums').delete().eq('id', album.id)
    router.push('/space/' + code)
  }

  function isVideo(photo: Photo) {
    return photo.file_type?.startsWith('video/')
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  function goLeft() {
    setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null)
  }

  function goRight() {
    setLightboxIndex(i => i !== null ? Math.min(i + 1, photos.length - 1) : null)
  }

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingLogo}>momento</div>
      <div className={styles.loadingDots}><span /><span /><span /></div>
    </div>
  )

  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.logo} onClick={() => router.push('/')}>momento</div>
        <div className={styles.navRight}>
          <button className={styles.backBtn} onClick={() => router.push('/space/' + code)}>
            back to space
          </button>
          {canUpload() && (
            <button className={styles.btnLime} onClick={() => fileInputRef.current?.click()}>
              + upload
            </button>
          )}
        </div>
      </nav>

      <div className={styles.albumHeader}>
        <div className={styles.albumHeaderInner}>
          <div className={styles.albumEmojiWrap}>
            <span>{album?.emoji}</span>
          </div>
          <div className={styles.albumTitleBlock}>
            <h1 className={styles.albumName}>{album?.name}</h1>
            <p className={styles.albumMeta}>{photos.length} {photos.length === 1 ? 'item' : 'items'} · {space?.name}</p>
          </div>
          {isOwner && (
            <button className={styles.btnDanger} onClick={() => setShowDeleteAlbum(true)}>
              delete album
            </button>
          )}
        </div>
      </div>

      {canUpload() && (
        <div className={styles.uploadZoneWrap}>
          <div
            className={styles.uploadZone + (dragOver ? ' ' + styles.uploadZoneDrag : '')}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.uploadZoneText}>{uploading ? 'uploading...' : 'drag and drop or click to upload'}</div>
            <div className={styles.uploadZoneSub}>photos and videos up to 50MB each</div>
            {!user && (
              <input
                className={styles.uploadNameInput}
                placeholder="your name (optional)"
                value={uploadName}
                onChange={(e) => { e.stopPropagation(); setUploadName(e.target.value) }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
          {uploadProgress.length > 0 && (
            <div className={styles.progressList}>
              {uploadProgress.map((msg, i) => (
                <div key={i} className={styles.progressItem}>{msg}</div>
              ))}
            </div>
          )}
          {uploadError && <div className={styles.uploadError}>{uploadError}</div>}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <div className={styles.body}>
        {photos.length === 0 && !uploading && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📷</div>
            <h3 className={styles.emptyTitle}>no photos yet</h3>
            <p className={styles.emptySub}>{canUpload() ? 'Be the first to upload!' : 'Nothing here yet.'}</p>
          </div>
        )}
        <div className={styles.photoGrid}>
          {photos.map((photo, index) => (
            <div key={photo.id} className={styles.photoCell} onClick={() => setLightboxIndex(index)}>
              {isVideo(photo) ? (
                <div className={styles.videoThumb}>
                  <video src={photo.url} className={styles.videoThumbEl} muted />
                  <div className={styles.playIcon}>▶</div>
                </div>
              ) : (
                <img src={photo.url} alt="" className={styles.photoImg} loading="lazy" />
              )}
              <div className={styles.photoOverlay}>
                <span className={styles.photoUploader}>{photo.uploaded_by}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

{lightbox && lightboxIndex !== null && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxIndex(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxIndex(null)}>x</button>

          <button
            className={styles.lightboxNavLeft}
            onClick={(e) => { e.stopPropagation(); goLeft() }}
            style={{ opacity: lightboxIndex === 0 ? 0.2 : 1 }}
          >
            left
          </button>

          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            {isVideo(lightbox) ? (
              <video src={lightbox.url} controls autoPlay className={styles.lightboxMedia} />
            ) : (
              <img src={lightbox.url} alt="" className={styles.lightboxMedia} />
            )}
            <div className={styles.lightboxInfo}>
              <span className={styles.lightboxUploader}>{lightbox.uploaded_by}</span>
              <span className={styles.lightboxDate}>{formatDate(lightbox.created_at)}</span>
              <span className={styles.lightboxCounter}>{lightboxIndex + 1} / {photos.length}</span>
              <a href={lightbox.url} download className={styles.lightboxDownload} onClick={(e) => e.stopPropagation()}>download</a>
              {isOwner && (
                <button
                  className={styles.lightboxDelete}
                  onClick={(e) => { e.stopPropagation(); handleDeletePhoto(lightbox) }}
                  disabled={deletingPhoto === lightbox.id}
                >
                  {deletingPhoto === lightbox.id ? 'deleting...' : 'delete'}
                </button>
              )}
              <button
                className={styles.reportBtn}
                onClick={(e) => { e.stopPropagation(); setShowReport(true) }}
              >
                report
              </button>
            </div>

            {showReport && (
              <div className={styles.reportModal} onClick={(e) => e.stopPropagation()}>
                {reportSent ? (
                  <div className={styles.reportSent}>✓ reported — we'll review it shortly</div>
                ) : (
                  <>
                    <div className={styles.reportTitle}>report this photo</div>
                    <textarea
                      className={styles.reportInput}
                      placeholder="why are you reporting this? (optional)"
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                      rows={3}
                    />
                    <div className={styles.reportBtns}>
                      <button className={styles.reportCancelBtn} onClick={() => setShowReport(false)}>cancel</button>
                      <button className={styles.reportSubmitBtn} onClick={handleReport} disabled={reporting}>
                        {reporting ? 'sending...' : 'submit report'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            className={styles.lightboxNavRight}
            onClick={(e) => { e.stopPropagation(); goRight() }}
            style={{ opacity: lightboxIndex === photos.length - 1 ? 0.2 : 1 }}
          >
            right
          </button>
        </div>
      )}
      {showDeleteAlbum && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteAlbum(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteWarningIcon}>!</div>
            <h2 className={styles.formTitle}>delete this album?</h2>
            <p className={styles.formSub}>
              This will permanently delete <strong>{album?.name}</strong> and all {photos.length} files inside it. This cannot be undone.
            </p>
            <label className={styles.label}>Type the album name to confirm</label>
            <input
              className={styles.input}
              value={deleteAlbumInput}
              onChange={(e) => setDeleteAlbumInput(e.target.value)}
              placeholder={album?.name}
            />
            <div className={styles.formBtns}>
              <button className={styles.btnOutline} onClick={() => { setShowDeleteAlbum(false); setDeleteAlbumInput('') }}>
                cancel
              </button>
              <button
                className={styles.btnDangerFull}
                onClick={handleDeleteAlbum}
                disabled={deleteAlbumInput !== album?.name || deletingAlbum}
              >
                {deletingAlbum ? 'deleting...' : 'permanently delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}