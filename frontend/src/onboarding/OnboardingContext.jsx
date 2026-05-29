import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getOnboardingConfig, ONBOARDING_VERSION } from './onboardingConfig';

const OnboardingContext = createContext(null);

const defaultState = {
  has_seen_welcome: false,
  completed_tutorials: [],
  skipped_tutorials: [],
  dismissed_tips: [],
  checklist_progress: {},
  last_tutorial: '',
  last_step_id: '',
  metadata: {},
};

const stateKeyFor = (user) => `knhs_onboarding_${user?.id || user?.username || 'guest'}`;

const readCachedState = (user) => {
  try {
    const cached = localStorage.getItem(stateKeyFor(user));
    return cached ? { ...defaultState, ...JSON.parse(cached) } : defaultState;
  } catch {
    return defaultState;
  }
};

const writeCachedState = (user, state) => {
  try {
    localStorage.setItem(stateKeyFor(user), JSON.stringify(state));
  } catch {
    // Local cache is best-effort; backend persistence remains the source of truth.
  }
};

export const OnboardingProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [state, setState] = useState(defaultState);
  const [loading, setLoading] = useState(true);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeTourKey, setActiveTourKey] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const stateRef = useRef(defaultState);
  const userRef = useRef(user);

  const role = user?.role || 'student';
  const config = useMemo(() => getOnboardingConfig(role), [role]);
  const activeTour = activeTourKey ? config.tours?.[activeTourKey] : null;

  const checklistTotal = config.checklist.length;
  const checklistCompleted = config.checklist.filter(item => state.checklist_progress?.[item.id]).length;
  const checklistPercent = checklistTotal > 0 ? Math.round((checklistCompleted / checklistTotal) * 100) : 0;

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const replaceState = useCallback((nextState) => {
    const normalized = { ...defaultState, ...nextState };
    stateRef.current = normalized;
    setState(normalized);
    if (userRef.current) writeCachedState(userRef.current, normalized);
  }, []);

  const persistState = useCallback((partial) => {
    const nextState = { ...stateRef.current, ...partial };
    replaceState(nextState);
    void api.patch('/onboarding/state/', partial).catch((error) => {
      console.error('Failed to sync onboarding state:', error);
    });
  }, [replaceState]);

  useEffect(() => {
    let cancelled = false;

    const loadState = async () => {
      if (!user) {
        replaceState(defaultState);
        setLoading(false);
        return;
      }

      setLoading(true);
      const cached = readCachedState(user);
      replaceState(cached);

      try {
        const { data } = await api.get('/onboarding/state/');
        if (!cancelled) replaceState({ ...cached, ...data });
      } catch (error) {
        console.error('Failed to load onboarding state:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadState();
    return () => {
      cancelled = true;
    };
  }, [replaceState, user]);

  useEffect(() => {
    if (loading || !user) return;
    if (state.has_seen_welcome) return;
    if (state.metadata?.version === ONBOARDING_VERSION && state.skipped_tutorials?.length > 0) return;

    const timer = setTimeout(() => setWelcomeOpen(true), 650);
    return () => clearTimeout(timer);
  }, [loading, state.has_seen_welcome, state.metadata?.version, state.skipped_tutorials?.length, user]);

  const markChecklistItem = useCallback((itemId) => {
    if (!itemId || stateRef.current.checklist_progress?.[itemId]) return;
    persistState({
      checklist_progress: {
        ...stateRef.current.checklist_progress,
        [itemId]: true,
      },
    });
  }, [persistState]);

  useEffect(() => {
    if (loading || !user) return;
    const currentItem = config.checklist.find(item => item.autoCompleteOnPath === location.pathname);
    if (currentItem) markChecklistItem(currentItem.id);
  }, [config.checklist, loading, location.pathname, markChecklistItem, user]);

  const setWelcomeSeen = useCallback((seen = true) => {
    setWelcomeOpen(false);
    persistState({
      has_seen_welcome: seen,
      metadata: {
        ...stateRef.current.metadata,
        version: ONBOARDING_VERSION,
      },
    });
  }, [persistState]);

  const startTour = useCallback((tourKey = 'primary') => {
    setHelpOpen(false);
    setWelcomeOpen(false);
    setActiveTourKey(tourKey);
    setActiveStepIndex(0);
  }, []);

  const endTour = useCallback((completed = true) => {
    if (!activeTour) {
      setActiveTourKey(null);
      return;
    }

    const tutorialId = activeTour.id;
    const completedSet = new Set(stateRef.current.completed_tutorials || []);
    const skippedSet = new Set(stateRef.current.skipped_tutorials || []);

    if (completed) completedSet.add(tutorialId);
    else skippedSet.add(tutorialId);

    persistState({
      completed_tutorials: Array.from(completedSet),
      skipped_tutorials: Array.from(skippedSet),
      last_tutorial: tutorialId,
      last_step_id: activeTour.steps?.[activeStepIndex]?.id || '',
      has_seen_welcome: true,
      metadata: {
        ...stateRef.current.metadata,
        version: ONBOARDING_VERSION,
      },
    });

    setActiveTourKey(null);
    setActiveStepIndex(0);
  }, [activeStepIndex, activeTour, persistState]);

  const dismissTip = useCallback((tipId) => {
    if (!tipId) return;
    const dismissed = new Set(stateRef.current.dismissed_tips || []);
    dismissed.add(tipId);
    persistState({ dismissed_tips: Array.from(dismissed) });
  }, [persistState]);

  const resetRoleOnboarding = useCallback(() => {
    const roleTutorialIds = Object.values(config.tours || {}).map(tour => tour.id);
    persistState({
      has_seen_welcome: false,
      completed_tutorials: (stateRef.current.completed_tutorials || []).filter(id => !roleTutorialIds.includes(id)),
      skipped_tutorials: (stateRef.current.skipped_tutorials || []).filter(id => !roleTutorialIds.includes(id)),
      dismissed_tips: [],
      checklist_progress: {},
      metadata: {
        ...stateRef.current.metadata,
        version: ONBOARDING_VERSION,
      },
    });
    setWelcomeOpen(true);
    setHelpOpen(false);
  }, [config.tours, persistState]);

  const value = useMemo(() => ({
    activeStepIndex,
    activeTour,
    activeTourKey,
    checklistCompleted,
    checklistPercent,
    checklistTotal,
    config,
    dismissTip,
    endTour,
    helpOpen,
    loading,
    markChecklistItem,
    resetRoleOnboarding,
    role,
    setActiveStepIndex,
    setHelpOpen,
    setWelcomeSeen,
    setWelcomeOpen,
    startTour,
    state,
    welcomeOpen,
  }), [
    activeStepIndex,
    activeTour,
    activeTourKey,
    checklistCompleted,
    checklistPercent,
    checklistTotal,
    config,
    dismissTip,
    endTour,
    helpOpen,
    loading,
    markChecklistItem,
    resetRoleOnboarding,
    role,
    setWelcomeSeen,
    startTour,
    state,
    welcomeOpen,
  ]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return context;
};
