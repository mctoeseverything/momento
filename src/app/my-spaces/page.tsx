'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from './my-spaces.module.css'

type Space = {
  id: string
  name: string
  description: string
  emoji: string
  code: string
  created_at: string
}

export default function MySpacesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [joinedSpaces, setJoinedSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) { router.push('/'); return }
      setUser(data.session.user)
      fetchSpaces(data.session.user.id)
    })
  }, [])

  async function fetchSpaces(userId: string) {
    setLoading(true)

    // Spaces you own
    const { data: owned } = await supabase
      .from('spaces')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    setSpaces(owned || [])

    // Spaces you joined
    const { data: memberRows } = await supabase
      .from('space_members')
      .select('space_id')
      .eq('user_id', userId)

    if (memberRows && memberRows.length > 0) {
      const ids = memberRows.map(r => r.space_id)
      const { data: joined } = await supabase
        .from('spaces')
        .select('*')
        .in('id', ids)
        .neq('owner_id', userId)
        .order('created_at', { ascending: false })
      setJoinedSpaces(joined || [])
    }

    setLoading(false)
  }

  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.logo} onClick={() => router.push('/')}>momento</div>
        <button className={styles.btnOutlineSmall} onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>
          sign out
        </button>
      </nav>

      <div className={styles.body}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>my spaces</h1>
          <p className={styles.pageSub}>{user?.email}</p>
        </div>

        {loading ? (
          <div className={styles.loadingDots}><span /><span /><span /></div>
        ) : (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>spaces i own</h2>
              <span className={styles.sectionCount}>{spaces.length}</span>
            </div>

            {spaces.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✦</div>
                <h3 className={styles.emptyTitle}>no spaces yet</h3>
                <p className={styles.emptySub}>Head back home to create your first Space.</p>
                <button className={styles.btnLime} onClick={() => router.push('/')}>create a space →</button>
              </div>
            ) : (
              <div className={styles.spacesGrid}>
                {spaces.map(space => (
                  <div key={space.id} className={styles.spaceCard} onClick={() => router.push('/space/' + space.code)}>
                    <div className={styles.spaceCardEmoji}>{space.emoji}</div>
                    <div className={styles.spaceCardInfo}>
                      <div className={styles.spaceCardName}>{space.name}</div>
                      {space.description && (
                        <div className={styles.spaceCardDesc}>{space.description}</div>
                      )}
                      <div className={styles.spaceCardMeta}>
                        <span className={styles.codeChip}>{space.code}</span>
                        <span className={styles.spaceCardDate}>
                          {new Date(space.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {joinedSpaces.length > 0 && (
              <>
                <div className={styles.sectionHeader} style={{ marginTop: '3rem' }}>
                  <h2 className={styles.sectionTitle}>spaces i joined</h2>
                  <span className={styles.sectionCount}>{joinedSpaces.length}</span>
                </div>
                <div className={styles.spacesGrid}>
                  {joinedSpaces.map(space => (
                    <div key={space.id} className={styles.spaceCard} onClick={() => router.push('/space/' + space.code)}>
                      <div className={styles.spaceCardEmoji}>{space.emoji}</div>
                      <div className={styles.spaceCardInfo}>
                        <div className={styles.spaceCardName}>{space.name}</div>
                        {space.description && (
                          <div className={styles.spaceCardDesc}>{space.description}</div>
                        )}
                        <div className={styles.spaceCardMeta}>
                          <span className={styles.codeChip}>{space.code}</span>
                          <span className={styles.spaceCardDate}>
                            {new Date(space.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}