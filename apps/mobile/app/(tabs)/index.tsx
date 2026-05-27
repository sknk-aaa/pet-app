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
import { LinearGradient } from 'expo-linear-gradient';
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <Text style={styles.headerDate}>{formatHomeDate(today)}</Text>
          </View>
          <Text style={styles.headerTitle}>今日の1枚</Text>
          <View style={[styles.headerSide, styles.headerSideRight]}>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.settingsBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="settings-outline" size={22} color={DS.home.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Streak ── */}
        {streakCount > 0 && (
          <View style={styles.streakRow}>
            <StreakBadge
              count={streakCount}
              note={isRecorded ? undefined : '昨日まで記録中'}
            />
          </View>
        )}

        {/* ── Content ── */}
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

/* ─────────────────────────────────────────────────
   RecordedView
───────────────────────────────────────────────── */
function RecordedView({ entry }: { entry: EntryWithPets }) {
  const tagDisplay = entry.anniversary_tag_type
    ? ANNIVERSARY_TAG_DB_TO_DISPLAY[entry.anniversary_tag_type]
    : null;

  return (
    <>
      {/*
        Shadow wrapper (outer) + clip wrapper (inner)
        iOS では overflow:hidden が shadow を打ち消すため2層に分離
      */}
      <View style={styles.cardShadow}>
        <View style={styles.card}>

          {/* 写真 + グラデーション */}
          <View>
            <Photo radius={0} style={styles.photo} uri={entry.image_uri} />
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.30)']}
              style={styles.photoFade}
            />
          </View>

          {/* テキスト情報 */}
          <View style={styles.info}>
            <Text style={styles.infoTitle}>{entry.title}</Text>

            {entry.memo ? (
              <Text style={styles.infoMemo}>{entry.memo}</Text>
            ) : null}

            {/* タグチップ */}
            <View style={styles.chipsRow}>
              {entry.pets.map(pet => (
                <Chip key={pet.id} icon="paw" label={pet.name} />
              ))}
              {tagDisplay && (
                <Chip icon="pricetag-outline" label={tagDisplay} />
              )}
            </View>

            {/* 今日のペット参加中バッジ */}
            {entry.featured_submitted === 1 && (
              <View style={styles.featuredBtn}>
                <Ionicons name="paw" size={15} color={DS.home.accent} />
                <Text style={styles.featuredBtnText}>今日のペット 参加中</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* アクション行 */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/photo-form')}
          activeOpacity={0.75}
        >
          <Ionicons name="create-outline" size={16} color={DS.home.accent} />
          <Text style={styles.editBtnText}>編集</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.calendarLink}
          onPress={() => router.push('/(tabs)/calendar')}
          activeOpacity={0.75}
        >
          <Text style={styles.calendarLinkText}>カレンダーで見返す</Text>
          <Ionicons name="chevron-forward" size={16} color={DS.home.accent} />
        </TouchableOpacity>
      </View>
    </>
  );
}

function Chip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={13} color={DS.home.textSoft} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

/* ─────────────────────────────────────────────────
   UnrecordedView
───────────────────────────────────────────────── */
function UnrecordedView({ petName }: { petName: string }) {
  const { data: memory } = useMemoryEntry();
  return (
    <>
      <Card style={styles.emptyCard}>
        <View style={styles.cameraCircle}>
          <Ionicons name="camera-outline" size={28} color={DS.colors.accent} />
        </View>
        <Text style={styles.emptyTitle}>今日はまだ記録がありません</Text>
        <Text style={styles.emptySub}>
          {petName}の今日の渾身の1枚を残しましょう
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/photo-form')}
          activeOpacity={0.85}
        >
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.ctaButtonText}>今日の1枚を残す</Text>
        </TouchableOpacity>
      </Card>

      {memory && <MemoryCard entry={memory} />}
    </>
  );
}

/* ─────────────────────────────────────────────────
   MemoryCard
───────────────────────────────────────────────── */
function MemoryCard({ entry }: { entry: Entry }) {
  return (
    <Card style={styles.memoryCard} p={0}>
      <View style={styles.memoryHeader}>
        <View style={styles.memoryHeaderLeft}>
          <Ionicons name="image-outline" size={16} color={DS.colors.textMid} />
          <Text style={styles.memoryHeaderTitle}>思い出の1枚</Text>
        </View>
        <View style={styles.memoryYearBadge}>
          <Text style={styles.memoryYearText}>去年の今日</Text>
        </View>
      </View>
      <Photo style={styles.memoryPhoto} uri={entry.thumbnail_uri} />
      <View style={styles.memoryFooter}>
        <Text style={styles.memoryTitle}>{entry.title}</Text>
        <Text style={styles.memoryDate}>{formatDisplayDate(entry.date)}</Text>
      </View>
    </Card>
  );
}

