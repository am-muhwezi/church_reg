import { useState } from 'react'
import { MOCK_ADMINS, Admin } from '../../data/mockData'

export default function AdminSettings() {
  const [admins, setAdmins] = useState<Admin[]>(MOCK_ADMINS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'admin' as Admin['role'] })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleCreate = async () => {
    if (!form.name || !form.email) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    const newAdmin: Admin = {
      id: `a${Date.now()}`,
      name: form.name,
      email: form.email,
      role: form.role,
      created_at: new Date().toISOString(),
    }
    setAdmins((prev) => [...prev, newAdmin])
    setForm({ name: '', email: '', role: 'admin' })
    setSaving(false)
    setShowForm(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleRemove = (id: string) => {
    setAdmins((prev) => prev.filter((a) => a.id !== id))
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="p-6 md:p-10 animate-fade-up space-y-10">
      {/* Header */}
      <section>
        <p className="section-label mb-1">System Management</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Admin Management</h1>
      </section>

      {/* Toast */}
      {saved && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-primary-container/10 rounded-md border-l-4 border-primary-container animate-fade-in">
          <span className="material-symbols-outlined text-primary-container text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <p className="text-sm font-semibold text-primary">New admin created successfully.</p>
        </div>
      )}

      {/* Admins list */}
      <div className="bg-surface-container-lowest rounded-md shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-surface-container">
          <p className="section-label">Current Admins ({admins.length})</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary text-xs px-3 py-2 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            New Admin
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="px-6 py-5 bg-surface-container-low border-b border-surface-container animate-fade-up">
            <p className="text-sm font-bold text-on-surface mb-4">Create New Admin</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant ml-1">Full Name</label>
                <input
                  className="field-input"
                  placeholder="Pastor John Doe"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant ml-1">Work Email</label>
                <input
                  className="field-input"
                  type="email"
                  placeholder="admin@manifest.ke"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant ml-1">Role</label>
                <div className="relative">
                  <select
                    className="field-input appearance-none pr-8 cursor-pointer"
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Admin['role'] }))}
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={saving || !form.name || !form.email}
                className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                )}
                {saving ? 'Creating…' : 'Create Admin'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-tertiary text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Admin rows */}
        <div className="divide-y divide-surface-container-low">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low/40 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-primary-container/15 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {admin.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">{admin.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{admin.email}</p>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${
                  admin.role === 'super_admin'
                    ? 'bg-primary-container/20 text-primary'
                    : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
                <span className="text-[10px] text-outline">Since {formatDate(admin.created_at)}</span>
              </div>

              <button
                onClick={() => handleRemove(admin.id)}
                disabled={admin.role === 'super_admin'}
                className="p-2 text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed"
                title={admin.role === 'super_admin' ? 'Cannot remove super admin' : 'Remove admin'}
              >
                <span className="material-symbols-outlined text-[18px]">person_remove</span>
              </button>
            </div>
          ))}
        </div>
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
            <div
              key={role}
              className={`p-5 rounded-md ${accent ? 'bg-primary-container/10' : 'bg-surface-container-low'}`}
            >
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
