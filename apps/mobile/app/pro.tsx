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

const FEATURES = [
  { icon: 'calendar',           text: 'カレンダーを無制限に振り返る' },
  { icon: 'star',               text: '今日のペットに何度でも参加できる' },
  { icon: 'cloud-upload-outline', text: 'バックアップ容量が増える' },
  { icon: 'shield-checkmark-outline', text: '広告なしで快適に使える' },
];

export default function Pro() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.handle} />
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={24} color={DS.colors.textMid} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ヒーロー */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.heroTitle}>Pet Diary Pro</Text>
          <Text style={styles.heroSub}>もっと自由に、もっと長く、うちの子を残そう</Text>
        </View>

        {/* 機能リスト */}
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as never} size={20} color={DS.colors.accent} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* 価格 */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>月額</Text>
          <Text style={styles.price}>¥480</Text>
          <Text style={styles.priceSub}>いつでもキャンセル可能</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Ionicons name="sparkles-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Proにする</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreBtn}>
          <Text style={styles.restoreText}>購入を復元する</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          お支払いはApp Storeアカウントに請求されます。
          キャンセルはいつでも設定アプリから行えます。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: DS.colors.bg,
  },
  handle: {
    width:           40,
    height:           4,
    borderRadius:     2,
    backgroundColor:  DS.colors.border,
    alignSelf:        'center',
    marginTop:         8,
  },
  closeBtn: {
    position: 'absolute',
    top:       24,
    right:     20,
    zIndex:    10,
    padding:    4,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom:     32,
    alignItems:        'center',
    gap:               24,
  },
  hero: {
    alignItems: 'center',
    gap:         8,
    paddingTop:  16,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: {
    fontSize:   28,
    fontWeight: '800',
    color:      DS.colors.text,
  },
  heroSub: {
    fontSize:   15,
    color:      DS.colors.textMid,
    textAlign:  'center',
    lineHeight: 24,
  },
  featureList: {
    width:           '100%',
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.card,
    padding:         20,
    gap:             16,
    ...DS.shadow.card,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            14,
  },
  featureIcon: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: DS.colors.accentLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  featureText: {
    flex:       1,
    fontSize:   15,
    color:      DS.colors.text,
    lineHeight: 22,
  },
  priceCard: {
    alignItems:      'center',
    backgroundColor: DS.colors.accentLight,
    borderRadius:    DS.radius.card,
    paddingVertical:    20,
    width:           '100%',
    gap:              4,
  },
  priceLabel: {
    fontSize: 13,
    color:    DS.colors.textMid,
  },
  price: {
    fontSize:   36,
    fontWeight: '800',
    color:      DS.colors.accent,
  },
  priceSub: {
    fontSize: 12,
    color:    DS.colors.textHint,
  },
  button: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:              8,
    backgroundColor: DS.colors.accent,
    borderRadius:    DS.radius.pill,
    paddingVertical:    16,
    paddingHorizontal:  40,
    width:           '100%',
    justifyContent:  'center',
    ...DS.shadow.float,
  },
  buttonText: {
    color:      '#fff',
    fontSize:   17,
    fontWeight: '700',
  },
  restoreBtn: {
    padding: 4,
  },
  restoreText: {
    fontSize:   14,
    color:      DS.colors.textMid,
  },
  legal: {
    fontSize:   11,
    color:      DS.colors.textHint,
    textAlign:  'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
