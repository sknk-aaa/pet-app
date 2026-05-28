import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  initIAP,
  closeIAP,
  fetchProducts,
  purchasePro,
  restorePurchases,
  IAP_PRODUCTS,
} from '@/services/iap';
import { useAuthStore } from '@/store/authStore';
import { SparklesIcon } from '@/components/icons/SparklesIcon';
import { DS } from '@/theme';
import type { Product, SubscriptionProduct } from 'expo-iap';

const FEATURES = [
  { icon: 'paw',              text: '2匹目以降のペットを登録できる' },
  { icon: 'calendar',        text: 'ペットごとにカレンダーで振り返れる' },
  { icon: 'ribbon-outline',  text: 'ペットごとに記念日を管理できる' },
];

export default function Pro() {
  const isPro = useAuthStore(state => state.isPro);
  const [products, setProducts] = useState<(Product | SubscriptionProduct)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initIAP().then(() => fetchProducts().then(setProducts)).catch(() => {});
    return () => { closeIAP().catch(() => {}); };
  }, []);

  const monthlyProduct = products.find(p => p.id === IAP_PRODUCTS.MONTHLY);
  const lifetimeProduct = products.find(p => p.id === IAP_PRODUCTS.LIFETIME);

  const handlePurchase = async (productId: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await purchasePro(productId);
      Alert.alert('購入完了', 'Pro機能が有効になりました！');
      router.back();
    } catch {
      Alert.alert('エラー', '購入に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert('復元完了', '購入が復元されました。');
        router.back();
      } else {
        Alert.alert('復元失敗', '復元できる購入がありませんでした。');
      }
    } catch {
      Alert.alert('エラー', '購入の復元に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.handle} />
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={24} color={DS.colors.textMid} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ヒーロー */}
        <View style={styles.hero}>
          <SparklesIcon size={64} color={DS.colors.accent} />
          <Text style={styles.heroTitle}>まいにちペット Pro</Text>
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

        {isPro ? (
          <View style={styles.activeCard}>
            <Ionicons name="checkmark-circle" size={24} color={DS.colors.accent} />
            <Text style={styles.activeText}>現在Proプランをご利用中です</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={() => handlePurchase(IAP_PRODUCTS.MONTHLY)}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="sparkles-outline" size={18} color="#fff" />
                  <Text style={styles.buttonText}>
                    {monthlyProduct ? `月額 ${monthlyProduct.displayPrice} で始める` : '月額プランで始める'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {lifetimeProduct && (
              <TouchableOpacity
                style={styles.lifetimeBtn}
                disabled={loading}
                onPress={() => handlePurchase(IAP_PRODUCTS.LIFETIME)}
              >
                <Text style={styles.lifetimeBtnText}>
                  買い切り {lifetimeProduct.displayPrice}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
              <Text style={styles.restoreText}>購入を復元する</Text>
            </TouchableOpacity>
          </>
        )}

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
  restoreText: { fontSize: 14, color: DS.colors.textMid },
  buttonDisabled: { backgroundColor: DS.colors.accentPill, shadowOpacity: 0, elevation: 0 },
  lifetimeBtn: {
    paddingVertical: 12, width: '100%', alignItems: 'center',
    borderWidth: 1.5, borderColor: DS.colors.accent, borderRadius: DS.radius.pill,
  },
  lifetimeBtnText: { fontSize: 15, color: DS.colors.accent, fontWeight: '600' },
  activeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: DS.colors.accentLight, borderRadius: DS.radius.card,
    padding: 20, width: '100%', justifyContent: 'center',
  },
  activeText: { fontSize: 15, color: DS.colors.accent, fontWeight: '600' },
  legal: {
    fontSize:   11,
    color:      DS.colors.textHint,
    textAlign:  'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
