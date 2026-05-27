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
import { useAppStore } from '@/store/appStore';
import { useTodayEntry, useMemoryEntry } from '@/hooks/useEntries';
import { useStreak } from '@/hooks/useStreak';
import { useSelectedPet } from '@/hooks/usePets';
import { formatDisplayDate, getTodayJST } from '@/utils/date';
import { ANNIVERSARY_TAG_DB_TO_DISPLAY } from '@/utils/species';
import type { EntryWithPets, Entry } from '@/types';

export default function Home() {
  const { data: todayEntry, isLoading } = useTodayEntry();
  const { data: streak } = useStreak();
  const selectedPet = useSelectedPet();
  const today = getTodayJST();

  const displayName = selectedPet?.name ?? 'うちの子';
  const isRecorded  = !!todayEntry;
  const pageTitle   = isRecorded ? '今日の1枚' : '今日の1枚を残そう';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerDate}>{formatDisplayDate(today)}</Text>
          <Text style={[styles.headerTitle, isRecorded && styles.headerTitleRecorded]}>{pageTitle}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={22} color={DS.colors.textMid} />
        </TouchableOpacity>
      </View>

      {/* Streak */}
      <View style={styles.streakRow}>
        <StreakBadge count={streak?.display_streak ?? 0} note={isRecorded ? undefined : '昨日まで記録中'} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={DS.colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {todayEntry ? (
            <RecordedView entry={todayEntry} today={today} />
          ) : (
            <UnrecordedView petName={displayName} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function RecordedView({ entry, today }: { entry: EntryWithPets; today: string }) {
  const { data: memory } = useMemoryEntry();
  const tagDisplay = entry.anniversary_tag_type
    ? ANNIVERSARY_TAG_DB_TO_DISPLAY[entry.anniversary_tag_type]
    : null;

  return (
    <>
      {/* Today's photo card */}
      <Card style={styles.photoCard} p={0}>
        <Photo style={styles.recordedPhoto} uri={entry.image_uri} />
        <View style={styles.photoInfo}>
          <Text style={styles.photoTitle}>{entry.title}</Text>
          {entry.memo ? (
            <Text style={styles.photoMemo}>{entry.memo}</Text>
          ) : null}
          {tagDisplay && (
            <View style={styles.chipsRow}>
              <Chip label={tagDisplay} selected={false} small />
            </View>
          )}
          {entry.featured_submitted === 1 && (
            <View style={styles.featuredOutline}>
              <Ionicons name="paw" size={16} color={DS.colors.accent} />
              <Text style={styles.featuredOutlineText}>今日のペット 参加中</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Action row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/photo-form')}>
          <Ionicons name="create-outline" size={14} color={DS.colors.accent} />
          <Text style={styles.editBtnText}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.calendarLink}
          onPress={() => router.push('/(tabs)/calendar')}
        >
          <Text style={styles.calendarLinkText}>カレンダーで見返す</Text>
          <Ionicons name="chevron-forward" size={14} color={DS.colors.accent} />
        </TouchableOpacity>
      </View>

      {memory && <MemoryCard entry={memory} />}
    </>
  );
}

function UnrecordedView({ petName }: { petName: string }) {
  const { data: memory } = useMemoryEntry();
  return (
    <>
      {/* Empty state card */}
      <Card style={styles.emptyCard}>
        <View style={styles.cameraCircle}>
          <Ionicons name="camera-outline" size={28} color={DS.colors.accent} />
        </View>
        <Text style={styles.emptyTitle}>今日はまだ記録がありません</Text>
        <Text style={styles.emptySub}>{petName}の今日の渾身の1枚を残しましょう</Text>
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
    <Card style={styles.memoryCard} p={0}>
      {/* Card header */}
      <View style={styles.memoryHeader}>
        <View style={styles.memoryHeaderLeft}>
          <Ionicons name="image-outline" size={16} color={DS.colors.textMid} />
          <Text style={styles.memoryHeaderTitle}>思い出の1枚</Text>
        </View>
        <View style={styles.memoryYearBadge}>
          <Text style={styles.memoryYearText}>去年の今日</Text>
        </View>
      </View>

      {/* Full-width photo */}
      <Photo style={styles.memoryPhoto} uri={entry.thumbnail_uri} />

      {/* Footer info */}
      <View style={styles.memoryFooter}>
        <Text style={styles.memoryTitle}>{entry.title}</Text>
        <Text style={styles.memoryDate}>{formatDisplayDate(entry.date)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: DS.colors.bg },
  header: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingTop:        6,
  },
  headerLeft:           { flex: 1 },
  headerDate:           { fontSize: 12, color: DS.colors.textHint },
  headerTitle:          { fontSize: 24, fontWeight: '700', color: DS.colors.text, letterSpacing: -0.5, marginTop: 4 },
  headerTitleRecorded:  { fontSize: 22 },
  iconBtn:              { padding: 4, marginTop: 4 },
  streakRow:            { paddingHorizontal: 20, paddingVertical: 12 },
  loadingContainer:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:               { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },

  // Recorded
  photoCard:    { overflow: 'hidden' },
  recordedPhoto: { width: '100%', height: 240, borderRadius: 0 },
  photoInfo:    { padding: 16, gap: 10 },
  photoTitle:   { fontSize: 20, fontWeight: '700', color: DS.colors.text, letterSpacing: -0.3 },
  photoMemo:    { fontSize: 13, color: DS.colors.textMid, lineHeight: 22 },
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featuredOutline: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    borderWidth:       1.5,
    borderColor:       DS.colors.border,
    borderRadius:      DS.radius.pill,
    paddingVertical:   8,
    paddingHorizontal: 18,
    alignSelf:         'flex-start',
  },
  featuredOutlineText: { fontSize: 13, fontWeight: '600', color: DS.colors.accent },
  actionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 4,
    paddingVertical:   4,
  },
  editBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    borderWidth:       1.5,
    borderColor:       DS.colors.border,
    borderRadius:      DS.radius.pill,
    paddingVertical:   8,
    paddingHorizontal: 18,
  },
  editBtnText:      { fontSize: 13, fontWeight: '500', color: DS.colors.accent },
  calendarLink:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calendarLinkText: { fontSize: 13, fontWeight: '500', color: DS.colors.accent },

  // Unrecorded
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 20 },
  cameraCircle: {
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: DS.colors.accentLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  emptyTitle:   { fontSize: 16, fontWeight: '600', color: DS.colors.text, textAlign: 'center' },
  emptySub:     { fontSize: 13, color: DS.colors.textHint, textAlign: 'center', lineHeight: 21 },
  ctaButton: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    width:             '100%',
    backgroundColor:   DS.colors.accent,
    borderRadius:      DS.radius.pill,
    paddingVertical:   14,
    justifyContent:    'center',
    marginTop:         6,
    ...DS.shadow.float,
  },
  ctaButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Memory card
  memoryCard:   { overflow: 'hidden' },
  memoryHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        14,
    paddingBottom:     10,
  },
  memoryHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memoryHeaderTitle: { fontSize: 14, fontWeight: '600', color: DS.colors.text },
  memoryYearBadge: {
    backgroundColor:   DS.colors.cardCream,
    borderRadius:      DS.radius.pill,
    paddingVertical:   3,
    paddingHorizontal: 10,
    borderWidth:       1,
    borderColor:       DS.colors.border,
  },
  memoryYearText: { fontSize: 11, color: DS.colors.textHint },
  memoryPhoto:    { width: '100%', height: 200, borderRadius: 0 },
  memoryFooter:   { paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', gap: 4 },
  memoryTitle:    { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  memoryDate:     { fontSize: 12, color: DS.colors.textHint },
});
