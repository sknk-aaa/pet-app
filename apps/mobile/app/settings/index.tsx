import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { DUMMY_PET } from '@/dummy';
import { SettingRow } from '@/components/SettingRow';
import { PetAvatar } from '@/components/PetAvatar';

export default function Settings() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>設定</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ペットセクション */}
        <Text style={styles.sectionHeader}>ペット</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.petRow} onPress={() => router.push('/settings/pets')}>
            <PetAvatar species={DUMMY_PET.species} size={44} />
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{DUMMY_PET.name}</Text>
              <Text style={styles.petSpecies}>{DUMMY_PET.species}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={DS.colors.textHint} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <SettingRow
            label="ペット管理"
            onPress={() => router.push('/settings/pets')}
          />
        </View>

        {/* 機能セクション */}
        <Text style={styles.sectionHeader}>機能</Text>
        <View style={styles.section}>
          <SettingRow
            label="通知設定"
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingRow
            label="掲載履歴"
            onPress={() => router.push('/settings/featured-history')}
          />
          <SettingRow
            label="Proにする"
            rightElement={
              <View style={styles.proBadge}>
                <Ionicons name="sparkles-outline" size={12} color={DS.colors.accent} />
                <Text style={styles.proBadgeText}>Pro</Text>
              </View>
            }
            onPress={() => router.push('/pro')}
            divider={false}
          />
        </View>

        {/* アカウントセクション */}
        <Text style={styles.sectionHeader}>アカウント</Text>
        <View style={styles.section}>
          <SettingRow
            label="ログインする"
            onPress={() => router.push('/login')}
          />
          <SettingRow
            label="アカウント設定"
            onPress={() => router.push('/settings/account')}
            divider={false}
          />
        </View>

        {/* 情報セクション */}
        <Text style={styles.sectionHeader}>情報</Text>
        <View style={styles.section}>
          <SettingRow
            label="利用規約"
            onPress={() => router.push('/settings/terms')}
          />
          <SettingRow
            label="プライバシーポリシー"
            onPress={() => router.push('/settings/privacy')}
          />
          <SettingRow
            label="バージョン"
            value="1.0.0"
            chevron={false}
            divider={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: DS.colors.bg,
  },
  nav: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  backBtn: { padding: 4 },
  navTitle: {
    fontSize:   17,
    fontWeight: '600',
    color:      DS.colors.text,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom:     32,
  },
  sectionHeader: {
    fontSize:     12,
    fontWeight:   '600',
    color:        DS.colors.textHint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop:    20,
    marginBottom:  8,
  },
  section: {
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.card,
    paddingHorizontal: 16,
    ...DS.shadow.card,
  },
  petRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             12,
    paddingVertical: 14,
  },
  petInfo: { flex: 1 },
  petName: {
    fontSize:   16,
    fontWeight: '600',
    color:      DS.colors.text,
  },
  petSpecies: {
    fontSize: 13,
    color:    DS.colors.textMid,
  },
  divider: {
    height:          0.5,
    backgroundColor: DS.colors.border,
  },
  proBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:              4,
    backgroundColor: DS.colors.accentLight,
    borderRadius:    DS.radius.pill,
    paddingHorizontal: 10,
    paddingVertical:    4,
  },
  proBadgeText: {
    fontSize:   12,
    color:      DS.colors.accent,
    fontWeight: '700',
  },
});
