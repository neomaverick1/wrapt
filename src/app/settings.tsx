import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SITE_URL } from '@/lib/links';
import { useSettings } from '@/state/settings';
import { colors } from '@/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.h1}>App settings</Text>
        <Pressable onPress={() => router.back()} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close" size={20} color={colors.forest} />
        </Pressable>
      </View>
      <Text style={styles.note}>These are native settings of the app around the website.</Text>

      <View style={styles.card}>
        <Row
          icon={Platform.OS === 'ios' ? 'scan-outline' : 'finger-print'}
          title={Platform.OS === 'ios' ? 'Lock Account with Face ID' : 'Lock Account with fingerprint'}
          text="Asks for biometrics before showing orders and saved details."
          value={settings.biometricLock}
          onChange={(v) => update({ biometricLock: v })}
        />
        <View style={styles.sep} />
        <Row
          icon="notifications-outline"
          title="Order and stock notifications"
          text="Shipping updates and back-in-stock alerts sent by the website."
          value={settings.notifications}
          onChange={(v) => update({ notifications: v })}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>About</Text>
        <Info label="Website" value={SITE_URL.replace('https://', '')} />
        <Info label="App version" value={Constants.expoConfig?.version ?? '1.0.0'} />
        <Info label="Deep links" value="wrapt://product/monstera" />
        <Info label="Built with" value="React Native, Expo, TypeScript" />
      </View>
    </ScrollView>
  );
}

function Row({
  icon,
  title,
  text,
  value,
  onChange,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  text: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={20} color={colors.forest} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{title}</Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{text}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.forest, false: '#D9D3C8' }} thumbColor={colors.white} />
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 }}>
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', color: colors.forest },
  h2: { fontSize: 17, fontWeight: '800', color: colors.forest, marginBottom: 6 },
  note: { fontSize: 14, color: colors.muted, marginTop: -8 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: 14 },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
});
