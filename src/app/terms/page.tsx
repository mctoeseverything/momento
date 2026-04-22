import styles from './legal.module.css'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>momento</Link>
      </nav>

      <div className={styles.body}>

        <div className={styles.header}>
          <div className={styles.tag}>legal</div>
          <h1 className={styles.title}>terms of service</h1>
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
            <h2 className={styles.sectionTitle}>1. acceptance of terms</h2>
            <p>
              By accessing or using Momento (“Service”), you agree to be bound by these Terms of Service (“Terms”).
              If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all users,
              including Space owners and guests accessing Spaces via invite codes.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. eligibility</h2>
            <p>
              You must be at least 13 years of age to use Momento. By using the Service, you represent and warrant
              that you meet this requirement and that all information you provide is accurate and complete.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. description of service</h2>
            <p>
              Momento is a collaborative media platform that allows users to create shared Spaces, upload photos and videos,
              and invite others via access codes. We may modify, suspend, or discontinue any part of the Service at any time
              without liability or prior notice.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. account responsibility</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and authentication methods.
              You agree to accept responsibility for all activities that occur under your account, whether or not authorized by you.
              We are not liable for any loss or damage arising from unauthorized access to your account.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. user content and license</h2>
            <p>
              You retain ownership of any content you upload to the Service (“User Content”).
              By uploading User Content, you grant Momento a worldwide, non-exclusive, royalty-free license to host, store,
              display, and transmit such content solely for the purpose of operating and providing the Service.
            </p>
            <p>
              You represent and warrant that you have all necessary rights to upload and share your User Content and that
              such content does not infringe or violate any third-party rights.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. acceptable use</h2>
            <p>You agree not to use the Service to upload, share, or distribute content that:</p>
            <ul className={styles.list}>
              <li>Violates any applicable law or regulation</li>
              <li>Infringes intellectual property or privacy rights</li>
              <li>Contains unlawful, abusive, harassing, or harmful material</li>
              <li>Contains malware, viruses, or malicious code</li>
              <li>Contains explicit sexual content or extreme violence</li>
              <li>Impersonates another person or misrepresents affiliation</li>
            </ul>
            <p>
              We reserve the right to investigate and remove content or suspend accounts that violate these Terms.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. spaces and access control</h2>
            <p>
              Space owners are solely responsible for managing access to their Spaces, including distribution of invite codes.
              Momento does not control or monitor invite sharing and is not responsible for unauthorized access resulting from
              user negligence or sharing behavior.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. data and third-party services</h2>
            <p>
              The Service relies on third-party infrastructure providers, including authentication, storage, and hosting services.
              Your data may be processed and stored by these providers in accordance with their respective terms and policies.
              We are not responsible for failures, outages, or breaches caused by third-party providers.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without notice, if we reasonably
              believe you have violated these Terms or used the Service in a harmful manner. Upon termination,
              your right to use the Service will immediately cease, and your content may be deleted.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. disclaimer of warranties</h2>
            <p>
              The Service is provided on an “as is” and “as available” basis. We disclaim all warranties, express or implied,
              including merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the Service
              will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>11. limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Momento and its operators shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including loss of data, revenue, or goodwill, arising from your use
              of the Service.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>12. indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Momento and its operators from any claims, liabilities, damages,
              losses, or expenses arising from your use of the Service, your User Content, or your violation of these Terms.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>13. changes to terms</h2>
            <p>
              We may update these Terms at any time. If changes are material, we will notify users via email or within the Service.
              Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>14. governing law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the jurisdiction in which Momento operates,
              without regard to conflict of law principles. Any disputes shall be resolved in courts of competent jurisdiction
              in that location.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>15. contact</h2>
            <p>
              If you have questions about these Terms, please contact us at hi@momento.fyi. We will make reasonable efforts to respond promptly.
            </p>
          </section>

        </div>

        <div className={styles.footer}>
          <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
          <Link href="/" className={styles.footerLink}>Back to Momento</Link>
        </div>

      </div>
    </main>
  )
}