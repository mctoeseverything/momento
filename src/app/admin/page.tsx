'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './admin.module.css'

type Space = {
  id: string
  name: string
  emoji: string
  code: string
  created_at: string
  owner_id: string
  owner_email?: string
}

type Photo = {
  id: string
  storage_path: string
  uploaded_by: string
  created_at: string
  file_type: string
  album_id: string
  space_id: string
  url?: string
  space_name?: string
  album_name?: string
}

type Report = {
  id: string
  photo_id: string
  space_id: string
  reason: string
  resolved: boolean
  created_at: string
  reported_by: string
  reporter_email?: string
  photo?: {
    id: string
    storage_path: string
    uploaded_by: string
    file_type: string
    album_id: string
    space_id: string
    url?: string
  } | null
  space?: {
    name: string
    code: string
  } | null
  album?: {
    id: string
    name: string
  } | null
}

type UserProfile = {
  id: string
  email: string
  display_name: string
  is_admin: boolean
  onboarded: boolean
  created_at: string
}

type Tab = 'overview' | 'spaces' | 'photos' | 'users' | 'reports'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState({ spaces: 0, photos: 0, users: 0, reports: 0 })
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ type: string, id: string, name: string } | null>(null)
  const [confirmTerminate, setConfirmTerminate] = useState<UserProfile | null>(null)
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState('')
  const [reportMoreInfo, setReportMoreInfo] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) { router.push('/'); return }
      setUser(data.session.user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.session.user.id)
        .single()
      if (!profile?.is_admin) { router.push('/'); return }
      setIsAdmin(true)
      await fetchAll()
      setLoading(false)
    })
  }, [])

  async function fetchAll() {
    await Promise.all([fetchStats(), fetchSpaces(), fetchPhotos(), fetchUsers(), fetchReports()])
  }

  async function fetchStats() {
    const [{ count: spacesCount }, { count: photosCount }, { count: usersCount }, { count: reportsCount }] = await Promise.all([
      supabase.from('spaces').select('*', { count: 'exact', head: true }),
      supabase.from('photos').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('resolved', false),
    ])
    setStats({
      spaces: spacesCount || 0,
      photos: photosCount || 0,
      users: usersCount || 0,
      reports: reportsCount || 0,
    })
  }

 async function fetchSpaces() {
  const { data } = await supabase
    .from('spaces')
    .select('*')
    .eq('terminated', false)
    .order('created_at', { ascending: false })
    .limit(100)
  if (!data) return
  const withEmails = await Promise.all(data.map(async space => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', space.owner_id)
      .single()
    return { ...space, owner_email: profile?.display_name || 'Unknown' }
  }))
  setSpaces(withEmails)
}

  async function fetchPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (!data) return
    const withUrls = await Promise.all(data.map(async photo => {
      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(photo.storage_path)
      return { ...photo, url: urlData.publicUrl }
    }))
    setPhotos(withUrls)
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setUsers(data || [])
  }

