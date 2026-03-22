import { useParams, useNavigate } from 'react-router-dom'
import { MOCK_SAINTS } from '../../data/mockData'

export default function SaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const saint = MOCK_SAINTS.find((s) => s.id === id)

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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })

  const fields: Array<{ icon: string; label: string; value: string | boolean | number }> = [
    { icon: 'mail', label: 'Email', value: saint.email },
    { icon: 'home', label: 'Residence', value: saint.residence || '—' },
    { icon: 'work', label: 'Occupation', value: saint.occupation || '—' },
    { icon: saint.gender ? 'man' : 'woman', label: 'Gender', value: saint.gender ? 'Male' : 'Female' },
    { icon: 'school', label: 'Student', value: saint.student ? 'Yes' : 'No' },
    { icon: 'star', label: 'First-time visitor', value: saint.first_time ? 'Yes' : 'No' },
    { icon: 'chat', label: 'WhatsApp consent', value: saint.whatsApp_group_consent ? 'Yes' : 'No' },
    { icon: 'shield', label: 'Data sharing consent', value: saint.consent_to_share_info ? 'Yes' : 'No' },
    { icon: 'event', label: 'Registered on', value: formatDate(saint.created_at) },
    { icon: 'update', label: 'Last updated', value: formatDate(saint.updated_at) },
  ]

  return (
    <div className="p-6 md:p-10 animate-fade-up">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/saints')}
        className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-8"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Saints
      </button>

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
          <p className="text-sm text-on-surface-variant mb-4">{saint.occupation}</p>

          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Services Attended</span>
              <span className="text-2xl font-extrabold text-on-surface">{saint.attendance_count}</span>
            </div>
            <div className="w-px h-10 bg-surface-container-highest self-center" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Last Seen</span>
              <span className="text-sm font-bold text-on-surface">{formatDate(saint.last_seen)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 self-start">
          <button
            onClick={() => navigate(`/register?id=${saint.id}&first=${saint.first_name}&last=${saint.last_name}&update=true`)}
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </button>
        </div>
      </div>

      {/* Details grid */}
      <div className="sacred-card p-6 md:p-8">
        <p className="section-label mb-6">Member Details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-4 bg-surface-container-low rounded-md">
              <span className="material-symbols-outlined text-primary-container text-[20px] flex-shrink-0 mt-0.5">{icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-on-surface truncate">{String(value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
