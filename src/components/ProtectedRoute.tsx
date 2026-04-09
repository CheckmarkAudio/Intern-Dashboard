import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }: {
  children: React.ReactNode
  adminOnly?: boolean
}) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold/20 border-t-gold" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
