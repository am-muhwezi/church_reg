import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Logo from './Logo'

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Overview', to: '/admin' },
  { icon: 'group', label: 'Saints', to: '/admin/saints' },
  { icon: 'how_to_reg', label: 'Check-in', to: '/admin/checkin' },
  { icon: 'bar_chart', label: 'Reports', to: '/admin/reports' },
  { icon: 'admin_panel_settings', label: 'Admins', to: '/admin/settings' },
]

function NavItem({ icon, label, to }: { icon: string; label: string; to: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/admin'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-semibold transition-colors ${
          isActive ? 'nav-active' : 'nav-idle'
        }`
      }
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

function BottomNavItem({ icon, label, to }: { icon: string; label: string; to: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/admin'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-2 rounded-md transition-colors ${
          isActive ? 'text-primary' : 'text-on-surface-variant'
        }`
      }
    >
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </NavLink>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top bar */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16"
        style={{ background: 'rgba(246,246,246,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <Logo size="sm" theme="light" />

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `px-3 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
                  isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-error-container/10 px-3 py-1 rounded-full">
            <span className="live-dot" />
            <span className="text-[10px] font-black text-error uppercase tracking-widest">
              Live
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold text-sm border-2 border-primary-container/30">
            PJ
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-64 fixed left-0 top-16 h-[calc(100vh-4rem)] bg-surface-container-lowest shadow-card p-6 gap-1">
          <div className="mb-6">
            <p className="section-label mb-1">Administration</p>
            <p className="text-xs text-on-surface-variant">Sacred Precision System</p>
          </div>

          <nav className="flex-1 flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="pt-4 border-t border-surface-container flex flex-col gap-0.5">
            <button
              onClick={() => navigate('/admin/login')}
              className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-semibold nav-idle text-error w-full text-left"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-64 pb-24 md:pb-0 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container-lowest shadow-[0_-4px_20px_rgba(81,93,105,0.06)]">
        {NAV_ITEMS.map((item) => (
          <BottomNavItem key={item.to} {...item} />
        ))}
      </nav>
    </div>
  )
}
