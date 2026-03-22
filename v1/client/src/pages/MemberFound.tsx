import { useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import { MOCK_SAINTS } from '../data/mockData'

export default function MemberFound() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = params.get('id')
  const saint = MOCK_SAINTS.find((s) => s.id === id)

  const firstName = saint?.first_name ?? params.get('first') ?? 'Friend'
  const lastName = saint?.last_name ?? params.get('last') ?? ''
  const fullName = `${firstName} ${lastName}`.trim()

  const handleConfirm = () => {
    navigate(`/welcome?first=${encodeURIComponent(firstName)}&returning=true`)
  }

  const handleUpdate = () => {
    if (saint) {
      navigate(`/register?id=${saint.id}&first=${encodeURIComponent(saint.first_name)}&last=${encodeURIComponent(saint.last_name)}&update=true`)
    } else {
      navigate('/register')
    }
  }

  const handleNotMe = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="bg-inverse-surface pt-8 pb-10 px-6 flex flex-col items-center">
        <Logo size="md" theme="dark" />
      </header>

      {/* Card */}
      <main className="flex-1 -mt-4 rounded-t-[2rem] bg-surface-container-lowest px-6 pt-10 pb-12 animate-fade-up">
        <div className="max-w-sm mx-auto flex flex-col items-center gap-8 text-center">

          {/* Avatar placeholder */}
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center shadow-float">
            <span className="text-2xl font-extrabold text-primary">
              {firstName[0]}{lastName[0]}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-on-surface-variant font-medium">Welcome back,</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface leading-tight">
              {fullName}!
            </h1>
            <p className="text-sm text-on-surface-variant">
              We found your registration.
              <br />
              Would you like to?
            </p>
          </div>

          {/* Stats row */}
          {saint && (
            <div className="w-full bg-surface-container-low rounded-md px-6 py-4 flex items-center justify-around">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-extrabold text-on-surface">{saint.attendance_count}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Services</span>
              </div>
              <div className="w-px h-8 bg-surface-container-highest" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-extrabold text-on-surface">
                  {saint.whatsApp_group_consent ? (
                    <span className="material-symbols-outlined filled text-primary text-2xl">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-outline text-2xl">cancel</span>
                  )}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">WhatsApp</span>
              </div>
              <div className="w-px h-8 bg-surface-container-highest" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-extrabold text-on-surface">
                  {saint.student ? (
                    <span className="material-symbols-outlined filled text-tertiary text-2xl">school</span>
                  ) : (
                    <span className="material-symbols-outlined filled text-secondary text-2xl">work</span>
                  )}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {saint.student ? 'Student' : 'Working'}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="w-full flex flex-col gap-3">
            <button onClick={handleConfirm} className="btn-primary w-full text-base flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              Confirm Attendance
            </button>

            <button onClick={handleUpdate} className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Update My Details
            </button>

            <button onClick={handleNotMe} className="btn-tertiary w-full text-sm">
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