async function fetchReports() {
  const { data } = await supabase
    .from('reports')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  if (!data) { setReports([]); return }

  const enriched = await Promise.all(data.map(async report => {
    // Get photo
    let photoWithUrl = null
    if (report.photo_id) {
      const { data: photo } = await supabase
        .from('photos')
        .select('*')
        .eq('id', report.photo_id)
        .single()
      if (photo) {
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(photo.storage_path)
        photoWithUrl = { ...photo, url: urlData.publicUrl }
      }
    }

    // Get space
    let space = null
    if (report.space_id) {
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('name, code')
        .eq('id', report.space_id)
        .single()
      space = spaceData
    }

    // Get album
    let album = null
    if (photoWithUrl?.album_id) {
      const { data: albumData } = await supabase
        .from('albums')
        .select('id, name')
        .eq('id', photoWithUrl.album_id)
        .single()
      album = albumData
    }

    // Get reporter email
    let reporter_email = 'Anonymous'
    if (report.reported_by) {
      const { data: emailData } = await supabase
        .rpc('get_user_email', { user_id: report.reported_by })
      if (emailData) reporter_email = emailData
    }

    return { ...report, photo: photoWithUrl, space, album, reporter_email }
  }))

  setReports(enriched)
}

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleDeletePhoto(photo: Photo) {
    setWorking(true)
    await supabase.storage.from('photos').remove([photo.storage_path])
    await supabase.from('photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    setStats(prev => ({ ...prev, photos: prev.photos - 1 }))
    setConfirmDelete(null)
    showToast('Photo deleted.')
    setWorking(false)
  }

  async function handleDeleteAlbum(albumId: string) {
    setWorking(true)
    const { data: albumPhotos } = await supabase.from('photos').select('storage_path').eq('album_id', albumId)
    if (albumPhotos && albumPhotos.length > 0) {
      await supabase.storage.from('photos').remove(albumPhotos.map(p => p.storage_path))
    }
    await supabase.from('photos').delete().eq('album_id', albumId)
    await supabase.from('albums').delete().eq('id', albumId)
    setConfirmDelete(null)
    showToast('Album deleted.')
    await fetchPhotos()
    setWorking(false)
  }

async function handleDeleteSpace(spaceId: string) {
  setWorking(true)
  const { data: spacePhotos } = await supabase.from('photos').select('storage_path').eq('space_id', spaceId)
  if (spacePhotos && spacePhotos.length > 0) {
    await supabase.storage.from('photos').remove(spacePhotos.map(p => p.storage_path))
  }
  await supabase.from('photos').delete().eq('space_id', spaceId)
  await supabase.from('albums').delete().eq('space_id', spaceId)
  await supabase.from('space_members').delete().eq('space_id', spaceId)
  await supabase.from('spaces').update({ terminated: true }).eq('id', spaceId)
  setSpaces(prev => prev.filter(s => s.id !== spaceId))
  setStats(prev => ({ ...prev, spaces: prev.spaces - 1 }))
  setConfirmDelete(null)
  showToast('Space terminated.')
  router.refresh()
  setWorking(false)
}

 async function handleTerminateUser(userId: string) {
  setWorking(true)

  const { data: userSpaces } = await supabase
    .from('spaces')
    .select('id')
    .eq('owner_id', userId)

  if (userSpaces) {
    for (const space of userSpaces) {
      await handleDeleteSpace(space.id)
    }
  }

  await supabase.from('space_members').delete().eq('user_id', userId)

  // Mark as restricted — keeps the profile so we can block them on login
  await supabase.from('profiles').upsert({
    id: userId,
    restricted: true,
  })

  setUsers(prev => prev.filter(u => u.id !== userId))
  setConfirmTerminate(null)
  showToast('Account terminated.')
  setWorking(false)
}

  async function handleResolveReport(reportId: string) {
    await supabase.from('reports').update({ resolved: true }).eq('id', reportId)
    setReports(prev => prev.filter(r => r.id !== reportId))
    showToast('Report resolved.')
  }

  const filteredSpaces = spaces.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))
  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()) || u.display_name?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingLogo}>momento</div>
      <div className={styles.loadingDots}><span /><span /><span /></div>
    </div>
  )

  if (!isAdmin) return null

  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <div className={styles.logo} onClick={() => router.push('/')}>momento</div>
          <span className={styles.adminBadge}>admin</span>
        </div>
        <button className={styles.btnOutlineSmall} onClick={() => router.push('/')}>exit admin</button>
      </nav>

      <div className={styles.tabs}>
        {(['overview', 'spaces', 'photos', 'users', 'reports'] as Tab[]).map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t === 'reports' && stats.reports > 0 && (
              <span className={styles.reportsBadge}>{stats.reports}</span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.body}>

        {tab === 'overview' && (
          <div>
            <h1 className={styles.pageTitle}>overview</h1>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNum}>{stats.spaces}</div>
                <div className={styles.statLabel}>total spaces</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNum}>{stats.photos}</div>
                <div className={styles.statLabel}>total photos</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNum}>{stats.users}</div>
                <div className={styles.statLabel}>total users</div>
              </div>
              <div className={styles.statCard} style={{ borderColor: stats.reports > 0 ? '#cc0000' : undefined }}>
                <div className={styles.statNum} style={{ color: stats.reports > 0 ? '#cc0000' : undefined }}>{stats.reports}</div>
                <div className={styles.statLabel}>open reports</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'spaces' && (
          <div>
            <div className={styles.sectionHeader}>
              <h1 className={styles.pageTitle}>spaces</h1>
              <input className={styles.searchInput} placeholder="search by name or code..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>space</th>
                    <th>code</th>
                    <th>owner</th>
                    <th>created</th>
                    <th>actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpaces.map(space => (
                    <tr key={space.id}>
                      <td>
                        <span className={styles.spaceEmoji}>{space.emoji}</span>
                        {space.name}
                      </td>
                      <td><span className={styles.codeChip}>{space.code}</span></td>
                      <td>{space.owner_email}</td>
                      <td>{new Date(space.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button className={styles.btnView} onClick={() => router.push('/space/' + space.code)}>view</button>
                          <button className={styles.btnDelete} onClick={() => setConfirmDelete({ type: 'space', id: space.id, name: space.name })}>delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'photos' && (
          <div>
            <h1 className={styles.pageTitle}>photos</h1>
            <div className={styles.photoGrid}>
              {photos.map(photo => (
                <div key={photo.id} className={styles.photoCell}>
                  {photo.file_type?.startsWith('video/') ? (
                    <video src={photo.url} className={styles.photoImg} muted />
                  ) : (
                    <img src={photo.url} alt="" className={styles.photoImg} loading="lazy" />
                  )}
                  <div className={styles.photoOverlay}>
                    <span className={styles.photoUploader}>{photo.uploaded_by}</span>
                    <button className={styles.photoDeleteBtn} onClick={() => setConfirmDelete({ type: 'photo', id: photo.id, name: 'this photo' })}>delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <div className={styles.sectionHeader}>
              <h1 className={styles.pageTitle}>users</h1>
              <input className={styles.searchInput} placeholder="search by email or name..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>user</th>
                    <th>email</th>
                    <th>joined</th>
                    <th>actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className={styles.userRow}>
                          <div className={styles.userAvatar}>{u.display_name?.[0]?.toUpperCase() || '?'}</div>
                          <span>{u.display_name || 'No name'}</span>
                          {u.is_admin && <span className={styles.adminChip}>admin</span>}
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        {!u.is_admin && (
                          <button className={styles.btnDelete} onClick={() => setConfirmTerminate(u)}>terminate</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

   {tab === 'reports' && (
  <div>
    <h1 className={styles.pageTitle}>reports</h1>
    {reports.length === 0 ? (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>✦</div>
        <h3 className={styles.emptyTitle}>no open reports</h3>
        <p className={styles.emptySub}>You're all caught up!</p>
      </div>
    ) : (
      <div className={styles.reportsList}>
        {reports.map(report => (
          <div key={report.id} className={styles.reportCard}>

            <div className={styles.reportPhotoWrap}>
              {report.photo ? (
                report.photo.file_type?.startsWith('video/') ? (
                  <video src={report.photo.url} className={styles.reportPhoto} muted />
                ) : (
                  <img src={report.photo.url} alt="" className={styles.reportPhoto} />
                )
              ) : (
                <div className={styles.reportPhotoMissing}>deleted</div>
              )}
            </div>

            <div className={styles.reportInfo}>
              <div className={styles.reportReason}>
                {report.reason || 'No reason given'}
              </div>
              <div className={styles.reportMetaRow}>
                <span className={styles.reportMetaItem}>
                  reported by <strong>{report.reporter_email}</strong>
                </span>
              </div>
              <div className={styles.reportMetaRow}>
                <span className={styles.reportMetaItem}>
                  {new Date(report.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
              {report.space && (
                <div className={styles.reportMetaRow}>
                  <span className={styles.reportMetaItem}>
                    space: <strong>{report.space.name}</strong>
                  </span>
                  {report.album && (
                    <>
                      <span className={styles.reportMetaDot}>·</span>
                      <span className={styles.reportMetaItem}>
                        album: <strong>{report.album.name}</strong>
                      </span>
                    </>
                  )}
                </div>
              )}
              {report.photo && (
                <div className={styles.reportMetaRow}>
                  <span className={styles.reportMetaItem}>
                    uploaded by <strong>{report.photo.uploaded_by}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className={styles.reportActions}>
              <div className={styles.reportActionsTop}>
                <button
                  className={styles.btnView}
                  onClick={() => handleResolveReport(report.id)}
                >
                  resolve
                </button>
                {report.photo && (
                  <button
                    className={styles.btnDelete}
                    onClick={() => setConfirmDelete({
                      type: 'photo',
                      id: report.photo!.id,
                      name: 'reported photo'
                    })}
                  >
                    delete
                  </button>
                )}
                <div className={styles.moreInfoWrap}>
                  <button
                    className={styles.moreInfoBtn}
                    onClick={() => setReportMoreInfo(
                      reportMoreInfo === report.id ? null : report.id
                    )}
                  >
                    •••
                  </button>
                  {reportMoreInfo === report.id && (
                    <div className={styles.moreInfoPopup}>
                      {report.space && (
                        <button
                          className={styles.moreInfoItem}
                          onClick={() => {
                            setReportMoreInfo(null)
                            router.push('/space/' + report.space!.code)
                          }}
                        >
                          go to space →
                        </button>
                      )}
                      {report.space && report.album && (
                        <button
                          className={styles.moreInfoItem}
                          onClick={() => {
                            setReportMoreInfo(null)
                            router.push('/space/' + report.space!.code + '/album/' + report.album!.id)
                          }}
                        >
                          go to album →
                        </button>
                      )}
                      {report.photo?.uploaded_by && (
                        <button
                          className={styles.moreInfoItem}
                          onClick={() => {
                            const u = users.find(u =>
                              u.email === report.photo?.uploaded_by ||
                              u.display_name === report.photo?.uploaded_by
                            )
                            if (u) setConfirmTerminate(u)
                            setReportMoreInfo(null)
                          }}
                        >
                          terminate uploader →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    )}
  </div>
)}

      </div>

      {confirmDelete && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.warningIcon}>!</div>
            <h2 className={styles.modalTitle}>confirm delete</h2>
            <p className={styles.modalSub}>
              Are you sure you want to permanently delete <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div className={styles.modalBtns}>
              <button className={styles.btnOutline} onClick={() => setConfirmDelete(null)}>cancel</button>
              <button
                className={styles.btnDanger}
                disabled={working}
                onClick={() => {
                  if (confirmDelete.type === 'photo') handleDeletePhoto(photos.find(p => p.id === confirmDelete.id)!)
                  else if (confirmDelete.type === 'space') handleDeleteSpace(confirmDelete.id)
                  else if (confirmDelete.type === 'album') handleDeleteAlbum(confirmDelete.id)
                }}
              >
                {working ? 'deleting...' : 'permanently delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmTerminate && (
        <div className={styles.modalOverlay} onClick={() => setConfirmTerminate(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.warningIcon}>!</div>
            <h2 className={styles.modalTitle}>terminate account</h2>
            <p className={styles.modalSub}>
              This will permanently delete <strong>{confirmTerminate.display_name || confirmTerminate.email}</strong>'s account, all their Spaces, and all uploaded content. This cannot be undone.
            </p>
            <div className={styles.modalBtns}>
              <button className={styles.btnOutline} onClick={() => setConfirmTerminate(null)}>cancel</button>
              <button className={styles.btnDanger} disabled={working} onClick={() => handleTerminateUser(confirmTerminate.id)}>
                {working ? 'terminating...' : 'terminate account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={styles.toast}>{toast}</div>
      )}

    </main>
  )
}