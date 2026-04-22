'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './profile.module.css'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [originalName, setOriginalName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) { router.push('/'); return }
      setUser(data.session.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, restricted')
        .eq('id', data.session.user.id)
        .single()

      if (profile?.restricted) {
        await supabase.auth.signOut()
        router.push('/restricted')
        return
      }

      setDisplayName(profile?.display_name || '')
      setOriginalName(profile?.display_name || '')
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    if (!displayName.trim()) { setError('Name cannot be empty'); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id)

    if (err) {
      setError('Something went wrong. Try again.')
      setSaving(false)
      return
    }

    setOriginalName(displayName.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
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
          <button className={styles.btnOutlineSmall} onClick={() => router.push('/my-spaces')}>
            my spaces
          </button>
          <button className={styles.btnOutlineSmall} onClick={handleSignOut}>
            sign out
          </button>
        </div>
      </nav>

      <div className={styles.body}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>account</h1>
          <p className={styles.pageSub}>{user?.email}</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>your profile</div>
          <div className={styles.cardSub}>This is how you appear to others in Spaces.</div>

          <div className={styles.avatarRow}>
            <div className={styles.avatar}>
              {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className={styles.avatarName}>{displayName || 'No name set'}</div>
              <div className={styles.avatarEmail}>{user?.email}</div>
            </div>
          </div>

          <label className={styles.label}>Display name</label>
          <input
            className={styles.input}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="e.g. Sarah, Jake, Mia..."
          />

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.saveRow}>
            {saved && <span className={styles.savedBadge}>✓ saved!</span>}
            <button
              className={styles.btnLime}
              onClick={handleSave}
              disabled={saving || displayName.trim() === originalName}
            >
              {saving ? 'saving...' : 'save changes →'}
            </button>
          </div>
        </div>

        <div className={styles.card} style={{ marginTop: '1rem' }}>
          <div className={styles.cardTitle}>account info</div>
          <div className={styles.cardSub}>Your sign-in details managed by Momento.</div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{user?.email}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Sign-in method</span>
            <span className={styles.infoValue}>magic link</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Member since</span>
            <span className={styles.infoValue}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
              }) : '—'}
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}