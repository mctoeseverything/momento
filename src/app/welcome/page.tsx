'use client'
export const dynamic = 'force-dynamic'


import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './welcome.module.css'

export default function WelcomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'loading' | 'onboard' | 'already'>('loading')
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [agreedToS, setAgreedToS] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        })
        if (error || !data.user) {
          router.push('/')
          return
        }
        setUser(data.user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', data.user.id)
          .single()
        if (profile?.onboarded) {
          setStep('already')
        } else {
          setStep('onboard')
        }
      } else {
        const { data } = await supabase.auth.getSession()
        if (!data.session?.user) { router.push('/'); return }
        setUser(data.session.user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', data.session.user.id)
          .single()
        if (profile?.onboarded) {
          setStep('already')
        } else {
          setStep('onboard')
        }
      }
    }
    init()
  }, [])

  async function handleSubmit() {
    if (!displayName.trim()) { setError('Please enter your name'); return }
    if (!agreedToS) { setError('Please agree to the Terms of Service'); return }
    if (!agreedPrivacy) { setError('Please agree to the Privacy Policy'); return }
    setSaving(true)
    setError('')
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName.trim(),
      agreed_to_tos: true,
      onboarded: true,
    })
    if (error) { setError('Something went wrong. Try again.'); setSaving(false); return }
    router.push('/my-spaces')
  }

  if (step === 'loading') return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingLogo}>momento</div>
      <div className={styles.loadingDots}><span /><span /><span /></div>
    </div>
  )

  if (step === 'already') return (
    <div className={styles.centeredScreen}>
      <div className={styles.card}>
        <div className={styles.iconBox}>✦</div>
        <h1 className={styles.title}>you're all set</h1>
        <p className={styles.sub}>Your account is already active.</p>
        <button className={styles.btnLime} onClick={() => router.push('/my-spaces')}>
          go to my spaces →
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.centeredScreen}>
      <div className={styles.card}>

        <div className={styles.iconBox}>👋</div>
        <h1 className={styles.title}>welcome to momento</h1>
        <p className={styles.sub}>Just a couple things before we get started.</p>

        <label className={styles.label}>What should we call you?</label>
        <input
          className={styles.input}
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="e.g. Sarah, Jake, Mia..."
          autoFocus
        />

        <div className={styles.agreementsBlock}>
          <label className={styles.checkRow} onClick={() => setAgreedToS(!agreedToS)}>
            <div className={`${styles.checkbox} ${agreedToS ? styles.checkboxChecked : ''}`}>
              {agreedToS && <span>✓</span>}
            </div>
            <span className={styles.checkLabel}>
              I agree to the{' '}
              <a href="/terms" target="_blank" className={styles.link}>Terms of Service</a>
            </span>
          </label>

          <label className={styles.checkRow} onClick={() => setAgreedPrivacy(!agreedPrivacy)}>
            <div className={`${styles.checkbox} ${agreedPrivacy ? styles.checkboxChecked : ''}`}>
              {agreedPrivacy && <span>✓</span>}
            </div>
            <span className={styles.checkLabel}>
              I agree to the{' '}
              <a href="/privacy" target="_blank" className={styles.link}>Privacy Policy</a>
            </span>
          </label>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.btnLime}
          onClick={handleSubmit}
          disabled={saving}
          style={{ width: '100%' }}
        >
          {saving ? 'saving...' : "let's go →"}
        </button>

      </div>
    </div>
  )
}