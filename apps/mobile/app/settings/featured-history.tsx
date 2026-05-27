import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { DS } from '@/theme';
import { REACTION_LABELS } from '@/dummy';
import { Photo } from '@/components/Photo';
import type { MyFeaturedHistory } from '@/types';

async function fetchMyHistory(): Promise<MyFeaturedHistory[]> {
  const { data, error } = await supabase
    .from('my_featured_history')
    .select('*')
    .order('featured_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export default function FeaturedHistory() {
  const session = useAuthStore(state => state.session);
  const { data: history = [], isLoading } = useQuery<MyFeaturedHistory[]>({
    queryKey: ['my_featured_history'],
    queryFn: fetchMyHistory,
    enabled: !!session,
    staleTime: 60_000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>掲載履歴</Text>
        <View style={{ width: 32 }} />
      </View>

      {!session ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={styles.emptyText}>ログインが必要です</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginBtnText}>ログインする</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={DS.colors.accent} />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⭐</Text>
          <Text style={styles.emptyText}>まだ掲載されていません</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {history.map(item => (
            <View key={item.id} style={styles.card}>
              <Photo style={styles.photo} uri={item.thumb_url} />
              <View style={styles.info}>
                <Text style={styles.date}>{item.featured_date}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.reactions}>
                  {(['cute', 'beautiful', 'cool', 'like'] as const).map(key => {
                    const count = item[`${key}_count`];
                    if (!count) return null;
                    return (
                      <View key={key} style={styles.reactionChip}>
                        <Text style={styles.reactionText}>{REACTION_LABELS[key]} {count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 12, paddingTop: 4 },
  card: {
    flexDirection: 'row', gap: 14, backgroundColor: DS.colors.card,
    borderRadius: DS.radius.card, padding: 14, ...DS.shadow.card,
  },
  photo: { width: 88, aspectRatio: 1, borderRadius: DS.radius.md, flexShrink: 0 },
  info: { flex: 1, gap: 8 },
  date: { fontSize: 12, color: DS.colors.textHint },
  title: { fontSize: 15, fontWeight: '600', color: DS.colors.text },
  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reactionChip: {
    backgroundColor: DS.colors.accentPill, borderRadius: DS.radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  reactionText: { fontSize: 11, color: DS.colors.accent, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: DS.colors.textHint },
  loginBtn: {
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.pill,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
