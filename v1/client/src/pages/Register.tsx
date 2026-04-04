import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import { registerSaint, checkInSaint, updateSaint, getSaint } from '../api/saints'

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

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isUpdate = params.get('update') === 'true'
  const editId = params.get('id')

  const [form, setForm] = useState({
    first_name: params.get('first') ?? '',
    last_name: params.get('last') ?? '',
    email: '',
    phone_number: '',
    gender: 'male',
    student: 'no',
    occupation: '',
    residence: '',
    university: '',
    institution_location: '',
    first_time: 'yes',
    whatsApp_group_consent: 'no',
    consent_to_share_info: true,
  })
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [step1Error, setStep1Error] = useState('')
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (isUpdate && editId) {
      getSaint(editId).then((saint) => {
        setForm({
          first_name: saint.first_name,
          last_name: saint.last_name,
          email: saint.email ?? '',
          phone_number: saint.phone_number ?? '',
          gender: saint.gender ? 'male' : 'female',
          student: saint.student ? 'yes' : 'no',
          occupation: saint.occupation ?? '',
          residence: saint.residence ?? '',
          university: saint.university ?? '',
          institution_location: saint.institution_location ?? '',
          first_time: saint.first_time ? 'yes' : 'no',
          whatsApp_group_consent: saint.whatsApp_group_consent ? 'yes' : 'no',
          consent_to_share_info: saint.consent_to_share_info,
        })
      })
    }
  }, [])

  const set = (key: keyof typeof form, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError('')
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || null,
      phone_number: form.phone_number || null,
      gender: form.gender === 'male',
      student: form.student === 'yes',
      occupation: form.student === 'yes' ? null : (form.occupation || null),
      residence: form.residence || null,
      university: form.student === 'yes' ? (form.university || null) : null,
      institution_location: form.student === 'yes' ? (form.institution_location || null) : null,
      first_time: form.first_time === 'yes',
      whatsApp_group_consent: form.whatsApp_group_consent === 'yes',
      consent_to_share_info: form.consent_to_share_info,
    }
    try {
      if (isUpdate && editId) {
        const saint = await updateSaint(editId, payload)
        navigate(`/welcome?first=${encodeURIComponent(saint.first_name)}&returning=true`)
      } else {
        const saint = await registerSaint(payload)
        await checkInSaint(saint.id)
        navigate(`/welcome?first=${encodeURIComponent(saint.first_name)}&returning=false`)
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  const TOTAL_STEPS = 3

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="bg-inverse-surface pt-8 pb-10 px-6 flex flex-col items-center gap-3">
        <Logo size="md" theme="dark" />
        <p className="text-white/60 text-xs font-medium tracking-wide">
          {isUpdate ? 'Update your details' : 'New member registration'}
        </p>
      </header>

      {/* Card */}
      <main className="flex-1 -mt-4 rounded-t-[2rem] bg-surface-container-lowest animate-fade-up">
        {/* Progress bar */}
        <div className="flex gap-1 px-6 pt-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                background: i < step ? '#fca21e' : '#e7e8e8',
              }}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-6 pb-12">
          <div className="max-w-sm mx-auto space-y-10">

            {/* Step 1: Identity */}
            {step === 1 && (
              <section className="space-y-6 animate-fade-up">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center text-primary font-bold text-xs">
                    01
                  </div>
                  <h2 className="text-lg font-bold text-on-surface tracking-tight">Personal Identity</h2>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">First Name</label>
                  <input className="field-input" placeholder="Samuel" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">Last Name</label>
                  <input className="field-input" placeholder="Mwangi" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">Email Address</label>
                  <input className="field-input" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">Phone Number</label>
                  <input className="field-input" type="tel" placeholder="e.g. 0712345678 or +254712345678" value={form.phone_number} onChange={(e) => set('phone_number', e.target.value)} />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">Gender</label>
                  <RadioGroup
                    name="gender"
                    options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]}
                    value={form.gender}
                    onChange={(v) => set('gender', v)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">Residence</label>
                  <input className="field-input" placeholder="City, Town, Estate…" value={form.residence} onChange={(e) => set('residence', e.target.value)} />
                </div>

                {step1Error && (
                  <p className="text-xs text-error font-semibold px-1">{step1Error}</p>
                )}

                <button
                  type="button"
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    if (!form.first_name.trim() || !form.last_name.trim()) {
                      setStep1Error('First name and last name are required.')
                      return
                    }
                    setStep1Error('')
                    setStep(2)
                  }}
                >
                  Next <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </section>
            )}

            {/* Step 2: Affiliation */}
            {step === 2 && (
              <section className="space-y-6 animate-fade-up">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center text-primary font-bold text-xs">
                    02
                  </div>
                  <h2 className="text-lg font-bold text-on-surface tracking-tight">Affiliation & Status</h2>
                </div>

                <div className="p-5 bg-surface-container-low rounded-md flex flex-col gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">Student Status</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Are you currently enrolled in an educational institution?</p>
                  </div>
                  <RadioGroup
                    name="student"
                    options={[{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }]}
                    value={form.student}
                    onChange={(v) => set('student', v)}
                  />
                </div>

                {form.student === 'yes' ? (
                  <div className="flex flex-col gap-4 animate-fade-up">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">University / Institution</label>
                      <input
                        className="field-input"
                        placeholder="e.g. University of Nairobi"
                        value={form.university}
                        onChange={(e) => set('university', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">Institution Location</label>
                      <input
                        className="field-input"
                        placeholder="e.g. Nairobi, Westlands Campus"
                        value={form.institution_location}
                        onChange={(e) => set('institution_location', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 animate-fade-up">
                    <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant ml-1">Occupation</label>
                    <input
                      className="field-input"
                      placeholder="e.g. Software Engineer"
                      value={form.occupation}
                      onChange={(e) => set('occupation', e.target.value)}
                    />
                  </div>
                )}

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

                <div className="flex gap-3">
                  <button type="button" className="btn-secondary flex-1 text-sm" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button type="button" className="btn-primary flex-1 flex items-center justify-center gap-1 text-sm" onClick={() => setStep(3)}>
                    Next <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </section>
            )}

            {/* Step 3: Community + Consent */}
            {step === 3 && (
              <section className="space-y-6 animate-fade-up">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center text-primary font-bold text-xs">
                    03
                  </div>
                  <h2 className="text-lg font-bold text-on-surface tracking-tight">Community & Consent</h2>
                </div>

                <div className="p-5 bg-surface-container-low rounded-md flex flex-col gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">Join our WhatsApp Group?</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Receive sermons, daily devotionals, and timely ministry updates.</p>
                  </div>
                  <RadioGroup
                    name="whatsapp"
                    options={[{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }]}
                    value={form.whatsApp_group_consent}
                    onChange={(v) => set('whatsApp_group_consent', v)}
                  />
                </div>

                {/* Data Protection Notice */}
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
                      checked={form.consent_to_share_info}
                      onChange={(e) => set('consent_to_share_info', e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-primary-container"
                    />
                    <span className="text-xs text-on-surface font-semibold group-hover:text-primary transition-colors">
                      I consent to Manifest Fellowship collecting and using my information as described above.
                    </span>
                  </label>
                </div>

                {submitError && (
                  <p className="text-xs text-error font-semibold px-1">{submitError}</p>
                )}

                <div className="flex gap-3">
                  <button type="button" className="btn-secondary flex-1 text-sm" onClick={() => setStep(2)}>
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !form.consent_to_share_info}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    ) : (
                      <>
                        {isUpdate ? 'Save Changes' : 'Complete'}
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </>
                    )}
                  </button>
                </div>
              </section>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}
