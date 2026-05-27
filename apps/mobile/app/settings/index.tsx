import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { Card } from '@/components/Card';
import { SettingRow } from '@/components/SettingRow';
import { PetAvatar } from '@/components/PetAvatar';
import { useSelectedPet } from '@/hooks/usePets';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { setSetting } from '@/db/settings';
import { requestPermission, scheduleOrUpdateDailyReminder } from '@/services/notifications';
import { SPECIES_DB_TO_DISPLAY } from '@/utils/species';

function LockRow({ label }: { label: string }) {
  return (
    <View style={styles.lockRow}>
      <Ionicons name="lock-closed-outline" size={12} color={DS.colors.textHint} />
      <Text style={styles.lockText}>{label}</Text>
    </View>
  );
}

export default function Settings() {
  const selectedPet    = useSelectedPet();
  const { settings, updateSettings } = useAppStore();
  const user           = useAuthStore(state => state.user);
  const isLoggedIn     = !!user;
  const displaySpecies = selectedPet ? SPECIES_DB_TO_DISPLAY[selectedPet.species] : 'ねこ';

  const toggleCameraRoll = async (v: boolean) => {
    await setSetting('save_to_camera_roll', v ? 'true' : 'false');
    updateSettings({ save_to_camera_roll: v });
  };

  const toggleReminder = async (v: boolean) => {
    await setSetting('notification_enabled', v ? 'true' : 'false');
    updateSettings({ notification_enabled: v });
    if (v) {
      const permitted = await requestPermission();
      if (permitted) {
        await scheduleOrUpdateDailyReminder(true, settings.notification_time ?? '20:00');
      }
    } else {
      await scheduleOrUpdateDailyReminder(false, settings.notification_time ?? '20:00');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.accent} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>設定</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Pet profile card */}
        <Card style={styles.petCard}>
          <TouchableOpacity style={styles.petRow} onPress={() => router.push('/settings/pets')}>
            <PetAvatar species={displaySpecies} iconUri={selectedPet?.icon_uri} size={54} />
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{selectedPet?.name ?? 'まる'}</Text>
              <Text style={styles.petMeta}>登録中のペット 1匹</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>無料プラン</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={DS.colors.textHint} />
          </TouchableOpacity>
        </Card>

        {/* 通知 */}
        <Text style={styles.sectionLabel}>通知</Text>
        <Card style={styles.sectionCard} p={0}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>記録リマインダー</Text>
            <Switch
              value={settings.notification_enabled ?? false}
              onValueChange={toggleReminder}
              trackColor={{ false: '#D8CEC4', true: DS.colors.accent }}
              thumbColor="#fff"
              ios_backgroundColor="#D8CEC4"
            />
          </View>
          <View style={styles.sectionDivider} />
          <SettingRow
            label="通知時刻"
            value="20:00"
            onPress={() => router.push('/settings/notifications')}
            divider={false}
          />
        </Card>
        <Text style={styles.sectionHelper}>今日の1枚を残す時間にお知らせします</Text>

        {/* 写真と保存 */}
        <Text style={styles.sectionLabel}>写真と保存</Text>
        <Card style={styles.sectionCard} p={0}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>カメラロールにも保存</Text>
            <Switch
              value={settings.save_to_camera_roll ?? false}
              onValueChange={toggleCameraRoll}
              trackColor={{ false: '#D8CEC4', true: DS.colors.accent }}
              thumbColor="#fff"
              ios_backgroundColor="#D8CEC4"
            />
          </View>
          <View style={styles.sectionDivider} />
          <SettingRow
            label="写真の保存について"
            onPress={() => router.push('/settings/privacy')}
            divider={false}
          />
        </Card>
        <Text style={styles.sectionHelper}>通常の記録写真はこの端末内に保存されます</Text>

        {/* 今日のペット */}
        <Text style={styles.sectionLabel}>今日のペット</Text>
        <Card style={styles.sectionCard} p={0}>
          <SettingRow
            label="自分の掲載履歴"
            rightElement={isLoggedIn ? undefined : <LockRow label="ログインが必要" />}
            onPress={isLoggedIn ? () => router.push('/settings/featured-history') : () => router.push('/login')}
          />
          <SettingRow
            label="掲載と通報について"
            onPress={() => router.push('/settings/privacy')}
            divider={false}
          />
        </Card>

        {/* Pro card */}
        <View style={styles.proCard}>
          <View style={styles.proLeft}>
            <Text style={styles.proEmoji}>👑</Text>
            <View style={styles.proInfo}>
              <Text style={styles.proTitle}>Proにアップグレード</Text>
              <Text style={styles.proSub}>複数ペット・月まとめ・比較表示を楽しめます</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.proBtn} onPress={() => router.push('/pro')}>
            <Text style={styles.proBtnText}>詳しく見る</Text>
          </TouchableOpacity>
        </View>

        {/* アカウント */}
        <Text style={styles.sectionLabel}>アカウント</Text>
        <Card style={styles.sectionCard} p={0}>
          <SettingRow
            label="ログイン"
            onPress={() => router.push('/login')}
          />
          <SettingRow
            label="購入を復元"
            rightElement={isLoggedIn ? undefined : <LockRow label="ログインが必要" />}
            onPress={isLoggedIn ? () => router.push('/settings/account') : () => router.push('/login')}
            divider={false}
          />
        </Card>

        {/* アプリについて */}
        <Text style={styles.sectionLabel}>アプリについて</Text>
        <Card style={styles.sectionCard} p={0}>
          <SettingRow
            label="プライバシーポリシー"
            onPress={() => router.push('/settings/privacy')}
          />
          <SettingRow
            label="利用規約"
            onPress={() => router.push('/settings/terms')}
          />
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>バージョン 1.0.0</Text>
          </View>
        </Card>

        <View style={{ height: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  nav: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  navBack:  { padding: 4 },
  navTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },

  scroll: { paddingHorizontal: 16, paddingBottom: 32 },

  petCard: { marginBottom: 20, marginTop: 4 },
  petRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  petInfo: { flex: 1, gap: 4 },
  petName: { fontSize: 18, fontWeight: '700', color: DS.colors.text },
  petMeta: { fontSize: 13, color: DS.colors.textMid },
  planBadge: {
    alignSelf:         'flex-start',
    backgroundColor:   DS.colors.peach,
    borderRadius:      DS.radius.pill,
    paddingVertical:   3,
    paddingHorizontal: 10,
    borderWidth:       1,
    borderColor:       DS.colors.border,
    marginTop:         2,
  },
  planBadgeText: { fontSize: 11, color: DS.colors.textMid },

  sectionLabel: {
    fontSize:     13,
    fontWeight:   '500',
    color:        DS.colors.textMid,
    paddingLeft:  4,
    paddingBottom: 8,
    marginTop:    4,
  },
  sectionCard:    { paddingHorizontal: 16, marginBottom: 6 },
  sectionDivider: { height: 0.5, backgroundColor: DS.colors.border },
  sectionHelper: {
    fontSize:     12,
    color:        DS.colors.textHint,
    marginLeft:   4,
    marginTop:    4,
    marginBottom: 16,
    lineHeight:   18,
  },

  toggleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleLabel: { fontSize: 16, color: DS.colors.text },

  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockText: { fontSize: 12, color: DS.colors.textHint },

  proCard: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   DS.colors.peach,
    borderRadius:      DS.radius.card,
    padding:           16,
    borderWidth:       1,
    borderColor:       'rgba(232,130,74,0.2)',
    marginBottom:      20,
    marginTop:         4,
    gap:               12,
    ...DS.shadow.card,
  },
  proLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  proEmoji: { fontSize: 28, lineHeight: 32 },
  proInfo:  { flex: 1, gap: 3 },
  proTitle: { fontSize: 15, fontWeight: '700', color: DS.colors.text },
  proSub:   { fontSize: 11, color: DS.colors.textMid },
  proBtn: {
    borderWidth:       1.5,
    borderColor:       DS.colors.accent,
    borderRadius:      DS.radius.pill,
    paddingVertical:   8,
    paddingHorizontal: 14,
    flexShrink:        0,
  },
  proBtnText: { fontSize: 13, fontWeight: '600', color: DS.colors.accent },

  versionRow:   { paddingVertical: 14 },
  versionLabel: { fontSize: 16, color: DS.colors.textMid },
});
