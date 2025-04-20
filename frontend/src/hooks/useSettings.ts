// frontend/src/hooks/useSettings.ts
import { useState, useEffect } from 'react';

export type UserSettings = {
  preferredFormat: 'csv' | 'xlsx' | 'sage';
  delimiter: string;
  darkMode: boolean;
};

const defaultSettings: UserSettings = {
  preferredFormat: 'csv',
  delimiter: ',',
  darkMode: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('fileflip-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  
  useEffect(() => {
    localStorage.setItem('fileflip-settings', JSON.stringify(settings));
  }, [settings]);
  
  return [settings, setSettings] as const;
}