import { createContext, useContext, useState, ReactNode } from "react";

export type SortMode = 'button' | 'header';
export type NewMatchesDisplayMode = 'tag' | 'dot';
export type HeaderTitleMode = 'breadcrumbs' | 'tracked-title';

const STORAGE_KEY = "dev-tools-defaults";

export interface SkeletonTargets {
  clients: boolean;
  clientDetails: boolean;
  properties: boolean;
  propertyDetails: boolean;
  myProperties: boolean;
  myPropertyDetails: boolean;
  opportunities: boolean;
  opportunityDetails: boolean;
  schedule: boolean;
}

export interface HeaderVisibility {
  showSearch: boolean;
  showNotifications: boolean;
  showThemeToggle: boolean;
}

interface DevToolsDefaults {
  loadingDelay: number;
  showSubtitles: boolean;
  skeletonTargets: SkeletonTargets;
  headerVisibility: HeaderVisibility;
  forceNotesEmpty: boolean;
  sortMode: SortMode;
  newMatchesDisplay: NewMatchesDisplayMode;
  headerTitleMode: HeaderTitleMode;
}

const defaultSkeletonTargets: SkeletonTargets = {
  clients: true,
  clientDetails: true,
  properties: true,
  propertyDetails: true,
  myProperties: true,
  myPropertyDetails: true,
  opportunities: true,
  opportunityDetails: true,
  schedule: true,
};

const defaultHeaderVisibility: HeaderVisibility = {
  showSearch: false,
  showNotifications: false,
  showThemeToggle: false,
};

function getStoredDefaults(): DevToolsDefaults {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        loadingDelay: parsed.loadingDelay ?? 0,
        showSubtitles: parsed.showSubtitles ?? true,
        skeletonTargets: { ...defaultSkeletonTargets, ...parsed.skeletonTargets },
        headerVisibility: { ...defaultHeaderVisibility, ...parsed.headerVisibility },
        forceNotesEmpty: parsed.forceNotesEmpty ?? false,
        sortMode: parsed.sortMode ?? 'button',
        newMatchesDisplay: parsed.newMatchesDisplay ?? 'tag',
        headerTitleMode: parsed.headerTitleMode ?? 'breadcrumbs',
      };
    }
  } catch (e) {
    console.error("Failed to parse dev tools defaults", e);
  }
  return { 
    loadingDelay: 1000, 
    showSubtitles: false, 
    skeletonTargets: defaultSkeletonTargets,
    headerVisibility: defaultHeaderVisibility,
    forceNotesEmpty: false,
    sortMode: 'header' as SortMode,
    newMatchesDisplay: 'tag' as NewMatchesDisplayMode,
    headerTitleMode: 'breadcrumbs' as HeaderTitleMode,
  };
}

function saveDefaults(defaults: DevToolsDefaults): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
}

interface DevToolsContextType {
  loadingDelay: number;
  setLoadingDelay: (delay: number) => void;
  isLoading: boolean;
  triggerLoading: () => void;
  showSubtitles: boolean;
  setShowSubtitles: (show: boolean) => void;
  skeletonTargets: SkeletonTargets;
  setSkeletonTargets: (targets: SkeletonTargets) => void;
  toggleSkeletonTarget: (target: keyof SkeletonTargets) => void;
  headerVisibility: HeaderVisibility;
  setHeaderVisibility: (visibility: HeaderVisibility) => void;
  toggleHeaderVisibility: (target: keyof HeaderVisibility) => void;
  saveAsDefaults: () => void;
  showSplash: boolean;
  setShowSplash: (show: boolean) => void;
  triggerSplash: () => void;
  completeSplash: () => void;
  showGridOverlay: boolean;
  setShowGridOverlay: (show: boolean) => void;
  toggleGridOverlay: () => void;
  forceNotesEmpty: boolean;
  setForceNotesEmpty: (force: boolean) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  newMatchesDisplay: NewMatchesDisplayMode;
  setNewMatchesDisplay: (mode: NewMatchesDisplayMode) => void;
  headerTitleMode: HeaderTitleMode;
  setHeaderTitleMode: (mode: HeaderTitleMode) => void;
}

const DevToolsContext = createContext<DevToolsContextType | undefined>(undefined);

export function DevToolsProvider({ children }: { children: ReactNode }) {
  const [loadingDelay, setLoadingDelay] = useState(() => getStoredDefaults().loadingDelay);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(() => getStoredDefaults().showSubtitles);
  const [skeletonTargets, setSkeletonTargets] = useState<SkeletonTargets>(() => getStoredDefaults().skeletonTargets);
  const [headerVisibility, setHeaderVisibility] = useState<HeaderVisibility>(() => getStoredDefaults().headerVisibility);
  const [showSplash, setShowSplash] = useState(false);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [forceNotesEmpty, setForceNotesEmpty] = useState(() => getStoredDefaults().forceNotesEmpty);
  const [sortMode, setSortMode] = useState<SortMode>(() => getStoredDefaults().sortMode);
  const [newMatchesDisplay, setNewMatchesDisplay] = useState<NewMatchesDisplayMode>(() => getStoredDefaults().newMatchesDisplay);
  const [headerTitleMode, setHeaderTitleMode] = useState<HeaderTitleMode>(() => getStoredDefaults().headerTitleMode);

  const triggerSplash = () => {
    setShowSplash(true);
  };

  const completeSplash = () => {
    setShowSplash(false);
  };

  const triggerLoading = () => {
    if (loadingDelay > 0) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), loadingDelay);
    }
  };

  const toggleSkeletonTarget = (target: keyof SkeletonTargets) => {
    setSkeletonTargets(prev => ({
      ...prev,
      [target]: !prev[target],
    }));
  };

  const toggleHeaderVisibility = (target: keyof HeaderVisibility) => {
    setHeaderVisibility(prev => ({
      ...prev,
      [target]: !prev[target],
    }));
  };

  const toggleGridOverlay = () => {
    setShowGridOverlay(prev => !prev);
  };

  const saveAsDefaults = () => {
    saveDefaults({ loadingDelay, showSubtitles, skeletonTargets, headerVisibility, forceNotesEmpty, sortMode, newMatchesDisplay, headerTitleMode });
  };

  return (
    <DevToolsContext.Provider value={{ 
      loadingDelay, 
      setLoadingDelay, 
      isLoading, 
      triggerLoading,
      showSubtitles,
      setShowSubtitles,
      skeletonTargets,
      setSkeletonTargets,
      toggleSkeletonTarget,
      headerVisibility,
      setHeaderVisibility,
      toggleHeaderVisibility,
      saveAsDefaults,
      showSplash,
      setShowSplash,
      triggerSplash,
      completeSplash,
      showGridOverlay,
      setShowGridOverlay,
      toggleGridOverlay,
      forceNotesEmpty,
      setForceNotesEmpty,
      sortMode,
      setSortMode,
      newMatchesDisplay,
      setNewMatchesDisplay,
      headerTitleMode,
      setHeaderTitleMode
    }}>
      {children}
    </DevToolsContext.Provider>
  );
}

export function useDevTools() {
  const context = useContext(DevToolsContext);
  if (context === undefined) {
    throw new Error("useDevTools must be used within a DevToolsProvider");
  }
  return context;
}
