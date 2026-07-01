import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_FILTERS, type Filters } from './constants';

const STORAGE_KEY = 'quaketrack.filters';

const loadFilters = (): Filters => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_FILTERS;
};

interface FiltersContextValue {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

export const FiltersProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFiltersState] = useState<Filters>(loadFilters);

  const value = useMemo<FiltersContextValue>(
    () => ({
      filters,
      setFilters: (next: Filters) => {
        setFiltersState(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore storage write failures (private mode, etc.)
        }
      },
    }),
    [filters],
  );

  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
};

export const useFilters = (): FiltersContextValue => {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return ctx;
};
