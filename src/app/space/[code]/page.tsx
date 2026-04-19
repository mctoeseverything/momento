'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
}

type Member = {
  id: string
  email: string
  user_id: string
  joined_at: string
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

export default function SpacePage() {
  const { code } = useParams()
  const router = useRouter()

  const [space, setSpace] = useState<Space | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [terminated, setTerminated] = useState(false)
  const [showNewAlbum, setShowNewAlbum] = useState(false)
  const [newAlbum, setNewAlbum] = useState({ name: '', emoji: '📸' })
  const [creating, setCreating] = useState(false)
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
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

    if (user) {
      await supabase.from('space_members').upsert({
        space_id: spaceData.id,
        user_id: user.id,
        email: user.email,
      }, { onConflict: 'space_id,user_id' })
    }

    await fetchAlbums(spaceData.id)
    await fetchMembers(spaceData.id)
    setLoading(false)
  }

  async function fetchAlbums(spaceId: string) {
    const { data } = await supabase
      .from('albums')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: true })
    setAlbums(data || [])
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
            <div className={styles.qrBox}><QRCode /></div>
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
                  <div className={styles.albumCount}>tap to view</div>
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

function QRCode() {
  return (
    <svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#111111" rx="8"/>
      <rect x="10" y="10" width="30" height="30" rx="3" fill="#C8F025"/>
      <rect x="14" y="14" width="22" height="22" rx="2" fill="#111111"/>
      <rect x="18" y="18" width="14" height="14" rx="1" fill="#C8F025"/>
      <rect x="60" y="10" width="30" height="30" rx="3" fill="#C8F025"/>
      <rect x="64" y="14" width="22" height="22" rx="2" fill="#111111"/>
      <rect x="68" y="18" width="14" height="14" rx="1" fill="#C8F025"/>
      <rect x="10" y="60" width="30" height="30" rx="3" fill="#C8F025"/>
      <rect x="14" y="64" width="22" height="22" rx="2" fill="#111111"/>
      <rect x="18" y="68" width="14" height="14" rx="1" fill="#C8F025"/>
      <rect x="46" y="46" width="8" height="8" fill="#C8F025"/>
      <rect x="56" y="46" width="8" height="8" fill="#C8F025"/>
      <rect x="66" y="46" width="8" height="8" fill="#C8F025"/>
      <rect x="76" y="46" width="8" height="8" fill="#C8F025"/>
      <rect x="46" y="56" width="8" height="8" fill="#C8F025"/>
      <rect x="66" y="56" width="8" height="8" fill="#C8F025"/>
      <rect x="46" y="66" width="8" height="8" fill="#C8F025"/>
      <rect x="56" y="66" width="8" height="8" fill="#C8F025"/>
      <rect x="76" y="66" width="8" height="8" fill="#C8F025"/>
      <rect x="56" y="76" width="8" height="8" fill="#C8F025"/>
      <rect x="66" y="76" width="8" height="8" fill="#C8F025"/>
    </svg>
  )
}