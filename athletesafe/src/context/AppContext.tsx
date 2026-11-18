// ============================================================
// AthleteSafe – App Context
// NOTE: Use named function declarations for Vite Fast Refresh compatibility
// ============================================================
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Athlete, ToastMessage } from '../types';
import { ATHLETES } from '../data/athletes';
import { athletesApi, getToken } from '../services/api';

interface AppContextType {
  selectedAthlete:   Athlete;
  setSelectedAthlete:(a: Athlete) => void;
  athletes:          Athlete[];
  isLoadingAthletes: boolean;
  addAthlete:        (a: Athlete) => void;
  updateAthlete:     (id: string, updates: Partial<Athlete>) => void;
  deleteAthlete:     (id: string) => void;
  refreshAthletes:   () => void;
  sidebarOpen:       boolean;
  setSidebarOpen:    (open: boolean) => void;
  toasts:            ToastMessage[];
  addToast:          (msg: Omit<ToastMessage, 'id'>) => void;
  removeToast:       (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const normaliseAthlete = (a: any): Athlete => ({
  id:               a.id,
  name:             a.name,
  age:              a.age,
  sport:            a.sport,
  position:         a.position,
  height:           a.height,
  weight:           a.weight,
  experience:       a.experience,
  riskScore:        a.risk_score        ?? 0,
  riskLevel:        a.risk_level        ?? 'low',
  previousRiskScore:a.previous_risk_score,
  lastAssessment:   a.last_assessment?.split('T')[0] ?? '',
  trainingLoad:     a.training_load     ?? { trainingDaysPerWeek: 5, trainingDurationMinutes: 90, rpe: 7, weeklyLoad: 65, dailyLoads: [] },
  recovery:         a.recovery          ?? { sleepHours: 7.5, sleepQuality: 7, recoveryScore: 65, restDays: 2, muscleFatigue: 45 },
  biomechanics:     a.biomechanics      ?? { kneeFlexionAngle: 72, kneeValgusAngle: 5, hipAngle: 44, ankleDorsiflexion: 17, strideSymmetry: 93, strideLength: 155, groundContactTime: 260, forceAsymmetry: 6 },
  injuryHistory:    a.injury_history    ?? [],
  riskTrend:        a.risk_trend        ?? [],
  recommendations:  a.recommendations  ?? [],
});

// ── Provider ──────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [athletes,          setAthletes]           = useState<Athlete[]>(ATHLETES);
  const [isLoadingAthletes, setIsLoadingAthletes]  = useState(false);
  const [selectedAthlete,   setSelectedAthleteState] = useState<Athlete>(ATHLETES[0]);
  const [sidebarOpen,       setSidebarOpen]        = useState(true);
  const [toasts,            setToasts]             = useState<ToastMessage[]>([]);
  const hasFetched = useRef(false);

  const refreshAthletes = useCallback(async () => {
    if (!getToken()) return; // Skip if not logged in — avoids 401 on public pages
    setIsLoadingAthletes(true);
    try {
      const data = await athletesApi.list();
      if (Array.isArray(data) && data.length > 0) {
        const normalised = data.map(normaliseAthlete);
        setAthletes(normalised);
        setSelectedAthleteState((prev) => normalised.find((a) => a.id === prev.id) ?? normalised[0]);
      }
    } catch {
      // Backend unavailable — keep mock data, never redirect
    } finally {
      setIsLoadingAthletes(false);
    }
  }, []); // stable — no deps

  // Run once on mount only
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      void refreshAthletes();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setSelectedAthlete = useCallback((a: Athlete) => setSelectedAthleteState(a), []);

  const addAthlete = useCallback((athlete: Athlete) => {
    setAthletes((prev) => [athlete, ...prev]);
  }, []);

  const updateAthlete = useCallback((id: string, updates: Partial<Athlete>) => {
    setAthletes((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    setSelectedAthleteState((prev) => (prev.id === id ? { ...prev, ...updates } : prev));
  }, []);

  const deleteAthlete = useCallback((id: string) => {
    setAthletes((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setSelectedAthleteState((sel) => (sel.id === id ? next[0] ?? sel : sel));
      return next;
    });
  }, []); // No external deps — uses functional updater pattern

  const addToast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...msg, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), msg.duration ?? 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        selectedAthlete, setSelectedAthlete,
        athletes, isLoadingAthletes,
        addAthlete, updateAthlete, deleteAthlete, refreshAthletes,
        sidebarOpen, setSidebarOpen,
        toasts, addToast, removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
