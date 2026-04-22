import styles from '../terms/legal.module.css'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>momento</Link>
      </nav>

      <div className={styles.body}>

        <div className={styles.header}>
          <div className={styles.tag}>legal</div>
          <h1 className={styles.title}>privacy policy</h1>
          <p className={styles.lastUpdated}>
            Last updated: {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

        <div className={styles.content}>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. who we are</h2>
            <p>
              Momento (“Service”) is a shared photo and video space platform. This Privacy Policy explains what information we collect,
              how we use it, how it is shared, and your rights in relation to that information. By using Momento, you agree to the collection
              and use of information in accordance with this Policy.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. information we collect</h2>
            <p>We collect the following categories of information when you use Momento:</p>
            <ul className={styles.list}>
              <li><strong>Email address</strong> — collected during account creation and used for authentication via magic links</li>
              <li><strong>Display name</strong> — the name you provide during onboarding, shown within Spaces you join</li>
              <li><strong>Photos and videos</strong> — media files you upload to Spaces, stored securely via third-party storage providers</li>
              <li><strong>Space membership data</strong> — records of Spaces you create or join, used for access control and permissions</li>
              <li><strong>Upload metadata</strong> — timestamps, uploader identity, and basic system metadata associated with uploads</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. how we use your information</h2>
            <p>We use collected information strictly to operate and provide the Service:</p>
            <ul className={styles.list}>
              <li>To authenticate users and manage accounts</li>
              <li>To enable creation, access, and participation in Spaces</li>
              <li>To store, display, and deliver uploaded content</li>
              <li>To send essential service communications (e.g., authentication emails)</li>
              <li>To maintain security, prevent abuse, and enforce our Terms</li>
            </ul>
            <p>
              We do not use your personal information for advertising purposes and do not sell your personal information.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. third-party service providers</h2>
            <p>We rely on third-party providers to operate the Service:</p>
            <ul className={styles.list}>
              <li><strong>Supabase</strong> — authentication, database, and storage infrastructure. Data may be processed on cloud infrastructure (including AWS). See supabase.com/privacy.</li>
              <li><strong>Resend / Brevo</strong> — email delivery for authentication and account-related messages. Your email is shared solely for this purpose.</li>
              <li><strong>Vercel</strong> — hosting and deployment infrastructure for the application.</li>
            </ul>
            <p>
              These providers process data on our behalf under their respective privacy policies.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. data sharing</h2>
            <p>Your data is shared only as necessary to operate the Service:</p>
            <ul className={styles.list}>
              <li>Your display name and uploaded content are visible to members of Spaces you join</li>
              <li>Your email address is not visible to other users</li>
              <li>Space owners may have access to email addresses of members in their Spaces for management purposes</li>
            </ul>
            <p>
              We do not share personal information with third parties except as described in this Policy.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. data retention</h2>
            <p>
              We retain personal data for as long as your account remains active.
              If you delete your account, your personal data and uploaded content will be removed from our systems within a reasonable period,
              subject to backup retention cycles and technical limitations.
            </p>
            <p>
              Some content may persist where it has been copied or retained by other users within the Service.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. cookies and tracking technologies</h2>
            <p>
              Momento uses only essential cookies required for authentication and session management.
              We do not use tracking cookies, advertising cookies, or third-party analytics tools.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. your rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className={styles.list}>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate or incomplete data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your uploaded content where applicable</li>
            </ul>
            <p>
              To exercise these rights, you may contact us directly.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. children's privacy</h2>
            <p>
              Momento is not intended for users under the age of 13. We do not knowingly collect personal data from children under 13.
              If we become aware that such data has been collected, we will take reasonable steps to delete it.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. security</h2>
            <p>
              We implement reasonable technical and organizational measures to protect your data, including encryption and secure authentication.
              However, no system is completely secure, and we cannot guarantee absolute security of your information.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>11. changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If changes are material, we will notify users via email or within the Service.
              Continued use of Momento after changes take effect constitutes acceptance of the updated Policy.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>12. contact</h2>
            <p>
              If you have any questions or requests regarding this Privacy Policy, contact us directly at hi@momento.fyi. We will make reasonable efforts to respond promptly.
            </p>
          </section>

        </div>

        <div className={styles.footer}>
          <Link href="/terms" className={styles.footerLink}>Terms of Service</Link>
          <Link href="/" className={styles.footerLink}>Back to Momento</Link>
        </div>

      </div>
    </main>
  )
}