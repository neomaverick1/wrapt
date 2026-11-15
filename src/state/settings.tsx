import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface AppSettings {
  biometricLock: boolean;
  notifications: boolean;
}

const DEFAULTS: AppSettings = { biometricLock: true, notifications: true };
const KEY = 'wrapt:settings:v1';

const Ctx = createContext<{ settings: AppSettings; update: (p: Partial<AppSettings>) => void } | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setSettings({ ...DEFAULTS, ...JSON.parse(raw) }))
      .catch(() => undefined);
  }, []);
  const update = useCallback((p: Partial<AppSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...p };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);
  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSettings must be used inside SettingsProvider');
  return v;
}
