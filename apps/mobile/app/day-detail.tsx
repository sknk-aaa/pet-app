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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { Photo } from '@/components/Photo';
import { Chip } from '@/components/Chip';
import { useEntryByDate } from '@/hooks/useEntries';
import { formatDisplayDate } from '@/utils/date';
import { ANNIVERSARY_TAG_DB_TO_DISPLAY } from '@/utils/species';

export default function DayDetail() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { data: entry, isLoading } = useEntryByDate(date ?? '');

  const tagDisplay = entry?.anniversary_tag_type
    ? ANNIVERSARY_TAG_DB_TO_DISPLAY[entry.anniversary_tag_type]
    : null;

  const petNames = entry?.pets.map(p => p.name).join('・') ?? '';

  const featuredStatusText = () => {
    switch (entry?.featured_status_cache) {
      case 'pending': return '審査中です';
      case 'scheduled': return 'もうすぐ掲載されます';
      case 'featured': return '今日掲載中です';
      default: return '参加中です';
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{date ? formatDisplayDate(date) : ''}</Text>
        <TouchableOpacity onPress={() => router.push('/photo-form')} style={styles.editBtn}>
          <Ionicons name="create-outline" size={22} color={DS.colors.textMid} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={DS.colors.accent} />
        </View>
      ) : !entry ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>この日の記録はありません</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Photo style={styles.photo} uri={entry.image_uri} resizeMode="contain" />

          <View style={styles.card}>
            {petNames ? <Text style={styles.petName}>{petNames}</Text> : null}
            <Text style={styles.entryTitle}>{entry.title}</Text>
            {entry.memo ? (
              <Text style={styles.entryMemo}>{entry.memo}</Text>
            ) : null}
            <View style={styles.tagRow}>
              {tagDisplay && <Chip label={tagDisplay} selected={false} small />}
            </View>
          </View>

          {entry.featured_submitted === 1 && (
            <View style={styles.featuredCard}>
              <Ionicons name="star" size={18} color={DS.colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featuredTitle}>今日のペットに参加中</Text>
                <Text style={styles.featuredSub}>{featuredStatusText()}</Text>
              </View>
            </View>
          )}
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
  editBtn: { padding: 4 },
  navTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: DS.colors.textMid },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  photo: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#111', borderRadius: DS.radius.card },
  card: {
    backgroundColor: DS.colors.card, borderRadius: DS.radius.card,
    padding: 20, gap: 10, ...DS.shadow.card,
  },
  petName: { fontSize: 13, color: DS.colors.textHint, fontWeight: '500' },
  entryTitle: { fontSize: 20, fontWeight: '700', color: DS.colors.text },
  entryMemo: { fontSize: 15, color: DS.colors.textMid, lineHeight: 24 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featuredCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: DS.colors.accentLight, borderRadius: DS.radius.md,
    padding: 16, borderWidth: 1, borderColor: DS.colors.accent,
  },
  featuredTitle: { fontSize: 15, fontWeight: '600', color: DS.colors.accent },
  featuredSub: { fontSize: 13, color: DS.colors.accentSoft, marginTop: 2 },
});
