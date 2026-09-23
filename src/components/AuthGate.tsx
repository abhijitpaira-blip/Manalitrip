import { useEffect, useState, type ReactNode } from 'react'
import { supabaseAuth } from '../lib/supabaseAuth'

type Role = 'ADMIN' | 'MEMBER' | 'PARENT' | 'CHILD'
type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED'

interface Member {
  id: string
  auth_user_id: string
  name: string
  email: string
  avatar_url: string | null
  family_name: string | null
  role: Role
  status: Status
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authUser, setAuthUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [authError, setAuthError] = useState('')

  const loadMember = async (user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => {
    const { data: existing } = await supabaseAuth.from('members').select('*').eq('auth_user_id', user.id).maybeSingle()
    if (existing) {
      setMember(existing as Member)
      return
    }
    const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string; picture?: string }
    const { data: created, error } = await supabaseAuth
      .from('members')
      .insert({
        auth_user_id: user.id,
        name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Member',
        email: user.email,
        avatar_url: meta.avatar_url || meta.picture || null,
      })
      .select('*')
      .single()
    if (error) {
      setAuthError('Could not create your member profile. Please try signing in again.')
      return
    }
    setMember((created as Member) || null)
  }

  useEffect(() => {
    supabaseAuth.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      setAuthUser(user)
      if (user) {
        void loadMember(user).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: subscription } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setAuthUser(user)
      if (user) {
        setLoading(true)
        void loadMember(user).finally(() => setLoading(false))
      } else {
        setMember(null)
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const signIn = async () => {
    setAuthError('')
    const { error } = await supabaseAuth.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setAuthError('Google sign-in is not configured yet. Please try again shortly.')
  }

  const signOut = () => {
    void supabaseAuth.auth.signOut()
  }

  const loadAllMembers = async () => {
    const { data } = await supabaseAuth.from('members').select('*').order('created_at', { ascending: true })
    setAllMembers((data as Member[]) || [])
  }

  const setMemberStatus = async (id: string, status: Status) => {
    await supabaseAuth.from('members').update({ status }).eq('id', id)
    void loadAllMembers()
  }

  const setMemberRole = async (id: string, role: Role) => {
    await supabaseAuth.from('members').update({ role }).eq('id', id)
    void loadAllMembers()
  }

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <span className="auth-mark">🏔️</span>
          <p>Loading your trip...</p>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <span className="auth-mark">🏔️</span>
          <h1>Himachal Family Trip 2026</h1>
          <p className="auth-tagline">Your family trip, all in one place.</p>
          <button className="google-button" onClick={signIn}>Continue with Google</button>
          <small>Sign in securely with your Google account.</small>
          {authError && <p className="auth-error">{authError}</p>}
        </div>
      </div>
    )
  }

  if (!member || member.status === 'PENDING') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Request sent</h1>
          <p className="auth-tagline">Your account is not yet approved for this trip.</p>
          <p>Access request sent to the Trip Admin. You will be let in automatically as soon as it is approved — no need to do anything else.</p>
          <button className="secondary-button" onClick={signOut}>Sign out</button>
        </div>
      </div>
    )
  }

  if (member.status === 'REJECTED') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Access not approved</h1>
          <p>The trip admin has not approved this account for access to the trip.</p>
          <button className="secondary-button" onClick={signOut}>Sign out</button>
        </div>
      </div>
    )
  }

  if (member.status === 'BLOCKED') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Access blocked</h1>
          <p>This account has been blocked by the trip admin.</p>
          <button className="secondary-button" onClick={signOut}>Sign out</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="auth-float">
        {member.avatar_url && <img src={member.avatar_url} alt={member.name} />}
        <span>{member.name}</span>
        {member.role === 'ADMIN' && (
          <button onClick={() => { setShowAdmin(true); void loadAllMembers() }}>Members</button>
        )}
        <button onClick={signOut}>Sign out</button>
      </div>

      {showAdmin && (
        <div className="destination-modal-overlay" onClick={() => setShowAdmin(false)}>
          <article className="destination-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAdmin(false)} aria-label="Close members panel">×</button>
            <div className="modal-body">
              <p className="eyebrow">ADMIN</p>
              <h2>Trip members</h2>
              {allMembers.map((row) => (
                <div className="member-row" key={row.id}>
                  <div className="member-row-info">
                    <strong>{row.name}</strong>
                    <small>{row.email}</small>
                  </div>
                  <span className={`status-pill status-${row.status.toLowerCase()}`}>{row.status}</span>
                  <div className="member-actions">
                    {row.status !== 'APPROVED' && <button className="text-button" onClick={() => setMemberStatus(row.id, 'APPROVED')}>Approve</button>}
                    {row.status !== 'REJECTED' && <button className="text-button" onClick={() => setMemberStatus(row.id, 'REJECTED')}>Reject</button>}
                    {row.status !== 'BLOCKED' && <button className="text-button" onClick={() => setMemberStatus(row.id, 'BLOCKED')}>Block</button>}
                    <select value={row.role} onChange={(event) => setMemberRole(row.id, event.target.value as Role)}>
                      <option value="MEMBER">MEMBER</option>
                      <option value="PARENT">PARENT</option>
                      <option value="CHILD">CHILD</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}

      {children}
    </>
  )
}
