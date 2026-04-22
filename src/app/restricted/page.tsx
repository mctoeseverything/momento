'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './restricted.module.css'
import Link from 'next/link'

export default function RestrictedPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (!user) {
        router.replace('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('restricted')
        .eq('id', user.id)
        .single()

      if (!profile?.restricted) {
        router.replace('/')
        return
      }

      setChecking(false)
    }

    check()
  }, [])

  if (checking) return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem',
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif' }}>
        momento
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%', background: '#C8F025',
            animation: 'bounce 0.8s infinite',
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-8px);opacity:1} }`}</style>
    </div>
  )

  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>momento</Link>
      </nav>
      <div className={styles.body}>
        <div className={styles.card}>
          <div className={styles.icon}>🚫</div>
          <h1 className={styles.title}>account restricted</h1>
          <p className={styles.sub}>
            Your account has been terminated for violating Momento's{' '}
            <Link href="/terms" className={styles.link}>Terms of Service</Link>.
            If you believe this is a mistake, please contact us.
          </p>
        </div>
      </div>
    </main>
  )
}