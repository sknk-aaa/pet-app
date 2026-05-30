import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';

const EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

const TERMS = [
  { title: '第1条（適用）', body: '本規約は、本アプリの利用に関する一切の関係に適用されます。' },
  { title: '第2条（禁止事項）', body: '法令または公序良俗に違反する行為、運営を妨害する行為を禁止します。' },
  { title: '第3条（免責事項）', body: '本アプリは、記録データの保全について万全を期しますが、データの消失について責任を負いません。' },
  { title: '第4条（サービス内容の変更）', body: '運営は、ユーザーに通知することなくサービス内容を変更・停止できるものとします。' },
  { title: '第5条（規約の変更）', body: '運営は、必要と判断した場合、本規約を変更できるものとします。' },
];

export default function Terms() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>利用規約</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {TERMS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第6条（課金・自動更新サブスクリプション）</Text>
          <Text style={styles.sectionBody}>
            本アプリの有料プラン（まいにちペット Pro）は、月額の自動更新サブスクリプション、または買い切りでご利用いただけます。
            サブスクリプションは、期間終了の24時間前までに解約しない限り自動更新されます。
            お支払いは App Store アカウントに請求され、解約はデバイスの設定アプリから行えます。
            購入・サブスクリプションには、Apple の標準利用許諾契約（EULA）が適用されます。
          </Text>
        </View>

        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(EULA_URL)}>
          <Text style={styles.linkText}>利用許諾契約（EULA）を表示</Text>
          <Ionicons name="open-outline" size={16} color={DS.colors.accent} />
        </TouchableOpacity>

        <Text style={styles.note}>本規約は簡易版です。正式版は今後追加されます。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  navBack: { padding: 4 },
  navTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.colors.text, marginBottom: 6 },
  sectionBody: { fontSize: 14, color: DS.colors.textMid, lineHeight: 22 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: DS.colors.card, borderRadius: DS.radius.md,
    borderWidth: 1, borderColor: DS.colors.border, marginBottom: 20,
  },
  linkText: { fontSize: 14, fontWeight: '600', color: DS.colors.accent },
  note: { fontSize: 12, color: DS.colors.textHint, lineHeight: 18 },
});
