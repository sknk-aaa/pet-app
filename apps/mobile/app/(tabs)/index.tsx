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
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { Card } from '@/components/Card';
import { Photo } from '@/components/Photo';
import { StreakBadge } from '@/components/StreakBadge';
import { Chip } from '@/components/Chip';
import { PetAvatar } from '@/components/PetAvatar';
import { useAppStore } from '@/store/appStore';
import { useTodayEntry, useMemoryEntry } from '@/hooks/useEntries';
import { useStreak } from '@/hooks/useStreak';
import { useSelectedPet } from '@/hooks/usePets';
import { formatDisplayDate, getTodayJST } from '@/utils/date';
import { SPECIES_DB_TO_DISPLAY, ANNIVERSARY_TAG_DB_TO_DISPLAY } from '@/utils/species';
import type { EntryWithPets, Entry } from '@/types';

export default function Home() {
  const selectedPet = useSelectedPet();
  const petFilter = useAppStore(state => state.petFilter);
  const { data: todayEntry, isLoading } = useTodayEntry();
  const { data: streak } = useStreak();
  const today = getTodayJST();

  const displayName = selectedPet?.name ?? 'うちの子';
  const displaySpecies = selectedPet ? SPECIES_DB_TO_DISPLAY[selectedPet.species] : 'ねこ';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.petPill} onPress={() => router.push('/pet-select')}>
          <PetAvatar species={displaySpecies} iconUri={selectedPet?.icon_uri} size={24} />
          <Text style={styles.petName}>{displayName}</Text>
          <Ionicons name="chevron-down" size={14} color={DS.colors.textMid} />
        </TouchableOpacity>
        <StreakBadge count={streak?.display_streak ?? 0} />
        <TouchableOpacity onPress={() => router.push('/settings/')} style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={22} color={DS.colors.textMid} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={DS.colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {todayEntry ? (
            <RecordedView entry={todayEntry} today={today} petName={displayName} />
          ) : (
            <UnrecordedView petName={displayName} today={today} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function RecordedView({ entry, today, petName }: { entry: EntryWithPets; today: string; petName: string }) {
  const { data: memory } = useMemoryEntry();
  const tagDisplay = entry.anniversary_tag_type
    ? ANNIVERSARY_TAG_DB_TO_DISPLAY[entry.anniversary_tag_type]
    : null;

  return (
    <>
      <Card style={styles.entryCard}>
        <View style={styles.entryDateRow}>
          <Text style={styles.entryDate}>{formatDisplayDate(today)}</Text>
          <TouchableOpacity onPress={() => router.push('/photo-form')}>
            <Ionicons name="create-outline" size={20} color={DS.colors.textHint} />
          </TouchableOpacity>
        </View>
        <Photo style={styles.photo} uri={entry.image_uri} />
        <Text style={styles.entryTitle}>{entry.title}</Text>
        {entry.memo ? <Text style={styles.entryMemo}>{entry.memo}</Text> : null}
        <View style={styles.entryFooter}>
          {tagDisplay && <Chip label={tagDisplay} selected={false} small />}
          {entry.featured_submitted === 1 && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={11} color={DS.colors.accent} />
              <Text style={styles.featuredText}>今日のペットに参加中</Text>
            </View>
          )}
        </View>
      </Card>

      {memory && <MemoryCard entry={memory} />}
    </>
  );
}

function UnrecordedView({ petName, today }: { petName: string; today: string }) {
  const { data: memory } = useMemoryEntry();
  return (
    <>
      <Card cream style={styles.ctaCard}>
        <Text style={styles.ctaEmoji}>📷</Text>
        <Text style={styles.ctaTitle}>今日の1枚を残そう</Text>
        <Text style={styles.ctaSub}>{petName}の今日を記録しましょう</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/photo-form')}>
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.ctaButtonText}>今日の1枚を残す</Text>
        </TouchableOpacity>
      </Card>

      {memory && <MemoryCard entry={memory} />}
    </>
  );
}

function MemoryCard({ entry }: { entry: Entry }) {
  return (
    <>
      <Text style={styles.sectionTitle}>この日の思い出</Text>
      <TouchableOpacity onPress={() => router.push({ pathname: '/day-detail', params: { date: entry.date } })}>
        <Card style={styles.memoryCard}>
          <Photo style={styles.memoryPhoto} uri={entry.thumbnail_uri} />
          <View style={styles.memoryInfo}>
            <Text style={styles.memoryDate}>{formatDisplayDate(entry.date)}</Text>
            <Text style={styles.memoryTitle}>{entry.title}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  petPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: DS.colors.card,
    borderRadius: DS.radius.pill, paddingHorizontal: 12, paddingVertical: 6,
    gap: 6, flex: 1, ...DS.shadow.card,
  },
  petName: { fontSize: 15, fontWeight: '600', color: DS.colors.text, flex: 1 },
  iconBtn: { padding: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  entryCard: { gap: 10 },
  entryDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryDate: { fontSize: 13, color: DS.colors.textHint, fontWeight: '500' },
  photo: { borderRadius: DS.radius.md, aspectRatio: 1 },
  entryTitle: { fontSize: 17, fontWeight: '700', color: DS.colors.text },
  entryMemo: { fontSize: 14, color: DS.colors.textMid, lineHeight: 22 },
  entryFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  featuredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: DS.colors.accentLight, borderRadius: DS.radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  featuredText: { fontSize: 11, color: DS.colors.accent, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: DS.colors.textMid, marginTop: 4 },
  memoryCard: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  memoryPhoto: { width: 80, aspectRatio: 1, borderRadius: DS.radius.sm, flexShrink: 0 },
  memoryInfo: { flex: 1 },
  memoryDate: { fontSize: 12, color: DS.colors.textHint, marginBottom: 4 },
  memoryTitle: { fontSize: 15, fontWeight: '600', color: DS.colors.text },
  ctaCard: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  ctaEmoji: { fontSize: 48 },
  ctaTitle: { fontSize: 20, fontWeight: '700', color: DS.colors.text },
  ctaSub: { fontSize: 14, color: DS.colors.textMid, textAlign: 'center' },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.pill,
    paddingHorizontal: 28, paddingVertical: 14, marginTop: 8, ...DS.shadow.float,
  },
  ctaButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
