import { useEffect, useState } from 'react'
import { listAdmins, createAdmin, deleteAdmin } from '../../api/auth'
import { ApiError } from '../../api/client'
import type { Admin } from '../../api/types'
import { useAuth } from '../../context/AuthContext'

export default function AdminSettings() {
  const { isSuperAdmin, adminId } = useAuth()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', is_super_admin: false })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    listAdmins().then(setAdmins).finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return
    setSaving(true)
    setError('')
    try {
      const newAdmin = await createAdmin(form)
      setAdmins((prev) => [...prev, newAdmin])
      setForm({ name: '', email: '', password: '', is_super_admin: false })
      setShowForm(false)
      showToast('Admin created successfully.')
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : 'Failed to create admin.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await deleteAdmin(id)
      setAdmins((prev) => prev.filter((a) => a.id !== id))
      showToast('Admin removed.')
    } catch (e) {
      showToast(e instanceof ApiError ? e.detail : 'Failed to remove admin.')
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="p-6 md:p-10 space-y-10">
      {/* Header */}
      <section>
        <p className="section-label mb-1">System Management</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Admin Management</h1>
      </section>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-primary-container/10 rounded-md border-l-4 border-primary-container animate-fade-in">
          <span className="material-symbols-outlined text-primary-container text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <p className="text-sm font-semibold text-primary">{toast}</p>
        </div>
      )}

      {/* Admins list */}
      <div className="bg-surface-container-lowest rounded-md shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-surface-container">
          <p className="section-label">Current Admins ({loading ? '…' : admins.length})</p>
          {isSuperAdmin && (
            <button
              onClick={() => { setShowForm(!showForm); setError('') }}
              className="btn-primary text-xs px-3 py-2 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              New Admin
            </button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="px-6 py-5 bg-surface-container-low border-b border-surface-container space-y-4">
            <p className="text-sm font-bold text-on-surface">Create New Admin</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant ml-1">Full Name</label>
                <input className="field-input" placeholder="Pastor John" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant ml-1">Work Email</label>
                <input className="field-input" type="email" placeholder="admin@manifest.ke" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant ml-1">Password</label>
                <input className="field-input" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant ml-1">Access Level</label>
                <div className="relative">
                  <select
                    className="field-input appearance-none pr-8 cursor-pointer"
                    value={form.is_super_admin ? 'true' : 'false'}
                    onChange={(e) => setForm((p) => ({ ...p, is_super_admin: e.target.value === 'true' }))}
                  >
                    <option value="false">Admin</option>
                    <option value="true">Super Admin</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
            {error && <p className="text-xs text-error font-semibold">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleCreate} disabled={saving || !form.name || !form.email || !form.password} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
                {saving ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-[16px]">person_add</span>}
                {saving ? 'Creating…' : 'Create Admin'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-tertiary text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Admin rows */}
        {loading ? (
          <div className="divide-y divide-surface-container-low">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-surface-container-high" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-container-high rounded w-1/3" />
                  <div className="h-2 bg-surface-container-high rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-surface-container-low">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low/40 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-primary-container/15 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {admin.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">
                    {admin.name}
                    {admin.id === adminId && <span className="ml-2 text-[9px] font-black text-outline uppercase tracking-wider">(you)</span>}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">{admin.email}</p>
                </div>

                <div className="hidden md:flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${
                    admin.is_super_admin
                      ? 'bg-primary-container/20 text-primary'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {admin.is_super_admin ? 'Super Admin' : 'Admin'}
                  </span>
                  <span className="text-[10px] text-outline">Since {formatDate(admin.created_at)}</span>
                </div>

                {isSuperAdmin && !admin.is_super_admin && admin.id !== adminId && (
                  <button
                    onClick={() => handleRemove(admin.id)}
                    className="p-2 text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove admin"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_remove</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Access levels explainer */}
      <div className="sacred-card p-6">
        <p className="section-label mb-4">Access Levels</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              role: 'Super Admin',
              perms: ['Full system access', 'Create & remove admins', 'Export all data', 'Access audit logs'],
              accent: true,
            },
            {
              role: 'Admin',
              perms: ['View member registry', 'Check in members', 'Generate reports', 'Register new members'],
              accent: false,
            },
          ].map(({ role, perms, accent }) => (
            <div key={role} className={`p-5 rounded-md ${accent ? 'bg-primary-container/10' : 'bg-surface-container-low'}`}>
              <p className="text-sm font-extrabold text-on-surface mb-3">{role}</p>
              <ul className="space-y-2">
                {perms.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px] text-primary-container">check</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
