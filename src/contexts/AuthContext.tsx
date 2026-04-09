import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { TeamMember } from '../types'

interface AuthContextType {
  user: SupabaseUser | null
  profile: TeamMember | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<TeamMember | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string, email?: string) => {
    // Try matching by id first (normal signup flow)
    const { data } = await supabase
      .from('intern_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (data) { setProfile(data as TeamMember); return }

    // Fallback: match by email (for members created via TeamManager with a random id)
    if (email) {
      const { data: emailMatch } = await supabase
        .from('intern_users')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      if (emailMatch) {
        // Link this auth user to the existing profile row
        await supabase
          .from('intern_users')
          .update({ id: userId })
          .eq('id', emailMatch.id)
        setProfile({ ...emailMatch, id: userId } as TeamMember)
      }
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.email)
  }

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7877/ingest/db881b4b-41b3-45a6-b8aa-216a512aebee',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e7c691'},body:JSON.stringify({sessionId:'e7c691',location:'AuthContext.tsx:57',message:'getSession starting',data:{},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // #region agent log
      fetch('http://127.0.0.1:7877/ingest/db881b4b-41b3-45a6-b8aa-216a512aebee',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e7c691'},body:JSON.stringify({sessionId:'e7c691',location:'AuthContext.tsx:60',message:'getSession resolved',data:{hasSession:!!session,userId:session?.user?.id?.slice(0,8)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) await fetchProfile(session.user.id, session.user.email)
      setLoading(false)
    }).catch((err: unknown) => {
      // #region agent log
      fetch('http://127.0.0.1:7877/ingest/db881b4b-41b3-45a6-b8aa-216a512aebee',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e7c691'},body:JSON.stringify({sessionId:'e7c691',location:'AuthContext.tsx:68',message:'getSession ERROR',data:{error:String(err)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // #region agent log
      fetch('http://127.0.0.1:7877/ingest/db881b4b-41b3-45a6-b8aa-216a512aebee',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e7c691'},body:JSON.stringify({sessionId:'e7c691',location:'AuthContext.tsx:74',message:'onAuthStateChange',data:{event:_event,hasSession:!!session,userId:session?.user?.id?.slice(0,8)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7877/ingest/db881b4b-41b3-45a6-b8aa-216a512aebee',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e7c691'},body:JSON.stringify({sessionId:'e7c691',location:'AuthContext.tsx:signIn',message:'signIn called',data:{email},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    // #region agent log
    fetch('http://127.0.0.1:7877/ingest/db881b4b-41b3-45a6-b8aa-216a512aebee',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e7c691'},body:JSON.stringify({sessionId:'e7c691',location:'AuthContext.tsx:signIn:result',message:'signIn result',data:{hasError:!!error,errorMsg:error?.message},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return { error: error as Error | null }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error as Error | null }

    if (data.user) {
      // Check if a row already exists for this email (admin-created via TeamManager)
      const { data: existing } = await supabase
        .from('intern_users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existing) {
        // Link existing row to this auth user
        await supabase
          .from('intern_users')
          .update({ id: data.user.id, display_name: displayName })
          .eq('email', email)
      } else {
        await supabase.from('intern_users').insert({
          id: data.user.id,
          email,
          display_name: displayName,
          role: 'member',
        })
      }
    }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      isAdmin: profile?.role === 'admin',
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
