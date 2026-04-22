'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import styles from './space.module.css'

type Space = {
  id: string
  name: string
  description: string
  emoji: string
  code: string
  created_at: string
  owner_id: string
  view_permission: string
  upload_permission: string
  album_permission: string
  terminated: boolean
}

type Album = {
  id: string
  name: string
  emoji: string
  created_at: string
  photo_count?: number
}

type Member = {
  id: string
  email: string
  user_id: string
  joined_at: string
}

type Announcement = {
  id: string
  message: string
  created_at: string
}

type Tab = 'albums' | 'members' | 'settings'

const VIEW_OPTIONS = [
  {
    value: 'public',
    label: 'Anyone on the internet',
    icon: '🌍',
    desc: 'Your Space is fully public. Anyone who finds the link can view it — no code or account needed. Great for public events or portfolios.',
  },
  {
    value: 'code_only',
    label: 'Anyone with the code',
    icon: '🔗',
    desc: 'Only people who have your 6-character Space code can view it. No account required. Good for casual events where you want light privacy.',
  },
  {
    value: 'code_and_auth',
    label: 'Anyone with the code + signed in',
    icon: '🔒',
    desc: 'Viewers need both the code AND a Momento account. You\'ll know exactly who has access. Best for private events like weddings or family gatherings.',
  },
]

const UPLOAD_OPTIONS = [
  {
    value: 'code_only',
    label: 'Anyone with the code',
    icon: '🔗',
    desc: 'Anyone who has the code can upload photos and videos, no account needed. Easiest for guests who may not want to sign up.',
  },
  {
    value: 'code_and_auth',
    label: 'Anyone with the code + signed in',
    icon: '🔒',
    desc: 'Uploaders need the code AND a Momento account. This ties every upload to a real account so you know who contributed what.',
  },
  {
    value: 'owner_only',
    label: 'Only me',
    icon: '👑',
    desc: 'Only you (the owner) can upload. Guests can view but nobody else can add photos. Good for curated galleries.',
  },
]

const ALBUM_OPTIONS = [
  {
    value: 'code_and_auth',
    label: 'Anyone with the code + signed in',
    icon: '🔒',
    desc: 'Any signed-in member can create new albums to organize photos however they like.',
  },
  {
    value: 'owner_only',
    label: 'Only me',
    icon: '👑',
    desc: 'Only you can create albums. Members can still upload into existing albums but can\'t add new categories.',
  },
]

const SPACE_EMOJIS = ['🌅', '🎉', '💍', '🏖', '🎂', '🌿', '🎸', '🏔', '📸', '✨', '🎶', '🥂', '💃', '🍕', '😂']