/* ─────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: DS.home.background },
  scroll: { paddingHorizontal: 16, paddingBottom: 28 },

  // ── Header ──
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingTop:     10,
    paddingBottom:  4,
    marginBottom:   2,
  },
  headerSide:      { flex: 1 },
  headerSideRight: { alignItems: 'flex-end' },
  headerDate: {
    fontFamily: DS.font.regular,
    fontSize:   13,
    color:      DS.colors.textHint,
    lineHeight: 18,
  },
  headerTitle: {
    fontFamily:    DS.font.heavy,
    fontSize:      26,
    color:         DS.home.text,
    letterSpacing: -0.6,
    textAlign:     'center',
  },
  settingsBtn: { padding: 2 },

  // ── Streak ──
  streakRow:        { alignItems: 'center', paddingTop: 6, paddingBottom: 14 },
  loadingContainer: { minHeight: 220, justifyContent: 'center', alignItems: 'center' },

  // ── Photo card (shadow + clip 2層) ──
  cardShadow: {
    borderRadius:    20,
    backgroundColor: '#FFFFFF',
    shadowColor:     '#5C2D0E',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.11,
    shadowRadius:    22,
    elevation:       6,
  },
  card: {
    borderRadius: 20,
    overflow:     'hidden',
  },

  // 写真
  photo:     { width: '100%', height: 288 },
  photoFade: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
    height:   76,
  },

  // 情報エリア
  info: {
    backgroundColor:   '#FFFFFF',
    paddingTop:        16,
    paddingHorizontal: 20,
    paddingBottom:     18,
    gap:               9,
  },
  infoTitle: {
    fontFamily:    DS.font.bold,
    fontSize:      22,
    color:         DS.home.text,
    letterSpacing: -0.3,
    lineHeight:    30,
  },
  infoMemo: {
    fontFamily: DS.font.regular,
    fontSize:   14,
    color:      DS.home.textSoft,
    lineHeight: 22,
  },

  // チップ
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   DS.home.pill,
    borderRadius:      100,
    borderWidth:       1,
    borderColor:       DS.home.outline,
    paddingVertical:   7,
    paddingHorizontal: 14,
  },
  chipText: {
    fontFamily: DS.font.medium,
    fontSize:   13,
    color:      DS.home.text,
  },

  // 今日のペット参加中
  featuredBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    borderWidth:       1.5,
    borderColor:       DS.home.accent,
    borderRadius:      100,
    paddingVertical:   11,
    marginTop:         2,
  },
  featuredBtnText: {
    fontFamily: DS.font.bold,
    fontSize:   14,
    color:      DS.home.accent,
  },

  // アクション行
  actionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 4,
    paddingTop:        14,
    paddingBottom:     6,
  },
  editBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               7,
    borderWidth:       1.5,
    borderColor:       DS.home.accent,
    borderRadius:      100,
    paddingVertical:   9,
    paddingHorizontal: 20,
  },
  editBtnText: {
    fontFamily: DS.font.bold,
    fontSize:   14,
    color:      DS.home.accent,
  },
  calendarLink: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           3,
  },
  calendarLinkText: {
    fontFamily: DS.font.medium,
    fontSize:   14,
    color:      DS.home.accent,
  },

  // ── Unrecorded ──
  emptyCard: { alignItems: 'center', gap: 12, paddingVertical: 32, paddingHorizontal: 22 },
  cameraCircle: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: DS.colors.accentLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  emptyTitle: {
    fontFamily: DS.font.bold,
    fontSize:   22,
    color:      DS.colors.text,
    textAlign:  'center',
    marginTop:  4,
  },
  emptySub: {
    fontFamily: DS.font.regular,
    fontSize:   14,
    color:      DS.colors.textMid,
    textAlign:  'center',
    lineHeight: 23,
  },
  ctaButton: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    width:           '100%',
    backgroundColor: DS.colors.accent,
    borderRadius:    DS.radius.pill,
    paddingVertical: 15,
    justifyContent:  'center',
    marginTop:       8,
    shadowColor:     '#D0601A',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.30,
    shadowRadius:    12,
    elevation:       6,
  },
  ctaButtonText: {
    fontFamily: DS.font.bold,
    color:      '#fff',
    fontSize:   17,
  },

  // ── Memory card ──
  memoryCard: { overflow: 'hidden', marginTop: 16 },
  memoryHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        14,
    paddingBottom:     10,
  },
  memoryHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memoryHeaderTitle: {
    fontFamily: DS.font.bold,
    fontSize:   16,
    color:      DS.colors.text,
  },
  memoryYearBadge: {
    backgroundColor:   DS.colors.cardCream,
    borderRadius:      DS.radius.pill,
    paddingVertical:   3,
    paddingHorizontal: 10,
    borderWidth:       1,
    borderColor:       DS.colors.border,
  },
  memoryYearText: {
    fontFamily: DS.font.medium,
    fontSize:   12,
    color:      DS.colors.textMid,
  },
  memoryPhoto:  { width: '100%', height: 200, borderRadius: 0 },
  memoryFooter: {
    paddingVertical:   14,
    paddingHorizontal: 16,
    alignItems:        'center',
    gap:               4,
  },
  memoryTitle: {
    fontFamily: DS.font.bold,
    fontSize:   20,
    color:      DS.colors.text,
  },
  memoryDate: {
    fontFamily: DS.font.regular,
    fontSize:   13,
    color:      DS.colors.textHint,
  },
});
