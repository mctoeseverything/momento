'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mode, setMode] = useState<null | 'create' | 'join' | 'auth'>(null)
  const [authStep, setAuthStep] = useState<'email' | 'sent'>('email')
  const [email, setEmail] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [form, setForm] = useState({ name: '', description: '', emoji: '🌅' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const emojis = ['🌅', '🎉', '💍', '🏖', '🎂', '🌿', '🎸', '🏔']

useEffect(() => {
  supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
    if (session?.user) {
      supabase.from('profiles').select('onboarded').eq('id', session.user.id).single().then(({ data }) => {
        if (!data?.onboarded) {
          router.push('/welcome')
        } else {
          setMode(null)
        }
      })
    }
  })
  return () => listener.subscription.unsubscribe()
}, [])

  async function handleSendMagicLink() {
    if (!email.trim()) { setError('Please enter your email'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
    if (error) { setError('Something went wrong. Try again.'); setLoading(false); return }
    setAuthStep('sent')
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  async function handleCreate() {
  if (!form.name.trim()) { setError('Please enter a space name'); return }
  setLoading(true)
  setError('')
  const code = generateCode()
  const { data: { session } } = await supabase.auth.getSession()
  const { error } = await supabase.from('spaces').insert({
    name: form.name.trim(),
    description: form.description.trim(),
    emoji: form.emoji,
    code,
    owner_id: session?.user?.id,
    view_permission: 'code_and_auth',
    upload_permission: 'code_and_auth',
    album_permission: 'code_and_auth',
  })
  if (error) { setError('Something went wrong. Try again.'); setLoading(false); return }
  router.push(`/space/${code}`)
}

  async function handleJoin() {
    if (!joinCode.trim()) { setError('Please enter a code'); return }
    setLoading(true)
    setError('')
    const { data } = await supabase
      .from('spaces')
      .select('code')
      .eq('code', joinCode.trim().toUpperCase())
      .single()
    if (!data) { setError('Space not found. Check the code and try again.'); setLoading(false); return }
    router.push(`/space/${data.code}`)
  }

  function openCreate() {
    if (!user) { setMode('auth'); setError(''); setAuthStep('email') }
    else { setMode('create'); setError('') }
  }

  return (
    <main className={styles.main}>

<nav className={styles.nav}>
  <div className={styles.logo}>momento</div>
  <div className={styles.navLinks}>
    <button className={styles.navLinkBtn} onClick={() => { setMode('join'); setError('') }}>
      join a space
    </button>
    {user ? (
      <>
        <button className={styles.navLinkBtn} onClick={() => router.push('/my-spaces')}>
          my spaces
        </button>
        <span className={styles.navEmail}>{user.email}</span>
        <button className={styles.btnOutlineSmall} onClick={handleSignOut}>sign out</button>
      </>
    ) : (
      <button className={styles.btnLime} onClick={() => { setMode('auth'); setAuthStep('email'); setError('') }}>
        sign in
      </button>
    )}
  </div>
</nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            every moment,<br />
            <span className={styles.heroTitleAccent}>together.</span>
          </h1>
          <p className={styles.heroSub}>
            Create a Space for your event, trip, or crew.<br />
            Share the code. Everyone adds their photos and videos.
          </p>
          <div className={styles.heroBtns}>
            <button className={styles.btnLimeLarge} onClick={openCreate}>
              create a space →
            </button>
            <button className={styles.btnGhostLarge} onClick={() => { setMode('join'); setError('') }}>
              join with a code
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureNum}>01</div>
            <h3 className={styles.featureTitle}>Create a Space</h3>
            <p className={styles.featureText}>Name it, pick a vibe, and get a unique 6-character code instantly.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureNum}>02</div>
            <h3 className={styles.featureTitle}>Share the Code</h3>
            <p className={styles.featureText}>Send the code or QR to anyone. No account needed to join.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureNum}>03</div>
            <h3 className={styles.featureTitle}>Collect Memories</h3>
            <p className={styles.featureText}>Everyone uploads photos and videos into organized albums.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureNum}>04</div>
            <h3 className={styles.featureTitle}>Keep Everything</h3>
            <p className={styles.featureText}>Download the whole Space in full resolution. Yours forever.</p>
          </div>
        </div>
      </section>

      {/* MODALS */}
      {mode && (
        <div className={styles.modalOverlay} onClick={() => setMode(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setMode(null)}>✕</button>

            {/* Auth Modal */}
            {mode === 'auth' && authStep === 'email' && (
              <>
                <h2 className={styles.formTitle}>sign in to momento</h2>
                <p className={styles.formSub}>We'll send a magic link to your email. No password needed.</p>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMagicLink()}
                  placeholder="you@example.com"
                  autoFocus
                />
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.formBtns}>
                  <button className={styles.btnOutline} onClick={() => setMode(null)}>cancel</button>
                  <button className={styles.btnLime} onClick={handleSendMagicLink} disabled={loading}>
                    {loading ? 'sending...' : 'send magic link →'}
                  </button>
                </div>
              </>
            )}

            {mode === 'auth' && authStep === 'sent' && (
              <>
                <div className={styles.sentIcon}>✦</div>
                <h2 className={styles.formTitle}>check your email</h2>
                <p className={styles.formSub}>We sent a magic link to <strong>{email}</strong>. Click it to sign in — then come back here.</p>
                <button className={styles.btnLime} style={{ width: '100%' }} onClick={() => setMode(null)}>
                  got it
                </button>
              </>
            )}

            {/* Create Modal */}
            {mode === 'create' && (
              <>
                <h2 className={styles.formTitle}>create a space</h2>
                <p className={styles.formSub}>Give your space a name and a vibe.</p>
                <label className={styles.label}>Space Name</label>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Jake & Mia's Wedding"
                  autoFocus
                />
                <label className={styles.label}>Description (optional)</label>
                <input
                  className={styles.input}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. June 14, 2025 · The Grand Ballroom"
                />
                <label className={styles.label}>Pick a vibe</label>
                <div className={styles.emojiRow}>
                  {emojis.map(e => (
                    <button
                      key={e}
                      className={`${styles.emojiBtn} ${form.emoji === e ? styles.emojiBtnActive : ''}`}
                      onClick={() => setForm({ ...form, emoji: e })}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.formBtns}>
                  <button className={styles.btnOutline} onClick={() => setMode(null)}>cancel</button>
                  <button className={styles.btnLime} onClick={handleCreate} disabled={loading}>
                    {loading ? 'creating...' : 'create space →'}
                  </button>
                </div>
              </>
            )}

            {/* Join Modal */}
            {mode === 'join' && (
              <>
                <h2 className={styles.formTitle}>join a space</h2>
                <p className={styles.formSub}>Enter the code someone shared with you.</p>
                <label className={styles.label}>Space Code</label>
                <input
                  className={`${styles.input} ${styles.inputCode}`}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="ROOF24"
                  maxLength={6}
                  autoFocus
                />
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.formBtns}>
                  <button className={styles.btnOutline} onClick={() => setMode(null)}>cancel</button>
                  <button className={styles.btnLime} onClick={handleJoin} disabled={loading}>
                    {loading ? 'checking...' : 'join →'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

<footer className={styles.footer}>
  <span className={styles.footerLogo}>momento</span>
  <div className={styles.footerLinks}>
    <button className={styles.footerLink} onClick={() => router.push('/terms')}>terms of service</button>
    <button className={styles.footerLink} onClick={() => router.push('/privacy')}>privacy policy</button>
  </div>
</footer>

    </main>
  )
}