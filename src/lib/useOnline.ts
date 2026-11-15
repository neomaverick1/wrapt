import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/** False only when the device is definitely offline. The browser preview listens to the browser's own events. */
export function useOnline(): boolean {
  const net = useNetInfo();
  const [browserOnline, setBrowserOnline] = useState(() =>
    Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const on = () => setBrowserOnline(true);
    const off = () => setBrowserOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return Platform.OS === 'web' ? browserOnline : net.isConnected !== false;
}