export default function SpacePage() {
  const { code } = useParams()
  const router = useRouter()

  const [space, setSpace] = useState<Space | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [terminated, setTerminated] = useState(false)
  const [showNewAlbum, setShowNewAlbum] = useState(false)
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false)
  const [newAlbum, setNewAlbum] = useState({ name: '', emoji: '📸' })
  const [newMessage, setNewMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [postingAnnouncement, setPostingAnnouncement] = useState(false)
  const [copied, setCopied] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)
  const [tab, setTab] = useState<Tab>('albums')
  const [settings, setSettings] = useState({
    view_permission: '',
    upload_permission: '',
    album_permission: '',
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const albumEmojis = ['📸', '🌅', '🎉', '💃', '🍕', '🥂', '🎶', '😂', '🌿', '✨']
  const [copiedLink, setCopiedLink] = useState(false)

  // Edit space state
  const [editSpace, setEditSpace] = useState({ name: '', description: '', emoji: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editSaved, setEditSaved] = useState(false)

  // Leave space state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user ?? null
      if (sessionUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('restricted')
          .eq('id', sessionUser.id)
          .single()
        if (profile?.restricted) {
          await supabase.auth.signOut()
          router.push('/restricted')
          return
        }
      }
      setUser(sessionUser)
      setAuthReady(true)
    })
  }, [])

  useEffect(() => {
    if (authReady && code) fetchSpace()
  }, [authReady, code])

  async function fetchSpace() {
    setLoading(true)
    const { data: spaceData } = await supabase
      .from('spaces')
      .select('*')
      .eq('code', code)
      .single()

    if (!spaceData) { setNotFound(true); setLoading(false); return }
    if (spaceData.terminated) { setTerminated(true); setLoading(false); return }

    const perm = spaceData.view_permission
    if (perm === 'code_and_auth' && !user) {
      setAccessDenied(true); setLoading(false); return
    }

    setSpace(spaceData)
    setSettings({
      view_permission: spaceData.view_permission,
      upload_permission: spaceData.upload_permission,
      album_permission: spaceData.album_permission,
    })
    setEditSpace({
      name: spaceData.name,
      description: spaceData.description || '',
      emoji: spaceData.emoji,
    })

    if (user) {
      await supabase.from('space_members').upsert({
        space_id: spaceData.id,
        user_id: user.id,
        email: user.email,
      }, { onConflict: 'space_id,user_id' })
    }

    await fetchAlbums(spaceData.id)
    await fetchMembers(spaceData.id)
    await fetchAnnouncements(spaceData.id)
    setLoading(false)
  }

  async function fetchAlbums(spaceId: string) {
    const { data } = await supabase
      .from('albums')
      .select('*, photos(count)')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: true })

    const withCounts = (data || []).map((album: any) => ({
      ...album,
      photo_count: album.photos?.[0]?.count || 0,
    }))
    setAlbums(withCounts)
  }

  async function fetchMembers(spaceId: string) {
    setLoadingMembers(true)
    const { data } = await supabase
      .from('space_members')
      .select('*')
      .eq('space_id', spaceId)
      .order('joined_at', { ascending: true })
    setMembers(data || [])
    setLoadingMembers(false)
  }

  async function fetchAnnouncements(spaceId: string) {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
    setAnnouncements(data || [])
  }

  function copyLink() {
    const url = `${window.location.origin}/space/${space?.code}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  async function handleCreateAlbum() {
    if (!newAlbum.name.trim() || !space) return
    if (space.album_permission === 'owner_only' && user?.id !== space.owner_id) return
    if (space.album_permission === 'code_and_auth' && !user) return
    setCreating(true)
    const { error } = await supabase.from('albums').insert({
      space_id: space.id,
      name: newAlbum.name.trim(),
      emoji: newAlbum.emoji,
    })
    if (!error) {
      await fetchAlbums(space.id)
      setNewAlbum({ name: '', emoji: '📸' })
      setShowNewAlbum(false)
    }
    setCreating(false)
  }

  async function handlePostAnnouncement() {
    if (!newMessage.trim() || !space) return
    setPostingAnnouncement(true)
    await supabase.from('announcements').insert({
      space_id: space.id,
      message: newMessage.trim(),
    })
    await fetchAnnouncements(space.id)
    setNewMessage('')
    setShowNewAnnouncement(false)
    setPostingAnnouncement(false)
  }

  async function handleDeleteAnnouncement(id: string) {
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  async function handleSaveSettings() {
    if (!space) return
    setSavingSettings(true)
    const { error } = await supabase
      .from('spaces')
      .update({
        view_permission: settings.view_permission,
        upload_permission: settings.upload_permission,
        album_permission: settings.album_permission,
      })
      .eq('id', space.id)
      .eq('owner_id', user?.id)
    if (!error) {
      setSpace({ ...space, ...settings })
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    }
    setSavingSettings(false)
  }

  async function handleSaveEdit() {
    if (!space || !editSpace.name.trim()) return
    setSavingEdit(true)
    const { error } = await supabase
      .from('spaces')
      .update({
        name: editSpace.name.trim(),
        description: editSpace.description.trim(),
        emoji: editSpace.emoji,
      })
      .eq('id', space.id)
      .eq('owner_id', user?.id)
    if (!error) {
      setSpace({ ...space, name: editSpace.name.trim(), description: editSpace.description.trim(), emoji: editSpace.emoji })
      setEditSaved(true)
      setTimeout(() => setEditSaved(false), 3000)
    }
    setSavingEdit(false)
  }

  async function handleLeaveSpace() {
    if (!space || !user) return
    setLeaving(true)
    await supabase
      .from('space_members')
      .delete()
      .eq('space_id', space.id)
      .eq('user_id', user.id)
    router.push('/my-spaces')
  }

  function copyCode() {
    navigator.clipboard.writeText(space?.code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isOwner = user?.id === space?.owner_id

  const canCreateAlbum =
    isOwner ||
    (space?.album_permission === 'code_and_auth' && !!user) ||
    space?.album_permission === 'code_only'

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingLogo}>momento</div>
      <div className={styles.loadingDots}><span /><span /><span /></div>
    </div>
  )

  if (notFound) return (
    <div className={styles.notFoundScreen}>
      <div className={styles.notFoundCard}>
        <div className={styles.notFoundIcon}>✦</div>
        <h1 className={styles.notFoundTitle}>Space not found</h1>
        <p className={styles.notFoundSub}>Double check the code and try again.</p>
        <button className={styles.btnLime} onClick={() => router.push('/')}>back to home</button>
      </div>
    </div>
  )

  if (terminated) return (
    <div className={styles.notFoundScreen}>
      <div className={styles.notFoundCard}>
        <div className={styles.notFoundIcon}>🚫</div>
        <h1 className={styles.notFoundTitle}>space unavailable</h1>
        <p className={styles.notFoundSub}>
          This Space has been removed by Momento for violating our{' '}
          <a href="/terms" style={{ color: '#111111', fontWeight: 700 }}>Terms of Service</a>.
        </p>
        <button className={styles.btnLime} onClick={() => router.push('/')}>back to home</button>
      </div>
    </div>
  )

  if (accessDenied) return (
    <div className={styles.notFoundScreen}>
      <div className={styles.notFoundCard}>
        <div className={styles.notFoundIcon}>🔒</div>
        <h1 className={styles.notFoundTitle}>sign in to view</h1>
        <p className={styles.notFoundSub}>
          This Space requires a Momento account. Sign in and come back with the code.
        </p>
        <button className={styles.btnLime} onClick={() => router.push('/')}>sign in →</button>
      </div>
    </div>
  )

  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.logo} onClick={() => router.push('/')}>momento</div>
        <div className={styles.navRight}>
          <button className={styles.shareLinkBtn} onClick={copyLink}>
            {copiedLink ? '✓ link copied' : 'share link'}
          </button>
          <button className={styles.codeChip} onClick={copyCode}>
            <span className={styles.codeChipLabel}>code</span>
            <span className={styles.codeChipValue}>{space?.code}</span>
            <span className={styles.codeChipCopy}>{copied ? '✓ copied' : 'copy'}</span>
          </button>
          {user && (
            <button
              className={styles.btnOutlineSmall}
              onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            >
              sign out
            </button>
          )}
        </div>
      </nav>

      <div className={styles.spaceHeader}>
        <div className={styles.spaceHeaderInner}>
          <div className={styles.spaceEmojiWrap}>
            <span className={styles.spaceEmoji}>{space?.emoji}</span>
          </div>
          <div className={styles.spaceInfo}>
            <h1 className={styles.spaceName}>{space?.name}</h1>
            {space?.description && (
              <p className={styles.spaceDesc}>{space.description}</p>
            )}
            <div className={styles.spaceMeta}>
              <span className={styles.metaChip}>🖼 {albums.length} albums</span>
              <span className={styles.metaChip}>👥 {members.length} members</span>
              {isOwner && <span className={styles.metaChipOwner}>👑 your space</span>}
            </div>
          </div>
          <div className={styles.qrBlock}>
            <div className={styles.qrBox}>
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/space/${space?.code}`}
                size={100}
                bgColor="#111111"
                fgColor="#C8F025"
                level="M"
              />
            </div>
            <p className={styles.qrLabel}>scan to join</p>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'albums' ? styles.tabActive : ''}`}
            onClick={() => setTab('albums')}
          >
            albums
          </button>
          {isOwner && (
            <button
              className={`${styles.tab} ${tab === 'members' ? styles.tabActive : ''}`}
              onClick={() => setTab('members')}
            >
              people
            </button>
          )}
          {isOwner && (
            <button
              className={`${styles.tab} ${tab === 'settings' ? styles.tabActive : ''}`}
              onClick={() => setTab('settings')}
            >
              settings
            </button>
          )}
        </div>
      </div>

      {tab === 'albums' && (
        <div className={styles.body}>

          {(announcements.length > 0 || isOwner) && (
            <div className={styles.announcementsBlock}>
              <div className={styles.announcementsHeader}>
                <div className={styles.announcementsTitle}>
                  <span className={styles.announcementsIcon}>📣</span>
                  announcements
                </div>
                {isOwner && (
                  <button
                    className={styles.btnLime}
                    onClick={() => setShowNewAnnouncement(true)}
                  >
                    + post
                  </button>
                )}
              </div>

              {announcements.length === 0 && isOwner && (
                <div className={styles.announcementsEmpty}>
                  No announcements yet. Post one to let your guests know something important.
                </div>
              )}

              <div className={styles.announcementsList}>
                {announcements.map(a => (
                  <div key={a.id} className={styles.announcementCard}>
                    <p className={styles.announcementMessage}>{a.message}</p>
                    <div className={styles.announcementFooter}>
                      <span className={styles.announcementDate}>
                        {new Date(a.created_at).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                      {isOwner && (
                        <button
                          className={styles.announcementDelete}
                          onClick={() => handleDeleteAnnouncement(a.id)}
                        >
                          remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>albums</h2>
            {canCreateAlbum && (
              <button className={styles.btnLime} onClick={() => setShowNewAlbum(true)}>
                + new album
              </button>
            )}
          </div>

          {albums.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📸</div>
              <h3 className={styles.emptyTitle}>no albums yet</h3>
              <p className={styles.emptySub}>Create your first album to start collecting photos.</p>
              {canCreateAlbum && (
                <button className={styles.btnLime} onClick={() => setShowNewAlbum(true)}>
                  create first album →
                </button>
              )}
            </div>
          )}

          <div className={styles.albumsGrid}>
            {albums.map(album => (
              <div
                key={album.id}
                className={styles.albumCard}
                onClick={() => router.push('/space/' + code + '/album/' + album.id)}
              >
                <div className={styles.albumThumb}>
                  <span className={styles.albumThumbEmoji}>{album.emoji}</span>
                </div>
                <div className={styles.albumInfo}>
                  <div className={styles.albumName}>{album.name}</div>
                  <div className={styles.albumCount}>
                    {album.photo_count} {album.photo_count === 1 ? 'item' : 'items'}
                  </div>
                </div>
              </div>
            ))}
            {canCreateAlbum && (
              <div className={styles.albumCardNew} onClick={() => setShowNewAlbum(true)}>
                <div className={styles.albumNewIcon}>+</div>
                <div className={styles.albumNewLabel}>new album</div>
              </div>
            )}
          </div>

          {/* Leave space — for non-owners who are signed in */}
          {user && !isOwner && (
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e0e0e0' }}>
              <button
                className={styles.btnDangerOutline}
                onClick={() => setShowLeaveConfirm(true)}
              >
                leave this space
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'members' && isOwner && (
        <div className={styles.body}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>people</h2>
            <span className={styles.memberCount}>
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </div>
          {loadingMembers ? (
            <p style={{ color: '#999' }}>loading...</p>
          ) : members.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <h3 className={styles.emptyTitle}>no members yet</h3>
              <p className={styles.emptySub}>Share the code and people will appear here when they join.</p>
            </div>
          ) : (
            <div className={styles.membersList}>
              {members.map((member) => (
                <div key={member.id} className={styles.memberRow}>
                  <div className={styles.memberAvatar}>
                    {member.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberEmail}>{member.email}</div>
                    <div className={styles.memberJoined}>
                      joined {new Date(member.joined_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </div>
                  </div>
                  {member.user_id === space?.owner_id && (
                    <span className={styles.ownerBadge}>owner</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && isOwner && (
        <div className={styles.body}>
          <div className={styles.settingsSection}>

            {/* Edit space details */}
            <div className={styles.permGroup}>
              <h3 className={styles.permTitle}>space details</h3>
              <p className={styles.permSubtitle}>Update the name, description, and icon for your Space.</p>

              <label className={styles.label}>Name</label>
              <input
                className={styles.input}
                value={editSpace.name}
                onChange={e => setEditSpace({ ...editSpace, name: e.target.value })}
                placeholder="e.g. Jake & Mia's Wedding"
              />

              <label className={styles.label}>Description (optional)</label>
              <input
                className={styles.input}
                value={editSpace.description}
                onChange={e => setEditSpace({ ...editSpace, description: e.target.value })}
                placeholder="e.g. June 14, 2025 · The Grand Ballroom"
              />

              <label className={styles.label}>Icon</label>
              <div className={styles.emojiRow} style={{ marginBottom: '1.2rem' }}>
                {SPACE_EMOJIS.map(e => (
                  <button
                    key={e}
                    className={`${styles.emojiBtn} ${editSpace.emoji === e ? styles.emojiBtnActive : ''}`}
                    onClick={() => setEditSpace({ ...editSpace, emoji: e })}
                  >
                    {e}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }}>
                {editSaved && <span className={styles.savedBadge}>✓ saved!</span>}
                <button
                  className={styles.btnLime}
                  onClick={handleSaveEdit}
                  disabled={savingEdit || !editSpace.name.trim()}
                >
                  {savingEdit ? 'saving...' : 'save details →'}
                </button>
              </div>
            </div>

            <PermissionGroup
              title="Who can view this Space?"
              subtitle="Controls who can see your Space and its albums."
              options={VIEW_OPTIONS}
              value={settings.view_permission}
              onChange={v => setSettings({ ...settings, view_permission: v })}
            />
            <PermissionGroup
              title="Who can upload photos & videos?"
              subtitle="Controls who can add media to albums."
              options={UPLOAD_OPTIONS}
              value={settings.upload_permission}
              onChange={v => setSettings({ ...settings, upload_permission: v })}
            />
            <PermissionGroup
              title="Who can create albums?"
              subtitle="Controls who can add new album categories."
              options={ALBUM_OPTIONS}
              value={settings.album_permission}
              onChange={v => setSettings({ ...settings, album_permission: v })}
            />
            <div className={styles.settingsSaveRow}>
              {settingsSaved && <span className={styles.savedBadge}>✓ saved!</span>}
              <button
                className={styles.btnLime}
                onClick={handleSaveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? 'saving...' : 'save settings →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewAlbum && (
        <div className={styles.modalOverlay} onClick={() => setShowNewAlbum(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowNewAlbum(false)}>✕</button>
            <h2 className={styles.formTitle}>new album</h2>
            <p className={styles.formSub}>Add a category to organize your photos.</p>
            <label className={styles.label}>Album Name</label>
            <input
              className={styles.input}
              value={newAlbum.name}
              onChange={e => setNewAlbum({ ...newAlbum, name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleCreateAlbum()}
              placeholder="e.g. Dance Floor, Ceremony, Food..."
              autoFocus
            />
            <label className={styles.label}>Pick an icon</label>
            <div className={styles.emojiRow}>
              {albumEmojis.map(e => (
                <button
                  key={e}
                  className={`${styles.emojiBtn} ${newAlbum.emoji === e ? styles.emojiBtnActive : ''}`}
                  onClick={() => setNewAlbum({ ...newAlbum, emoji: e })}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className={styles.formBtns}>
              <button className={styles.btnOutline} onClick={() => setShowNewAlbum(false)}>cancel</button>
              <button className={styles.btnLime} onClick={handleCreateAlbum} disabled={creating}>
                {creating ? 'creating...' : 'create album →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewAnnouncement && (
        <div className={styles.modalOverlay} onClick={() => setShowNewAnnouncement(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowNewAnnouncement(false)}>✕</button>
            <h2 className={styles.formTitle}>post announcement</h2>
            <p className={styles.formSub}>Share something important with everyone in this Space.</p>
            <label className={styles.label}>Message</label>
            <textarea
              className={styles.textarea}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="e.g. Photos will be available for download after the event ends!"
              rows={4}
              autoFocus
            />
            <div className={styles.formBtns}>
              <button className={styles.btnOutline} onClick={() => setShowNewAnnouncement(false)}>cancel</button>
              <button className={styles.btnLime} onClick={handlePostAnnouncement} disabled={postingAnnouncement}>
                {postingAnnouncement ? 'posting...' : 'post →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave space confirmation modal */}
      {showLeaveConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowLeaveConfirm(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowLeaveConfirm(false)}>✕</button>
            <h2 className={styles.formTitle}>leave this space?</h2>
            <p className={styles.formSub}>
              You'll be removed from <strong>{space?.name}</strong>. You can rejoin anytime with the code.
            </p>
            <div className={styles.formBtns}>
              <button className={styles.btnOutline} onClick={() => setShowLeaveConfirm(false)}>cancel</button>
              <button
                className={styles.btnDanger}
                onClick={handleLeaveSpace}
                disabled={leaving}
              >
                {leaving ? 'leaving...' : 'leave space'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}

function PermissionGroup({ title, subtitle, options, value, onChange }: {
  title: string
  subtitle: string
  options: { value: string; label: string; icon: string; desc: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className={styles.permGroup}>
      <h3 className={styles.permTitle}>{title}</h3>
      <p className={styles.permSubtitle}>{subtitle}</p>
      <div className={styles.permOptions}>
        {options.map(opt => (
          <div
            key={opt.value}
            className={`${styles.permOption} ${value === opt.value ? styles.permOptionActive : ''}`}
            onClick={() => onChange(opt.value)}
          >
            <div className={styles.permOptionTop}>
              <span className={styles.permOptionIcon}>{opt.icon}</span>
              <div className={styles.permOptionLabel}>{opt.label}</div>
              <div className={`${styles.permRadio} ${value === opt.value ? styles.permRadioActive : ''}`} />
            </div>
            <p className={styles.permOptionDesc}>{opt.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}