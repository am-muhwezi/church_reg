import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { searchSaint } from '../data/mockData'

export default function CheckIn() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both your first and last name.')
      return
    }
    setError('')
    setLoading(true)

    // Simulate API latency
    await new Promise((r) => setTimeout(r, 600))

    const found = searchSaint(firstName, lastName)
    setLoading(false)

    if (found) {
      navigate(`/confirm?id=${found.id}&first=${encodeURIComponent(found.first_name)}&last=${encodeURIComponent(found.last_name)}`)
    } else {
      navigate(`/register?first=${encodeURIComponent(firstName.trim())}&last=${encodeURIComponent(lastName.trim())}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="bg-inverse-surface pt-8 pb-10 px-6 flex flex-col items-center">
        <Logo size="md" theme="dark" />
      </header>

      {/* Card */}
      <main className="flex-1 -mt-4 rounded-t-[2rem] bg-surface-container-lowest px-6 pt-10 pb-12 animate-fade-up">
        <div className="max-w-sm mx-auto flex flex-col gap-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-on-surface leading-tight">
              Welcome to Church today!
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Enter your name to check in to today's service.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">
                First Name
              </label>
              <input
                className="field-input text-base"
                placeholder="e.g. Samuel"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
                autoComplete="given-name"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">
                Last Name
              </label>
              <input
                className="field-input text-base"
                placeholder="e.g. Mwangi"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>

            {error && (
              <p className="text-xs text-error font-semibold px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base mt-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  Searching...
                </>
              ) : (
                <>
                  Continue
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-surface-container-highest" />
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-surface-container-highest" />
          </div>

          <button
            onClick={() => navigate('/register')}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Register as a new member
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest px-6 pb-10 flex flex-col items-center gap-4">
        {/* Social icons */}
        <div className="flex items-center gap-6">
          {['Facebook', 'X', 'Instagram', 'TikTok'].map((platform) => (
            <button key={platform} className="text-outline hover:text-primary transition-colors p-1">
              <SocialIcon platform={platform} />
            </button>
          ))}
        </div>
        <p className="text-[10px] text-outline text-center leading-relaxed">
          <span className="font-bold">© 2026</span> Manifest Fellowship Kenya.
          <br />
          All rights reserved.
        </p>
      </footer>
    </div>
  )
}

function SocialIcon({ platform }: { platform: string }) {
  const icons: Record<string, JSX.Element> = {
    Facebook: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    X: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    Instagram: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    TikTok: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
      </svg>
    ),
  }
  return icons[platform] ?? null
}
