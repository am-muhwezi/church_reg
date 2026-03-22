import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)

    // Mock: any credentials work
    if (email && password) {
      navigate('/admin')
    } else {
      setError('Please enter your email and password.')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-container/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-secondary-container/10 rounded-full blur-[60px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <Logo size="md" theme="light" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant mt-4">
            Ecclesiastical Management
          </p>
        </div>

        {/* Sacred card */}
        <div className="sacred-card p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">
              Secure Access
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Authenticate with your ministry credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">
                Work Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] group-focus-within:text-primary transition-colors">
                  mail
                </span>
                <input
                  type="email"
                  className="field-input pl-9"
                  placeholder="admin@manifest.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant">
                  Security Key
                </label>
                <button type="button" className="text-[10px] font-bold text-primary hover:underline">
                  Recover Access
                </button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="field-input pl-9 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-error font-semibold">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              ) : (
                <>
                  <span className="tracking-widest text-sm">LOG IN</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer meta */}
        <div className="mt-10 text-center">
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            © 2026 Manifest Fellowship Kenya Outreach.
            <br />
            Protected by end-to-end ecclesiastical encryption.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            {['Privacy', 'Terms', 'Support'].map((l) => (
              <button key={l} className="text-[10px] font-bold text-outline hover:text-primary uppercase tracking-widest transition-colors">
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
