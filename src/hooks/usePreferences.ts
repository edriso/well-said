import { useCallback, useState } from 'react';
import type { Preferences } from '../content/types';

const STORAGE_KEY = 'well-said:preferences:v1';

export const defaultPreferences: Preferences = {
  version: 1,
  comfort: 'everyday',
  areas: [],
};

function loadPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultPreferences;
    const parsed = JSON.parse(stored) as Partial<Preferences>;
    if (parsed.version !== 1) return defaultPreferences;
    return {
      version: 1,
      comfort: parsed.comfort ?? defaultPreferences.comfort,
      areas: Array.isArray(parsed.areas) ? parsed.areas : [],
    };
  } catch {
    return defaultPreferences;
  }
}

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<Preferences>(loadPreferences);
  const setPreferences = useCallback((change: Partial<Omit<Preferences, 'version'>>) => {
    setPreferencesState((current) => {
      const next = { ...current, ...change };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  return { preferences, setPreferences };
}
