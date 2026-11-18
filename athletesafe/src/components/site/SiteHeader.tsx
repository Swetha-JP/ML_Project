import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, ArrowRight, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const NAV_LINKS = [
  { label: 'Features',     href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'For Teams',    href: '/#for-teams' },
  { label: 'About',        to:   '/about' },
  { label: 'Blog',         to:   '/blog' },
  { label: 'Contact',      to:   '/contact' },
];

export function SiteHeader() {
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleNav = (link: (typeof NAV_LINKS)[0]) => {
    setMobileOpen(false);
    if (link.href) {
      if (link.href.startsWith('/#')) {
        const id = link.href.slice(2);
        if (location.pathname !== '/') {
          navigate('/');
          setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate(link.href);
      }
    } else if (link.to) {
      navigate(link.to);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className={clsx('site-header', scrolled && 'site-header-scrolled')}>
      <div className="site-header-inner">
        <Link to="/" className="site-logo">
          <div className="site-logo-icon"><Shield size={18} strokeWidth={1.8} /></div>
          <div className="site-logo-text">
            <span className="site-logo-name">ATHLETESAFE</span>
            <span className="site-logo-tag">PERFORMANCE INTELLIGENCE</span>
          </div>
        </Link>

        <nav className="site-nav" aria-label="Site navigation">
          {NAV_LINKS.map((l) => (
            <button key={l.label} className="site-nav-link" onClick={() => handleNav(l)}>{l.label}</button>
          ))}
        </nav>

        <div className="site-header-cta">
          {isAuthenticated && user ? (
            <div className="site-user-menu-wrap" ref={userMenuRef}>
              <button className="site-user-trigger" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <div className="site-user-avatar">{user.name.charAt(0)}</div>
                <div className="site-user-info">
                  <span className="site-user-name">{user.name.split(' ')[0]}</span>
                  <span className="site-user-role">{user.role}</span>
                </div>
              </button>
              {userMenuOpen && (
                <div className="site-user-dropdown">
                  <div className="site-user-dropdown-header">
                    <div className="site-user-avatar-lg">{user.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--graphite)' }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--slate)' }}>{user.email}</div>
                    </div>
                  </div>
                  <div className="site-user-dropdown-body">
                    <Link to="/app" className="site-user-dropdown-item"><LayoutDashboard size={14} /> Dashboard</Link>
                    <Link to="/app/manage" className="site-user-dropdown-item"><User size={14} /> Manage Athletes</Link>
                  </div>
                  <div className="site-user-dropdown-footer">
                    <button className="site-user-dropdown-item site-user-logout" onClick={handleLogout}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"    className="btn-site-ghost">Sign In</Link>
              <Link to="/register" className="btn-site-primary">Get Started <ArrowRight size={14} /></Link>
            </>
          )}
        </div>

        <button className="site-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="site-mobile-menu">
          {NAV_LINKS.map((l) => (
            <button key={l.label} className="site-mobile-link" onClick={() => handleNav(l)}>{l.label}</button>
          ))}
          <div className="site-mobile-cta">
            {isAuthenticated ? (
              <>
                <Link to="/app" className="btn-site-primary" style={{ display:'flex', width:'100%', justifyContent:'center', marginBottom:8 }}>
                  Dashboard
                </Link>
                <button className="btn-site-ghost" style={{ width:'100%', justifyContent:'center', display:'flex' }} onClick={handleLogout}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-site-primary" style={{ display:'flex', width:'100%', justifyContent:'center', marginBottom:8 }}>
                  Get Started <ArrowRight size={14} />
                </Link>
                <Link to="/login" className="btn-site-ghost" style={{ display:'flex', width:'100%', justifyContent:'center' }}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
