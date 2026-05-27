import { useState, useEffect, useRef, FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import { eventRegisterSaint } from '../api/saints'
import { ApiError } from '../api/client'

type FieldErrors = Record<string, string>

type RadioGroupProps = {
  name: string
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}

function RadioGroup({ name, options, value, onChange }: RadioGroupProps) {
  return (
    <div className="flex bg-surface-container-highest p-1 rounded-full w-full">
      {options.map((opt) => (
        <label key={opt.value} className="flex-1 text-center cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="hidden"
          />
          <span
            className={`block px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              value === opt.value
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  )
}

export default function EventRegister() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const firstNameRef = useRef<HTMLInputElement>(null)
  const lastNameRef = useRef<HTMLInputElement>(null)
  const phoneNumberRef = useRef<HTMLInputElement>(null)
  const instOrProfRef = useRef<HTMLInputElement>(null)

  const refs = {
    firstNameRef, lastNameRef, phoneNumberRef, instOrProfRef,
  }

  const FIELD_REFS: Record<string, keyof typeof refs> = {
    first_name: 'firstNameRef',
    last_name: 'lastNameRef',
    phone_number: 'phoneNumberRef',
    institution_or_profession: 'instOrProfRef',
  }

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'male',
    phone_number: '',
    student: 'yes',
    institution_or_profession: '',
    first_time: 'yes',
    consent: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    const first = params.get('first')
    const last = params.get('last')
    if (first || last) {
      setForm((prev) => ({ ...prev, first_name: first || '', last_name: last || '' }))
    }
  }, [])

  useEffect(() => {
    for (const [serverField, refKey] of Object.entries(FIELD_REFS)) {
      if (fieldErrors[serverField]) {
        const el = refs[refKey as keyof typeof refs].current
        el?.focus()
        break
      }
    }
  }, [fieldErrors])

  const set = (key: keyof typeof form, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    const errs: FieldErrors = {}
    if (!form.first_name.trim()) errs.first_name = 'First name is required.'
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.'

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      setError(Object.values(errs)[0])
      return
    }

    if (!form.consent) {
      setError('You must consent to the data protection notice to continue.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const saint = await eventRegisterSaint({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        gender: form.gender === 'male',
        phone_number: form.phone_number.trim() || null,
        student: form.student === 'yes',
        institution_or_profession: form.institution_or_profession.trim() || null,
        first_time: form.first_time === 'yes',
        consent: form.consent,
      })
      navigate(`/welcome?first=${encodeURIComponent(saint.first_name)}&returning=false&redirect=/event`, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.data?.detail) {
        const detail = err.data.detail
        if (typeof detail === 'object' && detail !== null && 'field' in detail) {
          const sd = detail as { field: string; message: string }
          setFieldErrors({ [sd.field]: sd.message })
          setError(sd.message)
        } else {
          setError(typeof detail === 'string' ? detail : 'Registration failed. Please try again.')
        }
      } else {
        setError('Registration failed. Please try again.')
      }
      setLoading(false)
    }
  }

  const inputClass = (field: string) =>
    `field-input ${fieldErrors[field] ? 'border-error ring-1 ring-error' : ''}`

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-inverse-surface pt-8 pb-10 px-6 flex flex-col items-center gap-3">
        <Logo size="md" theme="dark" />
        <p className="text-white/60 text-xs font-medium tracking-wide">
          Event Registration
        </p>
      </header>

      <main className="flex-1 -mt-4 rounded-t-[2rem] bg-surface-container-lowest animate-fade-up">
        <form onSubmit={handleSubmit} className="px-6 pt-6 pb-12">
          <div className="max-w-sm mx-auto space-y-6">

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">
                First Name
              </label>
              <input
                ref={firstNameRef}
                className={inputClass('first_name')}
                placeholder="John"
                value={form.first_name}
                onChange={(e) => { set('first_name', e.target.value); setFieldErrors((prev) => { const n = { ...prev }; delete n.first_name; return n }) }}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">
                Last Name
              </label>
              <input
                ref={lastNameRef}
                className={inputClass('last_name')}
                placeholder="Doe"
                value={form.last_name}
                onChange={(e) => { set('last_name', e.target.value); setFieldErrors((prev) => { const n = { ...prev }; delete n.last_name; return n }) }}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">
                Gender
              </label>
              <RadioGroup
                name="gender"
                options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]}
                value={form.gender}
                onChange={(v) => set('gender', v)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">
                Phone Number
              </label>
              <input
                ref={phoneNumberRef}
                className={inputClass('phone_number')}
                type="tel"
                placeholder="0712345678"
                value={form.phone_number}
                onChange={(e) => { set('phone_number', e.target.value); setFieldErrors((prev) => { const n = { ...prev }; delete n.phone_number; return n }) }}
              />
            </div>

            <div className="p-5 bg-surface-container-low rounded-md flex flex-col gap-3">
              <div>
                <h4 className="font-bold text-sm text-on-surface">Are you a student?</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">Select Yes to enter your institution.</p>
              </div>
              <RadioGroup
                name="student"
                options={[{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }]}
                value={form.student}
                onChange={(v) => { set('student', v); set('institution_or_profession', '') }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">
                {form.student === 'yes' ? 'Institution' : 'Profession'}
              </label>
              <input
                ref={instOrProfRef}
                className={inputClass('institution_or_profession')}
                placeholder={form.student === 'yes' ? 'e.g. University of Nairobi' : 'e.g. Software Engineer'}
                value={form.institution_or_profession}
                onChange={(e) => { set('institution_or_profession', e.target.value); setFieldErrors((prev) => { const n = { ...prev }; delete n.institution_or_profession; return n }) }}
              />
            </div>

            <div className="p-5 bg-surface-container-low rounded-md flex flex-col gap-3">
              <div>
                <h4 className="font-bold text-sm text-on-surface">Is this your first time?</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">First time attending the physical service?</p>
              </div>
              <RadioGroup
                name="first_time"
                options={[{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }]}
                value={form.first_time}
                onChange={(v) => set('first_time', v)}
              />
            </div>

            <div className="sacred-card p-5">
              <h4 className="text-xs font-extrabold uppercase tracking-[0.15em] text-primary mb-3">
                Data Protection Notice
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                Manifest Fellowship would like to hold and use the information you have provided for the following purposes:
              </p>
              <ul className="space-y-2">
                {[
                  'To keep you informed of events, services, and ministry communications.',
                  'To share your contact details with our teams for experience sharing.',
                  'To use your photographs/videos taken at our events on our communication materials.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-0.5 flex-shrink-0">check</span>
                    {item}
                  </li>
                ))}
              </ul>

              <label className="flex items-start gap-3 mt-5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => set('consent', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-primary-container"
                />
                <span className="text-xs text-on-surface font-semibold group-hover:text-primary transition-colors">
                  I consent to Manifest Fellowship collecting and using my information as described above.
                </span>
              </label>
            </div>

            {error && Object.keys(fieldErrors).length === 0 && (
              <p className="text-xs text-error font-semibold px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !form.consent}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {loading ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              ) : (
                <>
                  Register & Check In
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}