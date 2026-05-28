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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── ヘッダー ── */}
        <View style={styles.header}>
          <Text style={styles.headerDate}>{formatHomeDate(today)}</Text>
          <Text style={styles.headerTitle}>今日の1枚</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="settings-outline" size={22} color={DS.home.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ストリークバッジ ── */}
        {streakCount > 0 && (
          <View style={styles.streakRow}>
            <StreakBadge
              count={streakCount}
              note={isRecorded ? undefined : '昨日まで記録中'}
            />
          </View>
        )}

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={DS.home.accent} size="large" />
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

// ─────────────────────────────────────────────────────────

function RecordedView({ entry }: { entry: EntryWithPets }) {
  const tagDisplay = entry.anniversary_tag_type
    ? ANNIVERSARY_TAG_DB_TO_DISPLAY[entry.anniversary_tag_type]
    : null;

  return (
    <>
      {/* ── メインカード ── */}
      <View style={styles.cardOuter}>
        <View style={styles.cardInner}>

          {/* 写真 */}
          <Photo radius={0} style={styles.photo} uri={entry.image_uri} />

          {/* カード下部：情報エリア */}
          <View style={styles.cardBody}>
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

            {/* 今日のペット 参加中ボタン */}
            {entry.featured_submitted === 1 && (
              <View style={styles.featuredBtn}>
                <Ionicons name="paw" size={18} color={DS.home.accent} />
                <Text style={styles.featuredText}>今日のペット 参加中</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── アクション行 ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/photo-form')}
          activeOpacity={0.75}
        >
          <Ionicons name="create-outline" size={14} color={DS.home.accent} />
          <Text style={styles.editText}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/calendar')}
          activeOpacity={0.75}
        >
          <Text style={styles.calLinkText}>カレンダーで見返す ›</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function Chip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color={DS.home.text} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────

function UnrecordedView({ petName }: { petName: string }) {
  const { data: memory } = useMemoryEntry();

  return (
    <>
      {/* 未記録カード */}
      <View style={styles.cardOuter}>
        <View style={[styles.cardInner, styles.emptyCard]}>
          <View style={styles.cameraCircle}>
            <Ionicons name="camera-outline" size={28} color={DS.home.accent} />
          </View>
          <Text style={styles.emptyTitle}>今日はまだ記録がありません</Text>
          <Text style={styles.emptySub}>{petName}の今日の渾身の1枚を残しましょう</Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/photo-form')}
            activeOpacity={0.85}
          >
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>今日の1枚を残す</Text>
          </TouchableOpacity>
        </View>
      </View>

      {memory && <MemoryCard entry={memory} />}
    </>
  );
}

function MemoryCard({ entry }: { entry: Entry }) {
  return (
    <View style={[styles.cardOuter, { marginTop: 20 }]}>
      <View style={styles.cardInner}>
        <View style={styles.memHead}>
          <View style={styles.memHeadLeft}>
            <Ionicons name="image-outline" size={16} color={DS.colors.textMid} />
            <Text style={styles.memHeadTitle}>思い出の1枚</Text>
          </View>
          <View style={styles.memBadge}>
            <Text style={styles.memBadgeText}>去年の今日</Text>
          </View>
        </View>
        <Photo radius={0} style={styles.memPhoto} uri={entry.thumbnail_uri} />
        <View style={styles.memFoot}>
          <Text style={styles.memTitle}>{entry.title}</Text>
          <Text style={styles.memDate}>{formatDisplayDate(entry.date)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: DS.home.background },
  scroll: { paddingBottom: 28 },

  // ── ヘッダー ──
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingTop:        6,
    paddingBottom:     10,
  },
  headerDate: {
    flex:       1,
    fontFamily: DS.font.regular,
    fontSize:   13,
    color:      DS.home.text,
  },
  headerTitle: {
    flex:          1,
    fontFamily:    DS.font.bold,
    fontSize:      27,
    color:         DS.home.text,
    textAlign:     'center',
    letterSpacing: -0.5,
  },
  headerRight: {
    flex:       1,
    alignItems: 'flex-end',
  },

  // ── ストリーク ──
  streakRow: {
    alignItems:   'center',
    marginBottom: 16,
  },
  loader: { minHeight: 240, justifyContent: 'center', alignItems: 'center' },

  // ── カード ──
  cardOuter: {
    marginHorizontal: 16,
    marginBottom:     16,
    borderRadius:     20,
    backgroundColor:  '#FFFFFF',
    shadowColor:      '#321905',
    shadowOffset:     { width: 0, height: 3 },
    shadowOpacity:    0.10,
    shadowRadius:     16,
    elevation:        4,
  },
  cardInner: {
    borderRadius: 20,
    overflow:     'hidden',
  },
  photo: { width: '100%', height: 300 },

  // カード本文
  cardBody: {
    paddingTop:        16,
    paddingHorizontal: 18,
    paddingBottom:     18,
    gap:               12,
  },
  infoTitle: {
    fontFamily:    DS.font.bold,
    fontSize:      22,
    color:         DS.home.text,
    lineHeight:    30,
    letterSpacing: -0.3,
  },
  infoMemo: {
    fontFamily: DS.font.regular,
    fontSize:   14,
    color:      DS.home.textSoft,
    lineHeight: 23,
  },

  // タグチップ
  chipsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  chip: {
    height:        34,
    borderRadius:  17,
    borderWidth:   1.5,
    borderColor:   DS.home.outline,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    paddingLeft:   10,
    paddingRight:  14,
    backgroundColor: DS.home.background,
  },
  chipText: {
    fontFamily: DS.font.regular,
    fontSize:   13,
    color:      DS.home.text,
  },

  // 今日のペット 参加中
  featuredBtn: {
    height:         46,
    borderRadius:   23,
    borderWidth:    1.5,
    borderColor:    DS.home.accent,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    marginTop:      2,
  },
  featuredText: {
    fontFamily: DS.font.medium,
    fontSize:   15,
    color:      DS.home.accent,
  },

  // ── アクション行 ──
  actionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 22,
    marginBottom:      8,
  },
  editBtn: {
    height:        40,
    borderRadius:  20,
    borderWidth:   1.5,
    borderColor:   DS.home.accent,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    paddingLeft:   14,
    paddingRight:  18,
  },
  editText: {
    fontFamily: DS.font.medium,
    fontSize:   14,
    color:      DS.home.accent,
  },
  calLinkText: {
    fontFamily: DS.font.medium,
    fontSize:   14,
    color:      DS.home.accent,
  },

  // ── 未記録 ──
  emptyCard: {
    alignItems:        'center',
    gap:               12,
    paddingVertical:   36,
    paddingHorizontal: 24,
  },
  cameraCircle: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: DS.home.pill,
    alignItems:      'center',
    justifyContent:  'center',
  },
  emptyTitle: {
    fontFamily: DS.font.bold,
    fontSize:   19,
    color:      DS.home.text,
    textAlign:  'center',
    marginTop:  4,
  },
  emptySub: {
    fontFamily: DS.font.regular,
    fontSize:   14,
    color:      DS.home.textSoft,
    textAlign:  'center',
    lineHeight: 22,
  },
  cta: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    width:           '100%',
    backgroundColor: DS.home.accent,
    borderRadius:    DS.home.radius.pill,
    paddingVertical: 15,
    justifyContent:  'center',
    marginTop:       6,
    shadowColor:     '#321905',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.20,
    shadowRadius:    12,
    elevation:       6,
  },
  ctaText: { fontFamily: DS.font.bold, color: '#fff', fontSize: 17 },

  // ── 思い出カード ──
  memHead: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        14,
    paddingBottom:     10,
  },
  memHeadLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memHeadTitle: { fontFamily: DS.font.bold, fontSize: 15, color: DS.colors.text },
  memBadge: {
    backgroundColor:   DS.colors.cardCream,
    borderRadius:      DS.radius.pill,
    paddingVertical:   3,
    paddingHorizontal: 10,
    borderWidth:       1,
    borderColor:       DS.colors.border,
  },
  memBadgeText: { fontFamily: DS.font.medium, fontSize: 12, color: DS.colors.textMid },
  memPhoto:  { width: '100%', height: 200 },
  memFoot: {
    paddingVertical:   14,
    paddingHorizontal: 16,
    alignItems:        'center',
    gap:               4,
  },
  memTitle: { fontFamily: DS.font.bold, fontSize: 19, color: DS.colors.text },
  memDate:  { fontFamily: DS.font.regular, fontSize: 12, color: DS.colors.textHint },
});
