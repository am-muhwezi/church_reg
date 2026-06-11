import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import { checkInSaint } from '../api/saints'
import type { Saint } from '../api/types'


export default function MemberFound() {
  const navigate = useNavigate()
  const location = useLocation()
  const saint: Saint | undefined = location.state?.saint

  const firstName = saint?.first_name ?? 'Friend'
  const lastName = saint?.last_name ?? ''
  const fullName = `${firstName} ${lastName}`.trim()

  useEffect(() => {
    if (!saint) navigate('/', { replace: true })
  }, [])

  const [loading, setLoading] = useState(false)
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (!saint) return
    setLoading(true)
    setError('')
    try {
      const result = await checkInSaint(saint.id, 'confirmed')
      if (result.already_checked_in) {
        setAlreadyCheckedIn(true)
      } else {
        navigate(`/welcome?first=${encodeURIComponent(firstName)}&returning=true`, { replace: true })
      }
    } catch {
      setError('Check-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = () => {
    if (saint) {
      navigate(`/register?id=${saint.id}&update=true`, { state: { saint } })
    }
  }

  if (!saint) return null

  if (alreadyCheckedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <header className="bg-inverse-surface pt-8 pb-10 px-6 flex flex-col items-center">
          <Logo size="md" theme="dark" />
        </header>
        <main className="flex-1 -mt-4 rounded-t-[2rem] bg-surface-container-lowest px-6 pt-12 pb-12 animate-fade-up">
          <div className="max-w-sm mx-auto flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">Already checked in!</h1>
              <p className="text-sm text-on-surface-variant">
                {fullName}, you've already checked in for today's service.
                <br />God bless you!
              </p>
            </div>
            <button
              onClick={() => navigate(`/welcome?first=${encodeURIComponent(firstName)}&returning=true`, { replace: true })}
              className="btn-primary w-full text-base"
            >
              Continue
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-inverse-surface pt-8 pb-10 px-6 flex flex-col items-center">
        <Logo size="md" theme="dark" />
      </header>

      <main className="flex-1 -mt-4 rounded-t-[2rem] bg-surface-container-lowest px-6 pt-10 pb-12 animate-fade-up">
        <div className="max-w-sm mx-auto flex flex-col gap-6">

          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center shadow-float">
              <span className="text-2xl font-extrabold text-primary">
                {firstName[0]}{lastName[0]}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-on-surface-variant font-medium">Welcome back,</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-surface leading-tight">{fullName}!</h1>
              <p className="text-sm text-on-surface-variant">
                We found your registration.
                <br />Would you like to?
              </p>
            </div>
          </div>

          {error && <p className="text-xs text-error font-semibold text-center">{error}</p>}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="btn-primary w-full text-base flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Confirm Details &amp; Check In
                </>
              )}
            </button>

            <button onClick={handleUpdate} className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Update My Details
            </button>

            <button onClick={() => navigate('/')} className="btn-tertiary w-full text-sm">
              I'm not {fullName}
            </button>
          </div>

        </div>
      </main>

      <footer className="bg-surface-container-lowest pb-8 text-center">
        <p className="text-[10px] text-outline">
          <span className="font-bold">© 2026</span> Manifest Fellowship Kenya. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
