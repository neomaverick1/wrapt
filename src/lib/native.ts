import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import { Platform, Share } from 'react-native';

import type { SiteMessage } from './bridge';

export const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export async function shareLink(m: Extract<SiteMessage, { type: 'share' }>): Promise<void> {
  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { title: m.title, url: m.url, message: m.text }
        : { title: m.title, message: `${m.text ?? m.title}\n${m.url}` },
    );
  } catch {
    // dismissed
  }
}

export function haptic(kind: 'light' | 'success'): void {
  if (!isNative) return;
  const p = kind === 'success' ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.selectionAsync();
  p.catch(() => undefined);
}

/** Schedules a local notification; returns false where the platform can't show one (web preview). */
export async function notify(m: Extract<SiteMessage, { type: 'notify' }>): Promise<boolean> {
  if (!isNative) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Orders and stock alerts',
        // eslint-disable-next-line import/namespace -- re-exported enum the import plugin cannot follow
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const perm = await Notifications.getPermissionsAsync();
    const granted = perm.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return false;
    await Notifications.scheduleNotificationAsync({
      content: { title: m.title, body: m.body, data: { path: m.path ?? '/' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: m.delaySec, channelId: 'orders' },
    });
    return true;
  } catch {
    return false;
  }
}

export type UnlockResult = 'ok' | 'failed' | 'unavailable';

/** Face ID / Touch ID / fingerprint. "unavailable" when the device has none enrolled or on the web. */
export async function unlock(): Promise<UnlockResult> {
  if (!isNative) return 'unavailable';
  try {
    const [hasHardware, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
    if (!hasHardware || !enrolled) return 'unavailable';
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock your account', fallbackLabel: 'Use passcode' });
    return r.success ? 'ok' : 'failed';
  } catch {
    return 'unavailable';
  }
}
