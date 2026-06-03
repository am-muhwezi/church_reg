import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { getSaint, deleteSaint, updateSaint } from '../../api/saints'
import { ApiError } from '../../api/client'
import type { SaintWithStats } from '../../api/types'

type EditForm = {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  gender: string
  student: string
  occupation: string
  residence: string
  university: string
  institution_location: string
  first_time: string
  whatsApp_group_consent: boolean
  consent_to_share_info: boolean
}

export default function SaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [saint, setSaint] = useState<SaintWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [editError, setEditError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (id) getSaint(id).then(setSaint).finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteSaint(id)
      navigate('/admin/saints')
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.detail : 'Failed to delete member.')
      setDeleting(false)
    }
  }

  const startEditing = () => {
    if (!saint) return
    setEditForm({
      first_name: saint.first_name,
      last_name: saint.last_name,
      email: saint.email || '',
      phone_number: saint.phone_number || '',
      gender: saint.gender ? 'male' : 'female',
      student: saint.student ? 'yes' : 'no',
      occupation: saint.occupation || '',
      residence: saint.residence || '',
      university: saint.university || '',
      institution_location: saint.institution_location || '',
      first_time: saint.first_time ? 'yes' : 'no',
      whatsApp_group_consent: saint.whatsApp_group_consent,
      consent_to_share_info: saint.consent_to_share_info,
    })
    setEditing(true)
    setEditError('')
    setSuccessMsg('')
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditForm(null)
    setEditError('')
  }

  const handleSave = async () => {
    if (!id || !editForm) return
    setSaving(true)
    setEditError('')
    try {
      await updateSaint(id, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim() || null,
        phone_number: editForm.phone_number.trim() || null,
        gender: editForm.gender === 'male',
        student: editForm.student === 'yes',
        occupation: editForm.occupation.trim() || null,
        residence: editForm.residence.trim() || null,
        university: editForm.university.trim() || null,
        institution_location: editForm.institution_location.trim() || null,
        first_time: editForm.first_time === 'yes',
        whatsApp_group_consent: editForm.whatsApp_group_consent,
        consent_to_share_info: editForm.consent_to_share_info,
      })
      const updated = await getSaint(id)
      setSaint(updated)
      setEditing(false)
      setEditForm(null)
      setSuccessMsg('Member details updated successfully.')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (e) {
      setEditError(e instanceof ApiError ? e.detail : 'Failed to update member.')
    } finally {
      setSaving(false)
    }
  }

  const set = (field: keyof EditForm, value: string | boolean) =>
    setEditForm((prev) => prev ? { ...prev, [field]: value } : prev)

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <div className="h-5 w-24 bg-surface-container-high rounded animate-pulse" />
        <div className="bg-surface-container-lowest rounded-md shadow-card p-8 flex gap-6 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-surface-container-high flex-shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-6 bg-surface-container-high rounded w-1/2" />
            <div className="h-4 bg-surface-container-high rounded w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!saint) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 px-6 text-center">
        <span className="material-symbols-outlined text-5xl text-outline">person_off</span>
        <p className="text-lg font-bold text-on-surface">Saint not found</p>
        <button onClick={() => navigate('/admin/saints')} className="btn-secondary text-sm">
          Back to Saints
        </button>
      </div>
    )
  }

  function RadioGroup({ name, options, value, onChange }: { name: string; options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
    return (
      <div className="flex bg-surface-container-highest p-0.5 rounded-full w-fit">
        {options.map((opt) => (
          <label key={opt.value} className="cursor-pointer">
            <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} className="hidden" />
            <span className={`block px-4 py-1.5 rounded-full text-xs font-bold transition-all ${value === opt.value ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}>
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    )
  }

  const inputCls = 'field-input text-sm'

  return (
    <div className="p-6 md:p-10">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/saints')}
        className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-8"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Saints
      </button>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-primary-container/10 rounded-md border-l-4 border-primary-container mb-6 animate-fade-in">
          <span className="material-symbols-outlined text-primary-container text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <p className="text-sm font-semibold text-primary">{successMsg}</p>
        </div>
      )}

      {/* Profile hero */}
      <div className="bg-surface-container-lowest rounded-md shadow-card p-8 mb-8 flex flex-col md:flex-row items-start gap-6">
        <div className="w-20 h-20 flex-shrink-0 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-extrabold text-2xl">
          {saint.first_name[0]}{saint.last_name[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-3 mb-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
              {saint.first_name} {saint.last_name}
            </h1>
            {saint.first_time && (
              <span className="px-3 py-1 bg-tertiary-container/40 text-tertiary text-[10px] font-black uppercase tracking-wider rounded-full self-center">
                First-time
              </span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant mb-4">
            {saint.student ? (saint.university || 'Student') : (saint.occupation || '—')}
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Services Attended</span>
              <span className="text-2xl font-extrabold text-on-surface">{saint.attendance_count}</span>
            </div>
            <div className="w-px h-10 bg-surface-container-highest self-center" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Last Seen</span>
              <span className="text-sm font-bold text-on-surface">{formatDate(saint.last_seen ?? null)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 self-start">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-3 py-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">{saving ? 'progress_activity' : 'save'}</span>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={cancelEditing} disabled={saving} className="btn-tertiary text-sm px-3 py-2 flex items-center gap-1">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={startEditing} className="btn-secondary text-sm px-3 py-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="btn-tertiary text-sm px-3 py-2 flex items-center gap-1 text-error hover:bg-error/10 transition-colors">
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit error */}
      {editError && (
        <div className="flex items-start gap-3 p-4 bg-error/10 rounded-md border border-error/20 mb-6 animate-fade-in">
          <span className="material-symbols-outlined text-error text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <p className="text-sm font-semibold text-on-surface">{editError}</p>
        </div>
      )}

      {/* Details / Edit form */}
      <div className="sacred-card p-6 md:p-8">
        <p className="section-label mb-6">Member Details</p>

        {editing && editForm ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="First Name">
              <input className={inputCls} value={editForm.first_name} onChange={(e) => set('first_name', e.target.value)} />
            </Field>
            <Field label="Last Name">
              <input className={inputCls} value={editForm.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </Field>
            <Field label="Email">
              <input className={inputCls} type="email" value={editForm.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className={inputCls} type="tel" value={editForm.phone_number} onChange={(e) => set('phone_number', e.target.value)} />
            </Field>
            <Field label="Gender">
              <RadioGroup name="gender" options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]} value={editForm.gender} onChange={(v) => set('gender', v)} />
            </Field>
            <Field label="Student">
              <RadioGroup name="student" options={[{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }]} value={editForm.student} onChange={(v) => set('student', v)} />
            </Field>
            <Field label="Occupation">
              <input className={inputCls} value={editForm.occupation} onChange={(e) => set('occupation', e.target.value)} disabled={editForm.student === 'yes'} />
            </Field>
            <Field label="Residence">
              <input className={inputCls} value={editForm.residence} onChange={(e) => set('residence', e.target.value)} />
            </Field>
            <Field label="University">
              <input className={inputCls} value={editForm.university} onChange={(e) => set('university', e.target.value)} disabled={editForm.student === 'no'} />
            </Field>
            <Field label="Institution Location">
              <input className={inputCls} value={editForm.institution_location} onChange={(e) => set('institution_location', e.target.value)} disabled={editForm.student === 'no'} />
            </Field>
            <Field label="First-time Visitor">
              <RadioGroup name="first_time" options={[{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }]} value={editForm.first_time} onChange={(v) => set('first_time', v)} />
            </Field>
            <Field label="WhatsApp Consent">
              <RadioGroup name="whatsApp_group_consent" options={[{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }]} value={editForm.whatsApp_group_consent ? 'yes' : 'no'} onChange={(v) => set('whatsApp_group_consent', v === 'yes')} />
            </Field>
            <Field label="Data Sharing Consent">
              <RadioGroup name="consent_to_share_info" options={[{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }]} value={editForm.consent_to_share_info ? 'yes' : 'no'} onChange={(v) => set('consent_to_share_info', v === 'yes')} />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: 'mail', label: 'Email', value: saint.email || '—' },
              { icon: 'call', label: 'Phone', value: saint.phone_number || '—' },
              { icon: 'home', label: 'Residence', value: saint.residence || '—' },
              { icon: saint.gender ? 'man' : 'woman', label: 'Gender', value: saint.gender ? 'Male' : 'Female' },
              { icon: 'work', label: 'Occupation', value: saint.student ? '—' : (saint.occupation || '—') },
              { icon: 'school', label: 'Student', value: saint.student ? 'Yes' : 'No' },
              ...(saint.student ? [
                { icon: 'account_balance', label: 'University', value: saint.university || '—' },
                { icon: 'location_on', label: 'Institution Location', value: saint.institution_location || '—' },
              ] : []),
              { icon: 'star', label: 'First-time visitor', value: saint.first_time ? 'Yes' : 'No' },
              { icon: 'chat', label: 'WhatsApp consent', value: saint.whatsApp_group_consent ? 'Yes' : 'No' },
              { icon: 'shield', label: 'Data sharing consent', value: saint.consent_to_share_info ? 'Yes' : 'No' },
              { icon: 'event', label: 'Registered on', value: formatDate(saint.created_at) },
              { icon: 'update', label: 'Last updated', value: formatDate(saint.updated_at) },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-4 bg-surface-container-low rounded-md">
                <span className="material-symbols-outlined text-primary-container text-[20px] flex-shrink-0 mt-0.5">{icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-on-surface truncate">{String(value)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-2xl">warning</span>
              <h2 className="text-lg font-bold text-on-surface">Delete member?</h2>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">
              Are you sure you want to delete <strong className="text-on-surface">{saint.first_name} {saint.last_name}</strong>?
              This action cannot be undone.
            </p>

            {deleteError && (
              <p className="text-xs text-error mb-4 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm px-4 py-2 font-bold rounded-md bg-error text-on-error active:scale-[0.98] transition-all hover:shadow-lg hover:shadow-error/20 flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant ml-1">{label}</label>
      {children}
    </div>
  )
}
