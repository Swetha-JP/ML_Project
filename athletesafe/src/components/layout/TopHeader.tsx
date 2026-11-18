import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, User, Settings, Home, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { RiskBadge } from '../ui/RiskBadge';
import clsx from 'clsx';

export function TopHeader() {
  const { selectedAthlete, setSelectedAthlete, athletes, setSidebarOpen, sidebarOpen } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');

  const switcherRef = useRef<HTMLDivElement>(null);
  const profileRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false);
      if (profileRef.current  && !profileRef.current.contains(e.target as Node))  setProfileOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const filtered = athletes.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header className="top-header">
      <div className="top-header-left">
        <button className="top-header-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>

        {/* Athlete switcher */}
        <div className="athlete-switcher" ref={switcherRef}>
          <button className="athlete-switcher-trigger" onClick={() => setSwitcherOpen(!switcherOpen)}>
            <div className="athlete-switcher-avatar">{selectedAthlete.name.charAt(0)}</div>
            <div className="athlete-switcher-info">
              <span className="athlete-switcher-name">{selectedAthlete.name}</span>
              <span className="athlete-switcher-meta">{selectedAthlete.sport} · {selectedAthlete.position}</span>
            </div>
            <RiskBadge level={selectedAthlete.riskLevel} size="sm" />
            <ChevronDown size={14} className={clsx('athlete-switcher-chevron', switcherOpen && 'rotate-180')} />
          </button>

          {switcherOpen && (
            <div className="athlete-switcher-dropdown">
              <div className="athlete-switcher-search">
                <Search size={14} />
                <input placeholder="Search athletes..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ color: 'var(--slate-light)', display:'flex' }}>
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="athlete-switcher-list">
                {filtered.length === 0 ? (
                  <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--slate-light)', textAlign: 'center' }}>
                    No athletes found
                  </div>
                ) : filtered.map((athlete) => (
                  <button key={athlete.id}
                    className={clsx('athlete-switcher-option', athlete.id === selectedAthlete.id && 'athlete-switcher-option-active')}
                    onClick={() => { setSelectedAthlete(athlete); setSwitcherOpen(false); setSearchQuery(''); }}>
                    <div className="athlete-option-avatar">{athlete.name.charAt(0)}</div>
                    <div className="athlete-option-info">
                      <span className="athlete-option-name">{athlete.name}</span>
                      <span className="athlete-option-meta">{athlete.sport} · {athlete.position}</span>
                    </div>
                    <RiskBadge level={athlete.riskLevel} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="top-header-right">
        <button className="header-icon-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="header-notification-dot" />
        </button>

        {/* User profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button className="header-user-btn" onClick={() => setProfileOpen(!profileOpen)}>
            <div className="header-user-avatar">{user?.name.charAt(0) ?? 'U'}</div>
            <div className="header-user-info">
              <span className="header-user-name">{user?.name.split(' ')[0] ?? 'User'}</span>
              <span className="header-user-role">{user?.role ?? ''}</span>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--slate-light)', marginLeft: 2 }} />
          </button>

          {profileOpen && (
            <div className="header-profile-dropdown">
              <div className="header-profile-header">
                <div className="header-profile-avatar-lg">{user?.name.charAt(0) ?? 'U'}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--graphite)' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--slate)' }}>{user?.email}</div>
                  <div style={{ fontSize: 10, color: 'var(--slate-light)', marginTop: 2 }}>{user?.organisation}</div>
                </div>
              </div>
              <div className="header-profile-body">
                <Link to="/" className="header-profile-item" onClick={() => setProfileOpen(false)}>
                  <Home size={14} /> Back to Website
                </Link>
                <button className="header-profile-item"><User size={14} /> My Profile</button>
                <button className="header-profile-item"><Settings size={14} /> Preferences</button>
              </div>
              <div className="header-profile-footer">
                <button className="header-profile-item header-logout" onClick={handleLogout}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
