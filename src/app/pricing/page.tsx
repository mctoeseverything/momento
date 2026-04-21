import styles from './pricing.module.css'
import Link from 'next/link'

export default function PricingPage() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>momento</Link>
        <Link href="/" className={styles.backBtn}>back to home</Link>
      </nav>

      <div className={styles.hero}>
        <div className={styles.heroTag}>pricing</div>
        <h1 className={styles.heroTitle}>simple, honest pricing.</h1>
        <p className={styles.heroSub}>Start free. Upgrade when you need more.</p>
      </div>

      <div className={styles.body}>
        <div className={styles.plansGrid}>

          {/* Free Plan */}
          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <div className={styles.planName}>free</div>
              <div className={styles.planPrice}>
                <span className={styles.planPriceNum}>$0</span>
                <span className={styles.planPricePer}>forever</span>
              </div>
              <p className={styles.planDesc}>Everything you need to get started capturing moments together.</p>
              <Link href="/" className={styles.btnOutline}>get started →</Link>
            </div>
            <div className={styles.planFeatures}>
              <div className={styles.featureGroup}>
                <div className={styles.featureGroupTitle}>spaces</div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Up to 4 Spaces</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>1GB storage per Space</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Up to 45 members per Space</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Custom Space cover photo</span>
                </div>
              </div>
              <div className={styles.featureGroup}>
                <div className={styles.featureGroupTitle}>albums & photos</div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Unlimited albums</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Unlimited photo and video uploads</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Download individual photos</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Sort and filter photos</span>
                </div>
              </div>
              <div className={styles.featureGroup}>
                <div className={styles.featureGroupTitle}>sharing & access</div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Unique Space code and QR</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Access permission controls</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Pinned announcements</span>
                </div>
              </div>
              <div className={styles.featureGroup}>
                <div className={styles.featureGroupTitle}>not included</div>
                <div className={styles.featureMissing}>
                  <span className={styles.featureX}>✕</span>
                  <span>Download all as ZIP</span>
                </div>
                <div className={styles.featureMissing}>
                  <span className={styles.featureX}>✕</span>
                  <span>Photo reactions</span>
                </div>
                <div className={styles.featureMissing}>
                  <span className={styles.featureX}>✕</span>
                  <span>Comments on photos</span>
                </div>
                <div className={styles.featureMissing}>
                  <span className={styles.featureX}>✕</span>
                  <span>Plus badge on profile</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plus Plan */}
          <div className={`${styles.planCard} ${styles.planCardPlus}`}>
            <div className={styles.plusBadgeTop}>most popular</div>
            <div className={styles.planHeader}>
              <div className={styles.planName}>momento plus</div>
              <div className={styles.planPrice}>
                <span className={styles.planPriceNum}>$4.99</span>
                <span className={styles.planPricePer}>/month</span>
              </div>
              <div className={styles.planPriceAnnual}>or $39/year — save 2 months</div>
              <p className={styles.planDesc}>For power users, event organizers, and anyone who wants no limits.</p>
              <Link href="/" className={styles.btnLime}>get plus →</Link>
            </div>
            <div className={styles.planFeatures}>
              <div className={styles.featureGroup}>
                <div className={styles.featureGroupTitle}>spaces</div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span><strong>Unlimited</strong> Spaces</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span><strong>Unlimited</strong> storage per Space</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span><strong>Unlimited</strong> members per Space</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Custom Space cover photo</span>
                </div>
              </div>
              <div className={styles.featureGroup}>
                <div className={styles.featureGroupTitle}>albums & photos</div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Everything in Free</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Download entire Space as ZIP</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Download entire album as ZIP</span>
                </div>
              </div>
              <div className={styles.featureGroup}>
                <div className={styles.featureGroupTitle}>engagement</div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Photo reactions</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Comments on photos</span>
                </div>
              </div>
              <div className={styles.featureGroup}>
                <div className={styles.featureGroupTitle}>perks</div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Plus badge on profile</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Priority support</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Early access to new features</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Add-on teaser */}
        <div className={styles.addonCard}>
          <div className={styles.addonIcon}>⚡</div>
          <div className={styles.addonInfo}>
            <div className={styles.addonTitle}>storage add-ons coming soon</div>
            <div className={styles.addonDesc}>
              Need more storage for a specific Space? One-time storage packs will let you expand individual Spaces without a subscription. Perfect for one-off events.
            </div>
          </div>
          <div className={styles.addonTag}>soon</div>
        </div>

        {/* FAQ */}
        <div className={styles.faq}>
          <h2 className={styles.faqTitle}>questions</h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQ}>Can I cancel anytime?</h3>
              <p className={styles.faqA}>Yes — cancel whenever you want. You keep Plus access until the end of your billing period.</p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQ}>What happens if I hit my free limits?</h3>
              <p className={styles.faqA}>You will not lose any existing content. You just won't be able to create new Spaces or add members until you upgrade or free up space.</p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQ}>Can guests upload without a Plus account?</h3>
              <p className={styles.faqA}>Yes. Guests can join and upload to any Space regardless of whether they have a Plus account — only the Space owner needs Plus for the unlimited features.</p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQ}>Is my content safe if I downgrade?</h3>
              <p className={styles.faqA}>Yes. All your photos and videos are safe. You just lose access to Plus features until you resubscribe.</p>
            </div>
          </div>
        </div>

      </div>

      <footer className={styles.footer}>
        <span className={styles.footerLogo}>momento</span>
        <div className={styles.footerLinks}>
          <Link href="/terms" className={styles.footerLink}>terms of service</Link>
          <Link href="/privacy" className={styles.footerLink}>privacy policy</Link>
        </div>
      </footer>

    </main>
  )
}