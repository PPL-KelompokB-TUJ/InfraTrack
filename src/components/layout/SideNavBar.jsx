import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { cn } from '../../lib/utils';

// Icon map for each nav item
const ICON_COLORS = [
  '#ce8093', '#b39ad4', '#7fa8d4', '#ce8093',
  '#a0c4b0', '#d4b39a', '#8093ce', '#d4ce93',
  '#ce93d4', '#80ced4', '#d4a0b5',
];

export default function SideNavBar({ currentUser, isAdmin, isFieldOfficer, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminItems = [
    { label: 'Ringkasan',       icon: 'dashboard',         to: '/dashboard',                  section: 'main' },
    { label: 'Laporan Aktif',   icon: 'report_problem',    to: '/dashboard/reports',          section: 'main' },
    { label: 'Penugasan',       icon: 'construction',      to: '/dashboard/maintenance',      section: 'main' },
    { label: 'Jadwal Preventif',icon: 'event_note',        to: '/dashboard/preventive',       section: 'main' },
    { label: 'Anggaran',        icon: 'payments',          to: '/dashboard/budgets',          section: 'main' },
    { label: 'Petugas',         icon: 'groups',            to: '/dashboard/officers',         section: 'main' },
    { label: 'Aset',            icon: 'apartment',         to: '/dashboard/assets',           section: 'main' },
    { label: 'Inventaris',      icon: 'inventory_2',       to: '/dashboard/inventory',        section: 'main' },
    { label: 'Master Data',     icon: 'database',          to: '/dashboard/master-data',      section: 'system' },
    { label: 'Analitik AI',     icon: 'smart_toy',         to: '/dashboard/ai-analytics',    section: 'system' },
    { label: 'Ekspor Laporan',  icon: 'cloud_download',    to: '/dashboard/exports',          section: 'system' },
  ];

  const officerItems = [
    { label: 'Penugasan Saya', icon: 'assignment_ind', to: '/dashboard/my-tasks', section: 'main' },
  ];

  const navItems = [
    ...(isFieldOfficer ? officerItems : []),
    ...(isAdmin ? adminItems : []),
  ];

  const mainItems   = navItems.filter(i => i.section === 'main');
  const systemItems = navItems.filter(i => i.section === 'system');

  const handleLogout = async () => {
    if (onLogout) await onLogout();
    navigate('/');
  };

  const roleLabel = isAdmin ? 'Administrator' : isFieldOfficer ? 'Petugas Lapangan' : 'Pengguna';
  const roleColor = isAdmin ? '#4ade80' : isFieldOfficer ? '#f9bbd0' : '#94a3b8';
  const roleBg    = isAdmin ? 'rgba(74,222,128,0.08)' : isFieldOfficer ? 'rgba(206,128,147,0.08)' : 'rgba(148,163,184,0.08)';

  const sidebarContent = (
    <nav
      style={{
        background: 'linear-gradient(180deg, #1e0f16 0%, #2d1520 60%, #1a0d13 100%)',
        borderRight: '1px solid rgba(206,128,147,0.12)',
        width: '256px',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 200px 300px at 50% 0%, rgba(206,128,147,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px',
        background: 'radial-gradient(ellipse 200px 200px at 50% 100%, rgba(140,58,86,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Subtle petal watermark */}
      <div style={{
        position: 'absolute', right: '-20px', top: '30%',
        opacity: 0.04, pointerEvents: 'none',
      }}>
        <svg width="120" height="120" viewBox="0 0 100 100" fill="#f9bbd0">
          <path d="M50 0C60 30 100 50 100 50C100 50 60 70 50 100C40 70 0 50 0 50C0 50 40 30 50 0Z" />
        </svg>
      </div>

      {/* ── LOGO ── */}
      <div
        onClick={() => { navigate('/'); setMobileOpen(false); }}
        className="cursor-pointer flex-shrink-0"
        style={{ padding: '28px 24px 20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Custom SVG logo */}
          <div style={{ flexShrink: 0, width: '38px', height: '38px', borderRadius: '11px', overflow: 'hidden', background: 'transparent' }}>
            <img src="/yorushika-logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <p style={{ fontWeight: 900, fontSize: '17px', color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>
              InfraTrack
            </p>
            <p style={{ fontSize: '8px', color: 'rgba(206,128,147,0.55)', fontWeight: 700, letterSpacing: '0.18em', marginTop: '3px', textTransform: 'uppercase' }}>
              Sistem Infrastruktur
            </p>
          </div>
        </div>

        {/* Yorushika micro badge */}
        <div style={{
          marginTop: '14px',
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '3px 8px', borderRadius: '100px',
          background: 'rgba(206,128,147,0.08)',
          border: '1px solid rgba(206,128,147,0.12)',
        }}>
          <motion.div
            animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
            style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ce8093' }}
          />
          <span style={{ fontSize: '9px', color: 'rgba(206,128,147,0.45)', fontWeight: 700, letterSpacing: '0.15em' }}>
            春泥棒 YORUSHIKA
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(206,128,147,0.08)', margin: '0 16px 8px' }} />

      {/* ── NAVIGATION ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', scrollbarWidth: 'none', minHeight: 0 }}>

        {/* Main section */}
        {mainItems.length > 0 && (
          <div style={{ marginBottom: '4px' }}>
            <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', padding: '8px 12px 6px' }}>
              Menu Utama
            </p>
            {mainItems.map((item, idx) => {
              const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
              const iconColor = ICON_COLORS[idx % ICON_COLORS.length];
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  onMouseEnter={() => setHoveredItem(item.to)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{ display: 'block', marginBottom: '2px', borderRadius: '12px', overflow: 'hidden' }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(206,128,147,0.22) 0%, rgba(140,58,86,0.18) 100%)'
                      : hoveredItem === item.to
                        ? 'rgba(206,128,147,0.06)'
                        : 'transparent',
                    border: isActive ? '1px solid rgba(206,128,147,0.2)' : '1px solid transparent',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}>
                    {/* Active left bar */}
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '20%', bottom: '20%',
                        width: '3px', borderRadius: '0 3px 3px 0',
                        background: 'linear-gradient(180deg, #ce8093, #8c3a56)',
                      }} />
                    )}
                    {/* Icon container */}
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? `rgba(206,128,147,0.2)` : 'rgba(255,255,255,0.04)',
                    }}>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '17px',
                        color: isActive ? '#f9bbd0' : 'rgba(255,255,255,0.38)',
                        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                      }}>{item.icon}</span>
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)',
                      letterSpacing: '0.01em',
                      transition: 'color 0.2s',
                    }}>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        )}

        {/* System section */}
        {systemItems.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', padding: '8px 12px 6px' }}>
              Sistem
            </p>
            {systemItems.map((item, idx) => {
              const isActive = location.pathname === item.to || location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onMouseEnter={() => setHoveredItem(item.to)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{ display: 'block', marginBottom: '2px' }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(206,128,147,0.22) 0%, rgba(140,58,86,0.18) 100%)'
                      : hoveredItem === item.to ? 'rgba(206,128,147,0.06)' : 'transparent',
                    border: isActive ? '1px solid rgba(206,128,147,0.2)' : '1px solid transparent',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}>
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '20%', bottom: '20%',
                        width: '3px', borderRadius: '0 3px 3px 0',
                        background: 'linear-gradient(180deg, #ce8093, #8c3a56)',
                      }} />
                    )}
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? 'rgba(206,128,147,0.2)' : 'rgba(255,255,255,0.04)',
                    }}>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '17px',
                        color: isActive ? '#f9bbd0' : 'rgba(255,255,255,0.38)',
                        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                      }}>{item.icon}</span>
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)',
                      transition: 'color 0.2s',
                    }}>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BOTTOM SECTION ── */}
      <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(206,128,147,0.08)', flexShrink: 0 }}>

        {/* New Report CTA */}
        <motion.button
          whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(140,58,86,0.4)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/layanan')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '11px 16px', borderRadius: '12px', marginBottom: '12px',
            background: 'linear-gradient(135deg, #ce8093, #8c3a56)',
            border: 'none', cursor: 'pointer', color: 'white',
            fontWeight: 700, fontSize: '13px',
            boxShadow: '0 4px 16px rgba(140,58,86,0.28)',
          }}
        >
          <span className="material-symbols-outlined icon-fill" style={{ fontSize: '17px' }}>add</span>
          Laporan Baru
        </motion.button>

        {/* Profile + Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NavLink
            to="/dashboard/profile"
            style={{ display: 'block' }}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '12px',
                background: isActive ? 'rgba(206,128,147,0.1)' : 'transparent',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(206,128,147,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(206,128,147,0.1)' : 'transparent'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'rgba(255,255,255,0.38)' }}>manage_accounts</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>Profil</span>
              </div>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '12px', border: 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'rgba(255,255,255,0.3)' }}>logout</span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.38)' }}>Keluar</span>
          </button>
        </div>

        {/* User card */}
        {currentUser && (
          <div style={{
            marginTop: '12px', padding: '10px 12px', borderRadius: '12px',
            background: roleBg,
            border: '1px solid rgba(206,128,147,0.1)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <img
              alt="User avatar"
              src={currentUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email || 'user'}`}
              onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email || 'user'}`; }}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(206,128,147,0.25)', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.user_metadata?.full_name || currentUser.email}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: roleColor, flexShrink: 0 }} />
                <p style={{ fontSize: '10px', color: roleColor, fontWeight: 600, opacity: 0.8 }}>{roleLabel}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-screen z-40" style={{ width: '256px' }}>
        {sidebarContent}
      </div>

      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-xl shadow-lg"
        style={{ background: 'linear-gradient(135deg,#ce8093,#8c3a56)', border: 'none', cursor: 'pointer' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
          {mobileOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 h-screen z-50"
              style={{ width: '256px' }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop spacer */}
      <div className="hidden md:block flex-shrink-0" style={{ width: '256px' }} />
    </>
  );
}
