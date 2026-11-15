import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, BackHandler, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WebShell, type WebShellHandle } from '@/components/WebShell';
import { parseSiteMessage, type SiteMessage } from '@/lib/bridge';
import { pathFromLink, SITE_URL, TABS, tabForPath, type TabKey } from '@/lib/links';
import { haptic, isNative, notify, shareLink, unlock } from '@/lib/native';
import { useOnline } from '@/lib/useOnline';
import { useSettings } from '@/state/settings';
import { colors } from '@/theme';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
type Banner = { title: string; body: string; path?: string };

export default function Shell() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { settings } = useSettings();
  const online = useOnline();
  const shell = useRef<WebShellHandle>(null);
  const [route, setRoute] = useState({ path: '/', title: 'Juniper & Co.', canGoBack: false });
  const [cart, setCart] = useState(0);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [lockNote, setLockNote] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [bannerY] = useState(() => new Animated.Value(-160));
  const offline = !online;
  const tab = tabForPath(route.path);

  const showBanner = useCallback(
    (b: Banner) => {
      setBanner(b);
      Animated.spring(bannerY, { toValue: 0, useNativeDriver: Platform.OS !== 'web' }).start();
      setTimeout(() => Animated.timing(bannerY, { toValue: -160, duration: 250, useNativeDriver: Platform.OS !== 'web' }).start(), 5000);
    },
    [bannerY],
  );

  // The Account tab sits behind Face ID / fingerprint; every other tab stays open.
  const guardAccount = useCallback(
    (path: string) => setLocked(tabForPath(path) === 'account' && settings.biometricLock && !unlocked),
    [settings.biometricLock, unlocked],
  );

  const handle = useCallback(
    (raw: unknown) => {
      const m: SiteMessage | null = parseSiteMessage(raw);
      if (!m) return;
      switch (m.type) {
        case 'route':
          setRoute({ path: m.path, title: m.title || 'Juniper & Co.', canGoBack: m.canGoBack });
          guardAccount(m.path);
          break;
        case 'cart':
          setCart(m.count);
          break;
        case 'share':
          shareLink(m);
          break;
        case 'haptic':
          haptic(m.kind);
          break;
        case 'notify':
          if (!settings.notifications) break;
          notify(m).then((shown) => {
            // The browser preview can't show system notifications, so it shows the same alert as a banner.
            if (!shown && !isNative)
              setTimeout(() => showBanner({ title: m.title, body: m.body, path: m.path }), Math.min(m.delaySec, 6) * 1000);
          });
          break;
      }
    },
    [guardAccount, settings.notifications, showBanner],
  );

  // Deep links (wrapt://product/monstera) and taps on notifications open the right page.
  const url = Linking.useURL();
  useEffect(() => {
    const path = url ? pathFromLink(url) : null;
    if (path) shell.current?.navigate(path);
  }, [url]);
  useEffect(() => {
    if (!isNative) return;
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const path = r.notification.request.content.data?.path;
      if (typeof path === 'string') shell.current?.navigate(path);
    });
    return () => sub.remove();
  }, []);

  // Android back button walks back through the website before it leaves the app.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!route.canGoBack) return false;
      shell.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, [route.canGoBack]);

  // Leaving the app locks Account again, so the app switcher never shows it.
  useEffect(() => {
    if (!isNative) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'background') return;
      setUnlocked(false);
      if (tabForPath(route.path) === 'account' && settings.biometricLock) setLocked(true);
    });
    return () => sub.remove();
  }, [route.path, settings.biometricLock]);

  const openTab = (key: TabKey) => {
    haptic('light');
    const t = TABS.find((x) => x.key === key)!;
    shell.current?.navigate(t.path);
  };

  const tryUnlock = async () => {
    const r = await unlock();
    if (r === 'ok') {
      setUnlocked(true);
      setLocked(false);
      setLockNote(null);
    } else if (r === 'unavailable') {
      setLockNote(
        isNative
          ? 'No Face ID or fingerprint is set up on this phone.'
          : 'Face ID and fingerprint unlock run in the iPhone and Android app. The browser preview skips them.',
      );
    }
  };

  const framed = Platform.OS === 'web' && width > 700;

  return (
    <View style={[styles.page, framed && styles.pageFramed]}>
      <View style={[styles.app, framed ? styles.appFramed : styles.appFull]}>
        <View style={[styles.header, { paddingTop: framed ? 14 : insets.top + 6 }]}>
          <View style={styles.side}>
            {route.canGoBack ? (
              <Pressable
                onPress={() => shell.current?.goBack()}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={styles.iconBtn}
              >
                <Ionicons name="chevron-back" size={24} color={colors.forest} />
              </Pressable>
            ) : (
              <View style={styles.mark}>
                <Text style={styles.markText}>J</Text>
              </View>
            )}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {route.title}
          </Text>
          <View style={[styles.side, { flexDirection: 'row', justifyContent: 'flex-end', gap: 4 }]}>
            {tab === 'account' ? (
              <Pressable
                onPress={() => router.push('/settings')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="App settings"
                style={styles.iconBtn}
              >
                <Ionicons name="settings-outline" size={22} color={colors.forest} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => shareLink({ type: 'share', title: route.title, url: `${SITE_URL}#${route.path}` })}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Share this page"
                style={styles.iconBtn}
              >
                <Ionicons name="share-outline" size={22} color={colors.forest} />
              </Pressable>
            )}
          </View>
        </View>
        {progress < 1 ? <View style={[styles.progress, { width: `${Math.max(8, progress * 100)}%` }]} /> : null}

        <View style={{ flex: 1 }}>
          <WebShell
            ref={shell}
            onMessage={handle}
            onProgress={setProgress}
            onError={() => setFailed(true)}
            onLoaded={() => setFailed(false)}
          />
          {locked ? (
            <View style={styles.overlay}>
              <View style={styles.lockIcon}>
                <Ionicons name={Platform.OS === 'ios' ? 'scan-outline' : 'finger-print'} size={38} color={colors.forest} />
              </View>
              <Text style={styles.overlayTitle}>Your account is locked</Text>
              <Text style={styles.overlayText}>
                Orders and saved details stay private until you unlock with {Platform.OS === 'ios' ? 'Face ID' : 'your fingerprint'}.
              </Text>
              <Pressable onPress={tryUnlock} style={styles.primary} accessibilityRole="button">
                <Text style={styles.primaryText}>Unlock</Text>
              </Pressable>
              {lockNote ? (
                <>
                  <Text style={[styles.overlayText, { marginTop: 12 }]}>{lockNote}</Text>
                  <Pressable
                    onPress={() => {
                      setUnlocked(true);
                      setLocked(false);
                    }}
                    style={styles.secondary}
                    accessibilityRole="button"
                  >
                    <Text style={styles.secondaryText}>Continue</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          ) : null}
          {offline || failed ? (
            <View style={styles.overlay}>
              <View style={styles.lockIcon}>
                <Ionicons name="cloud-offline-outline" size={38} color={colors.forest} />
              </View>
              <Text style={styles.overlayTitle}>{offline ? 'You’re offline' : 'The shop didn’t load'}</Text>
              <Text style={styles.overlayText}>
                {offline ? 'Your cart is saved. The shop comes back as soon as you reconnect.' : 'Check your connection and try again.'}
              </Text>
              <Pressable
                onPress={() => {
                  setFailed(false);
                  shell.current?.reload();
                }}
                style={styles.primary}
                accessibilityRole="button"
              >
                <Text style={styles.primaryText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={[styles.tabs, { paddingBottom: framed ? 10 : Math.max(insets.bottom, 8) }]}>
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <Pressable
                key={t.key}
                onPress={() => openTab(t.key)}
                style={styles.tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t.label}
              >
                <View>
                  <Ionicons name={(active ? t.activeIcon : t.icon) as Icon} size={24} color={active ? colors.forest : '#9AA39C'} />
                  {t.key === 'cart' && cart > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{cart}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.tabLabel, active && { color: colors.forest }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {banner ? (
          <Animated.View style={[styles.banner, { top: framed ? 10 : insets.top + 6, transform: [{ translateY: bannerY }] }]}>
            <Pressable
              onPress={() => {
                if (banner.path) shell.current?.navigate(banner.path);
                Animated.timing(bannerY, { toValue: -160, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();
              }}
              style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}
              accessibilityRole="button"
            >
              <View style={styles.bannerIcon}>
                <Text style={{ color: colors.cream, fontWeight: '800' }}>J</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>JUNIPER · now</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{banner.title}</Text>
                <Text style={{ fontSize: 14, color: colors.ink }} numberOfLines={2}>
                  {banner.body}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
      {framed ? (
        <View style={styles.caption}>
          <Text style={styles.captionTitle}>Wrapt</Text>
          <Text style={styles.captionText}>
            The Juniper & Co. website running inside a native app shell: native tabs with a live cart badge, header with back and share,
            Face ID lock on Account, offline screen and notifications from the website.
          </Text>
          <Text style={styles.captionText}>
            This is the browser preview. Install the Android app from the GitHub release for the real native features.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  pageFramed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 48, backgroundColor: '#E9E3D8', padding: 24 },
  app: { backgroundColor: colors.cream, overflow: 'hidden' },
  appFull: { flex: 1 },
  appFramed: {
    width: 400,
    height: 820,
    maxHeight: '100%',
    borderRadius: 40,
    borderWidth: 10,
    borderColor: '#151816',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.cream,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  side: { width: 76 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  mark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  markText: { color: colors.cream, fontWeight: '800', fontSize: 17 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.forest },
  progress: { height: 2, backgroundColor: colors.sage },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: 11, fontWeight: '700', color: '#9AA39C' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.clay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  badgeText: { color: colors.white, fontSize: 10.5, fontWeight: '800' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  lockIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  overlayTitle: { fontSize: 22, fontWeight: '800', color: colors.forest, textAlign: 'center' },
  overlayText: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 21, maxWidth: 320 },
  primary: { marginTop: 12, backgroundColor: colors.forest, paddingVertical: 14, paddingHorizontal: 34, borderRadius: 14 },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  secondary: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 20 },
  secondaryText: { color: colors.forest, fontWeight: '700', fontSize: 15 },
  banner: {
    position: 'absolute',
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  bannerIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  caption: { width: 340, gap: 12 },
  captionTitle: { fontSize: 34, fontWeight: '800', color: colors.forest },
  captionText: { fontSize: 15.5, lineHeight: 23, color: '#3F4742' },
});
