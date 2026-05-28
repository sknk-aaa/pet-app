import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { PawSparkleIcon } from '@/components/icons/PawSparkleIcon';

const BENEFITS = [
  { icon: 'cloud-upload-outline', text: '記録をクラウドにバックアップ' },
  { icon: 'phone-portrait-outline', text: '機種変更しても写真が消えない' },
  { icon: 'paw-outline',           text: '今日のペットに参加できる' },
];

export default function LoginPrompt() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={['#FFF0E4', '#FFCFAD']}
              style={StyleSheet.absoluteFillObject}
            />
            <PawSparkleIcon size={52} color={DS.home.accent} />
          </View>
          <Text style={styles.title}>ログインして安心して続けよう</Text>
          <Text style={styles.sub}>記録はこの端末に保存されます。ログインするとバックアップや追加機能が使えます。</Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon as never} size={18} color={DS.colors.accent} />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.replace('/login' as never)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#F59060', DS.home.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.loginBtnText}>ログイン / 新規登録</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.guestBtnText}>ゲストで使う</Text>
            <Ionicons name="chevron-forward" size={14} color={DS.colors.textMid} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: DS.colors.bg },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 32 },

  hero: { alignItems: 'center', gap: 14 },
  iconWrap: {
    width:        100,
    height:       100,
    borderRadius: 50,
    overflow:     'hidden',
    alignItems:   'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: DS.colors.text, textAlign: 'center', lineHeight: 32 },
  sub:   { fontSize: 14, color: DS.colors.textMid, textAlign: 'center', lineHeight: 22 },

  benefits: {
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.card,
    padding:         20,
    gap:             14,
    ...DS.shadow.card,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: DS.colors.accentLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  benefitText: { flex: 1, fontSize: 14, color: DS.colors.text },

  actions: { gap: 12 },
  loginBtn: {
    borderRadius:    DS.radius.pill,
    overflow:        'hidden',
    paddingVertical: 16,
    alignItems:      'center',
    ...DS.shadow.float,
  },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  guestBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
    paddingVertical: 10,
  },
  guestBtnText: { fontSize: 14, color: DS.colors.textMid },
});
