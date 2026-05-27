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
    title: '第1条（利用規約の適用）',
    body: '本規約は、Pet Diary（以下「本アプリ」）の利用に関する条件を定めるものです。ユーザーは本規約に同意したうえで本アプリを利用するものとします。',
  },
  {
    title: '第2条（禁止事項）',
    body: '本アプリにおいて、他者のプライバシーを侵害するコンテンツの投稿、著作権を侵害するコンテンツの投稿、その他法令に反する行為を禁止します。',
  },
  {
    title: '第3条（免責事項）',
    body: '本アプリは現状のまま提供されます。運営者は、本アプリの利用によって生じた損害について、一切の責任を負いません。',
  },
  {
    title: '第4条（規約の変更）',
    body: '運営者は予告なく本規約を変更することがあります。変更後の規約は本アプリ内に掲載した時点で効力を生じます。',
  },
];

export default function Terms() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>利用規約</Text>
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
