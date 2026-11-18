import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public site
import { SiteHeader }  from './components/site/SiteHeader';
import { SiteFooter }  from './components/site/SiteFooter';
import { LandingPage } from './pages/site/LandingPage';
import { AboutPage }   from './pages/site/AboutPage';
import { BlogPage }    from './pages/site/BlogPage';
import { ContactPage } from './pages/site/ContactPage';
import { PrivacyPage } from './pages/site/PrivacyPage';
import { TermsPage }   from './pages/site/TermsPage';

// Auth pages
import { LoginPage }          from './pages/auth/LoginPage';
import { RegisterPage }       from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// App shell
import { Sidebar }        from './components/layout/Sidebar';
import { TopHeader }      from './components/layout/TopHeader';
import { ToastContainer } from './components/ui/Toast';

// App pages
import { Dashboard }         from './pages/Dashboard';
import { RiskAssessment }    from './pages/RiskAssessment';
import { Athletes }          from './pages/Athletes';
import { AthleteManagement } from './pages/AthleteManagement';
import { Analytics }         from './pages/Analytics';
import { RiskHistory }       from './pages/RiskHistory';
import { Recommendations }   from './pages/Recommendations';
import { PoseAnalysis }      from './pages/PoseAnalysis';

// ── Named layout components (required for Vite Fast Refresh) ──

function PublicLayout() {
  return (
    <>
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </>
  );
}

function AuthLayout() {
  return <Outlet />;
}

function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="app-layout">
        <Sidebar />
        <div className="app-main">
          <TopHeader />
          <main className="app-content">
            <Outlet />
          </main>
        </div>
        <ToastContainer />
      </div>
    </ProtectedRoute>
  );
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public site */}
            <Route element={<PublicLayout />}>
              <Route path="/"        element={<LandingPage />} />
              <Route path="/about"   element={<AboutPage />} />
              <Route path="/blog"    element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms"   element={<TermsPage />} />
            </Route>

            {/* Auth pages */}
            <Route element={<AuthLayout />}>
              <Route path="/login"           element={<LoginPage />} />
              <Route path="/register"        element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* Protected app */}
            <Route path="/app" element={<AppLayout />}>
              <Route index                  element={<Dashboard />} />
              <Route path="assessment"      element={<RiskAssessment />} />
              <Route path="pose"            element={<PoseAnalysis />} />
              <Route path="athletes"        element={<Athletes />} />
              <Route path="manage"          element={<AthleteManagement />} />
              <Route path="analytics"       element={<Analytics />} />
              <Route path="history"         element={<RiskHistory />} />
              <Route path="recommendations" element={<Recommendations />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
