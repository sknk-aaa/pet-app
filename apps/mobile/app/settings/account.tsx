import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from '@/services/auth';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { DS } from '@/theme';
import { SettingRow } from '@/components/SettingRow';

export default function Account() {
  const session = useAuthStore(state => state.session);
  const email = session?.user?.email;

  const handleLogout = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        onPress: async () => {
          try {
            await signOut();
          } catch {}
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウントを削除',
      'すべてのデータが削除されます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('delete_user_account');
              if (error) throw error;
              await signOut();
            } catch {
              Alert.alert('エラー', 'アカウントの削除に失敗しました。サポートまでお問い合わせください。');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>アカウント設定</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionHeader}>アカウント情報</Text>
        <View style={styles.section}>
          {email ? (
            <SettingRow label="メールアドレス" value={email} chevron={false} />
          ) : (
            <SettingRow label="ログインする" onPress={() => router.push('/login')} divider={false} />
          )}
        </View>

        {session && (
          <>
            <Text style={styles.sectionHeader}>その他</Text>
            <View style={styles.section}>
              <SettingRow
                label="ログアウト"
                chevron={false}
                divider={false}
                onPress={handleLogout}
                labelColor={DS.colors.textMid}
              />
            </View>

            <View style={styles.dangerSection}>
              <SettingRow
                label="アカウントを削除する"
                chevron={false}
                divider={false}
                onPress={handleDeleteAccount}
                labelColor={DS.colors.red}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  navTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: {
    fontSize: 12, fontWeight: '600', color: DS.colors.textHint,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 8,
  },
  section: {
    backgroundColor: DS.colors.card, borderRadius: DS.radius.card,
    paddingHorizontal: 16, ...DS.shadow.card,
  },
  dangerSection: {
    backgroundColor: DS.colors.card, borderRadius: DS.radius.card,
    paddingHorizontal: 16, marginTop: 20, borderWidth: 1,
    borderColor: DS.colors.red + '33', ...DS.shadow.card,
  },
});
