import styles from './restricted.module.css'
import Link from 'next/link'

export default function RestrictedPage() {
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