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
import { useTodayEntry, useMemoryEntry } from '@/hooks/useEntries';
import { useStreak } from '@/hooks/useStreak';
import { useSelectedPet } from '@/hooks/usePets';
import { formatDisplayDate, getTodayJST } from '@/utils/date';
import { ANNIVERSARY_TAG_DB_TO_DISPLAY } from '@/utils/species';
import type { EntryWithPets, Entry } from '@/types';

function formatHomeDate(date: string): string {
  const [, month, day] = date.split('-').map(Number);
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][
    new Date(Number(date.slice(0, 4)), month - 1, day).getDay()
  ];
  return `${month}月${day}日 ${weekday}曜日`;
}

export default function Home() {
  const { data: todayEntry, isLoading } = useTodayEntry();
  const { data: streak } = useStreak();
  const selectedPet = useSelectedPet();
  const today = getTodayJST();

  const displayName = selectedPet?.name ?? 'うちの子';
  const streakCount = streak?.display_streak ?? 0;
  const isRecorded  = !!todayEntry;
  const pageTitle   = isRecorded ? '今日の1枚' : '今日の1枚を残そう';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerDate}>{formatHomeDate(today)}</Text>
          <Text style={[styles.headerTitle, isRecorded && styles.headerTitleRecorded]}>{pageTitle}</Text>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color={DS.home.text} />
          </TouchableOpacity>
        </View>

        {streakCount > 0 && (
          <View style={styles.streakRow}>
            <StreakBadge count={streakCount} note={isRecorded ? undefined : '昨日まで記録中'} />
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={DS.colors.accent} />
          </View>
        ) : todayEntry ? (
            <RecordedView entry={todayEntry} />
          ) : (
            <UnrecordedView petName={displayName} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RecordedView({ entry }: { entry: EntryWithPets }) {
  const tagDisplay = entry.anniversary_tag_type
    ? ANNIVERSARY_TAG_DB_TO_DISPLAY[entry.anniversary_tag_type]
    : null;

  return (
    <>
      <View style={styles.photoCard}>
        <Photo radius={0} style={styles.recordedPhoto} uri={entry.image_uri} />
        <View style={styles.photoInfo}>
          <Text style={styles.photoTitle}>{entry.title}</Text>
          {entry.memo ? (
            <Text style={styles.photoMemo}>{entry.memo}</Text>
          ) : null}
          <View style={styles.chipsRow}>
            {entry.pets.map(pet => (
              <HomeChip key={pet.id} icon="paw" label={pet.name} />
            ))}
            {tagDisplay && (
              <HomeChip icon="pricetag-outline" label={tagDisplay} />
            )}
          </View>
          {entry.featured_submitted === 1 && (
            <View style={styles.featuredOutline}>
              <Ionicons name="paw" size={16} color={DS.home.accent} />
              <Text style={styles.featuredOutlineText}>今日のペット 参加中</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/photo-form')}>
          <Ionicons name="create" size={18} color={DS.home.accent} />
          <Text style={styles.editBtnText}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.calendarLink}
          onPress={() => router.push('/(tabs)/calendar')}
        >
          <Text style={styles.calendarLinkText}>カレンダーで見返す</Text>
          <Ionicons name="chevron-forward" size={19} color={DS.home.accent} />
        </TouchableOpacity>
      </View>
    </>
  );
}

function HomeChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.homeChip}>
      <Ionicons name={icon} size={15} color={DS.home.text} />
      <Text style={styles.homeChipText}>{label}</Text>
    </View>
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
  safe:   { flex: 1, backgroundColor: DS.home.background },
  header: {
    height:        57,
    position:      'relative',
    justifyContent: 'flex-end',
    alignItems:    'center',
  },
  settingsBtn: {
    position: 'absolute',
    right:    1,
    bottom:   3,
    padding:  6,
  },
  headerDate: {
    position:   'absolute',
    left:       0,
    top:        10,
    fontFamily: DS.font.regular, 
    fontSize:   13,
    color:      DS.home.text,
  },
  headerTitle:          { fontFamily: DS.font.bold, fontSize: 30, color: DS.home.text, letterSpacing: -0.5 },
  headerTitleRecorded:  { fontSize: 30 },
  streakRow:            { alignItems: 'center', paddingTop: 7, paddingBottom: 10 },
  loadingContainer:     { minHeight: 220, justifyContent: 'center', alignItems: 'center' },
  scroll:               { paddingHorizontal: 16, paddingBottom: 10 },

  // Recorded
  photoCard: {
    borderRadius:    20,
    overflow:        'hidden',
    backgroundColor: DS.home.card,
    ...DS.home.shadow,
  },
  recordedPhoto: { width: '100%', height: 280 },
  photoInfo: {
    backgroundColor:   DS.home.card,
    paddingTop:        16,
    paddingHorizontal: 18,
    paddingBottom:     16,
    gap:               8,
  },
  photoTitle:   { fontFamily: DS.font.bold, fontSize: 23, color: DS.home.text, letterSpacing: -0.2 },
  photoMemo:    { fontFamily: DS.font.regular, fontSize: 14, color: DS.home.text, lineHeight: 22 },
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  homeChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               7,
    backgroundColor:   DS.home.pill,
    borderRadius:      DS.home.radius.pill,
    paddingVertical:   6,
    paddingHorizontal: 14,
  },
  homeChipText: { fontFamily: DS.font.medium, fontSize: 14, color: DS.home.text },
  featuredOutline: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    borderWidth:       1,
    borderColor:       DS.home.accent,
    borderRadius:      DS.home.radius.pill,
    paddingVertical:   10,
    width:             '100%',
    marginTop:         2,
  },
  featuredOutlineText: { fontFamily: DS.font.medium, fontSize: 14, color: DS.home.accent },
  actionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 12,
    paddingTop:        17,
    paddingBottom:     8,
  },
  editBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               9,
    borderWidth:       1,
    borderColor:       DS.home.accent,
    borderRadius:      DS.home.radius.pill,
    paddingVertical:   10,
    paddingHorizontal: 22,
  },
  editBtnText:      { fontFamily: DS.font.bold, fontSize: 15, color: DS.home.accent },
  calendarLink:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  calendarLinkText: { fontFamily: DS.font.bold, fontSize: 15, color: DS.home.accent },

  // Unrecorded
  emptyCard: { alignItems: 'center', gap: 12, paddingVertical: 28, paddingHorizontal: 22 },
  cameraCircle: {
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: DS.colors.accentLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  emptyTitle:   { fontFamily: DS.font.bold, fontSize: 23, color: DS.colors.text, textAlign: 'center', marginTop: 4 },
  emptySub:     { fontFamily: DS.font.regular, fontSize: 15, color: DS.colors.textMid, textAlign: 'center', lineHeight: 25 },
  ctaButton: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    width:             '100%',
    backgroundColor:   DS.colors.accent,
    borderRadius:      DS.radius.pill,
    paddingVertical:   16,
    justifyContent:    'center',
    marginTop:         6,
    ...DS.shadow.float,
  },
  ctaButtonText: { fontFamily: DS.font.bold, color: '#fff', fontSize: 18 },

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
  memoryHeaderTitle: { fontFamily: DS.font.bold, fontSize: 18, color: DS.colors.text },
  memoryYearBadge: {
    backgroundColor:   DS.colors.cardCream,
    borderRadius:      DS.radius.pill,
    paddingVertical:   3,
    paddingHorizontal: 10,
    borderWidth:       1,
    borderColor:       DS.colors.border,
  },
  memoryYearText: { fontFamily: DS.font.medium, fontSize: 13, color: DS.colors.textMid },
  memoryPhoto:    { width: '100%', height: 200, borderRadius: 0 },
  memoryFooter:   { paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', gap: 4 },
  memoryTitle:    { fontFamily: DS.font.bold, fontSize: 21, color: DS.colors.text },
  memoryDate:     { fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.textHint },
});
