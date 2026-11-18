import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardCheck, Users, BarChart2,
  History, Lightbulb, UserCog, ScanLine, Shield, X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import clsx from 'clsx';

const NAV_ITEMS = [
  { path: '/app',                  label: 'Dashboard',       icon: LayoutDashboard, end: true },
  { path: '/app/assessment',       label: 'Risk Assessment',  icon: ClipboardCheck },
  { path: '/app/pose',             label: 'Pose Analysis',    icon: ScanLine },
  { path: '/app/athletes',         label: 'Athletes',         icon: Users },
  { path: '/app/manage',           label: 'Manage Athletes',  icon: UserCog },
  { path: '/app/analytics',        label: 'Performance',      icon: BarChart2 },
  { path: '/app/history',          label: 'Risk History',     icon: History },
  { path: '/app/recommendations',  label: 'Recommendations',  icon: Lightbulb },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp();

  return (
    <>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={clsx('sidebar', !sidebarOpen && 'sidebar-hidden')}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Shield size={20} strokeWidth={1.5} />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">ATHLETESAFE</span>
            <span className="sidebar-brand-tagline">PERFORMANCE • PREVENTION • INSIGHT</span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="sidebar-nav-section">Navigation</span>
          {NAV_ITEMS.map(({ path, label, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) => clsx('sidebar-nav-item', isActive && 'sidebar-nav-item-active')}
              onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false); }}
            >
              <span className="sidebar-nav-indicator" />
              <Icon size={16} strokeWidth={1.8} />
              <span className="sidebar-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-footer-text">Sports Performance Intelligence</span>
          <span className="sidebar-footer-version">V1</span>
        </div>
      </aside>
    </>
  );
}
