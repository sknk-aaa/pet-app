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

const SECTIONS = [
  {
    title: '収集する情報',
    body: '本アプリはメールアドレス、投稿写真・タイトル・メモ、アプリの利用状況（クラッシュレポートなど）を収集します。',
  },
  {
    title: '情報の利用目的',
    body: '収集した情報は、サービスの提供・改善、サポート対応、不正利用の防止のために使用します。第三者への販売は行いません。',
  },
  {
    title: 'データの保管',
    body: 'データはSupabase（米国）のサーバーに暗号化して保存されます。アカウント削除時はすべてのデータを削除します。',
  },
  {
    title: 'お問い合わせ',
    body: 'プライバシーに関するお問い合わせは、アプリ内のサポートからご連絡ください。',
  },
];

export default function Privacy() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>プライバシーポリシー</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.updated}>最終更新: 2026年1月1日</Text>
        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
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
    paddingHorizontal: 20,
    paddingBottom:     40,
    gap:               20,
    paddingTop:         8,
  },
  updated: {
    fontSize:   12,
    color:      DS.colors.textHint,
    textAlign:  'center',
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize:   15,
    fontWeight: '700',
    color:      DS.colors.text,
  },
  sectionBody: {
    fontSize:   14,
    color:      DS.colors.textMid,
    lineHeight: 23,
  },
});
