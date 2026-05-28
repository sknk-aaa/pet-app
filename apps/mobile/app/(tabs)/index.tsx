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
import { Photo } from '@/components/Photo';
import { useTodayEntry, useMemoryEntry } from '@/hooks/useEntries';
import { useStreak } from '@/hooks/useStreak';
import { useSelectedPet } from '@/hooks/usePets';
import { formatDisplayDate, getTodayJST } from '@/utils/date';
import { ANNIVERSARY_TAG_DB_TO_DISPLAY } from '@/utils/species';
import type { EntryWithPets, Entry } from '@/types';

// ─── palette ─────────────────────────────────────────────
const C = {
  bg:        '#F2EDE3',  // 古紙
  paper:     '#FAF7F0',  // 明るい紙
  ink:       '#1A1008',  // 万年筆インク
  inkMid:    '#6B5140',  // セピア中
  inkFaint:  '#A08B76',  // セピア薄
  accent:    '#8B3018',  // バーントシエナ
  accentMid: '#B05A30',  // テラコッタ
  accentBg:  '#EDE0D4',  // テラコッタ薄
  border:    '#C8B89A',  // 紙のボーダー
  rule:      '#D4C4A8',  // 罫線
} as const;

// ─── fonts (ShipporiMincho) ───────────────────────────────
const F = {
  regular:  'ShipporiMincho_400Regular',
  medium:   'ShipporiMincho_500Medium',
  semibold: 'ShipporiMincho_600SemiBold',
  bold:     'ShipporiMincho_700Bold',
  heavy:    'ShipporiMincho_800ExtraBold',
} as const;

function formatJournalDate(date: string): string {
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
          <Text style={styles.headerDate}>{formatJournalDate(today)}</Text>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>今日の1枚</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.headerRight}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="settings-outline" size={19} color={C.inkFaint} />
          </TouchableOpacity>
        </View>

        {/* ── 罫線 ── */}
        <View style={styles.ruleThick} />

        {/* ── ストリーク ── */}
        {streakCount > 0 && (
          <View style={styles.streakRow}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakMain}>連続</Text>
            <Text style={styles.streakCount}>{streakCount}</Text>
            <Text style={styles.streakMain}>日</Text>
            {!isRecorded && (
              <Text style={styles.streakNote}>　昨日まで</Text>
            )}
          </View>
        )}

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={C.accentMid} size="large" />
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
      {/* 写真：マウント写真風 */}
      <View style={styles.photoMount}>
        <Photo radius={0} style={styles.photo} uri={entry.image_uri} />
      </View>

      {/* 日記本文エリア */}
      <View style={styles.entry}>

        {/* タイトル */}
        <Text style={styles.entryTitle}>{entry.title}</Text>

        {/* メモ */}
        {entry.memo ? (
          <Text style={styles.entryMemo}>{entry.memo}</Text>
        ) : null}

        {/* タグ */}
        {(entry.pets.length > 0 || tagDisplay) && (
          <View style={styles.tagsRow}>
            {entry.pets.map((pet, i) => (
              <React.Fragment key={pet.id}>
                {i > 0 && <Text style={styles.tagDot}>·</Text>}
                <View style={styles.tag}>
                  <Ionicons name="paw" size={11} color={C.inkFaint} />
                  <Text style={styles.tagText}>{pet.name}</Text>
                </View>
              </React.Fragment>
            ))}
            {tagDisplay && (
              <>
                <Text style={styles.tagDot}>·</Text>
                <Text style={styles.tagText}>{tagDisplay}</Text>
              </>
            )}
          </View>
        )}

        {/* 今日のペット 参加中 */}
        {entry.featured_submitted === 1 && (
          <View style={styles.featuredBanner}>
            <View style={styles.featuredLine} />
            <View style={styles.featuredBadge}>
              <Ionicons name="paw" size={11} color={C.accentMid} />
              <Text style={styles.featuredText}>今日のペット 参加中</Text>
            </View>
            <View style={styles.featuredLine} />
          </View>
        )}
      </View>

      {/* アクション行 */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/photo-form')}
          activeOpacity={0.6}
        >
          <Ionicons name="create-outline" size={12} color={C.accentMid} />
          <Text style={styles.editText}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/calendar')}
          activeOpacity={0.6}
        >
          <Text style={styles.calLink}>カレンダーで見返す ›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.ruleHair, { marginTop: 28 }]} />
    </>
  );
}

// ─────────────────────────────────────────────────────────

function UnrecordedView({ petName }: { petName: string }) {
  const { data: memory } = useMemoryEntry();

  return (
    <>
      {/* 空の写真スロット */}
      <TouchableOpacity
        style={styles.emptyMount}
        onPress={() => router.push('/photo-form')}
        activeOpacity={0.75}
      >
        <Ionicons name="camera-outline" size={28} color={C.inkFaint} />
        <Text style={styles.emptyTitle}>今日の1枚を残す</Text>
        <Text style={styles.emptySub}>{petName}の渾身の1枚を</Text>
      </TouchableOpacity>

      <View style={[styles.ruleHair, { marginTop: 28 }]} />

      {memory && <MemoryCard entry={memory} />}
    </>
  );
}

function MemoryCard({ entry }: { entry: Entry }) {
  return (
    <View style={styles.memory}>
      <Text style={styles.memoryLabel}>思い出の1枚 · 去年の今日</Text>
      <View style={styles.photoMount}>
        <Photo radius={0} style={styles.memPhoto} uri={entry.thumbnail_uri} />
      </View>
      <View style={styles.memFoot}>
        <Text style={styles.memTitle}>{entry.title}</Text>
        <Text style={styles.memDate}>{formatDisplayDate(entry.date)}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 48 },

  // ── ヘッダー ──
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 24,
    paddingTop:        10,
    paddingBottom:     14,
    gap:               8,
  },
  headerDate: {
    fontFamily: F.regular,
    fontSize:   11,
    color:      C.inkFaint,
    letterSpacing: 0.4,
    flex:       1,
  },
  headerCenter: {
    position:   'absolute',
    left:       0,
    right:      0,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily:    F.bold,
    fontSize:      20,
    color:         C.ink,
    letterSpacing: 4,
  },
  headerRight: {
    flex:       1,
    alignItems: 'flex-end',
  },

  // ── 罫線 ──
  ruleThick: {
    height:           2,
    backgroundColor:  C.ink,
    marginHorizontal: 24,
    marginBottom:     4,
  },
  ruleHair: {
    height:           StyleSheet.hairlineWidth,
    backgroundColor:  C.rule,
    marginHorizontal: 24,
    marginBottom:     24,
  },

  // ── ストリーク ──
  streakRow: {
    flexDirection:     'row',
    alignItems:        'baseline',
    paddingHorizontal: 24,
    paddingVertical:   12,
    gap:               3,
  },
  streakEmoji: { fontSize: 14, lineHeight: 18 },
  streakMain:  {
    fontFamily: F.regular,
    fontSize:   13,
    color:      C.inkMid,
  },
  streakCount: {
    fontFamily: F.bold,
    fontSize:   18,
    color:      C.accent,
    lineHeight: 22,
  },
  streakNote: {
    fontFamily: F.regular,
    fontSize:   12,
    color:      C.inkFaint,
  },

  loader: { minHeight: 240, justifyContent: 'center', alignItems: 'center' },

  // ── 写真マウント ──
  photoMount: {
    marginHorizontal: 20,
    marginBottom:     0,
    borderWidth:      1,
    borderColor:      C.border,
    backgroundColor:  C.paper,
    shadowColor:      '#1A1008',
    shadowOffset:     { width: 0, height: 4 },
    shadowOpacity:    0.12,
    shadowRadius:     10,
    elevation:        4,
  },
  photo:    { width: '100%', height: 300 },
  memPhoto: { width: '100%', height: 200 },

  // ── 日記本文 ──
  entry: {
    paddingHorizontal: 24,
    paddingTop:        20,
    paddingBottom:     16,
    gap:               10,
  },
  entryTitle: {
    fontFamily:    F.bold,
    fontSize:      28,
    color:         C.ink,
    lineHeight:    40,
    letterSpacing: -0.5,
  },
  entryMemo: {
    fontFamily: F.regular,
    fontSize:   15,
    color:      C.inkMid,
    lineHeight: 28,
  },

  // タグ
  tagsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    alignItems:    'center',
    gap:           6,
    marginTop:     2,
  },
  tag: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  tagDot: {
    fontFamily: F.regular,
    fontSize:   14,
    color:      C.border,
  },
  tagText: {
    fontFamily: F.regular,
    fontSize:   13,
    color:      C.inkFaint,
  },

  // 今日のペット参加中
  featuredBanner: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginTop:     4,
  },
  featuredLine: {
    flex:            1,
    height:          StyleSheet.hairlineWidth,
    backgroundColor: C.accentMid,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  featuredText: {
    fontFamily:    F.medium,
    fontSize:      12,
    color:         C.accentMid,
    letterSpacing: 0.8,
  },

  // アクション
  actions: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 24,
    paddingVertical:   4,
  },
  editBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderWidth:       1,
    borderColor:       C.accentMid,
  },
  editText: {
    fontFamily:    F.medium,
    fontSize:      13,
    color:         C.accentMid,
    letterSpacing: 0.5,
  },
  calLink: {
    fontFamily:    F.medium,
    fontSize:      13,
    color:         C.accentMid,
    letterSpacing: 0.5,
  },

  // ── 未記録 ──
  emptyMount: {
    marginHorizontal: 20,
    height:           280,
    borderWidth:      1,
    borderColor:      C.border,
    borderStyle:      'dashed',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              10,
    backgroundColor:  C.paper,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize:   18,
    color:      C.inkMid,
    letterSpacing: 1,
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize:   13,
    color:      C.inkFaint,
  },

  // ── 思い出 ──
  memory: { gap: 0, marginTop: 8 },
  memoryLabel: {
    fontFamily:        F.regular,
    fontSize:          11,
    color:             C.inkFaint,
    letterSpacing:     1.2,
    paddingHorizontal: 24,
    marginBottom:      12,
  },
  memFoot: {
    paddingHorizontal: 24,
    paddingTop:        16,
    alignItems:        'center',
    gap:               4,
  },
  memTitle: {
    fontFamily: F.bold,
    fontSize:   20,
    color:      C.ink,
  },
  memDate: {
    fontFamily: F.regular,
    fontSize:   12,
    color:      C.inkFaint,
    letterSpacing: 0.5,
  },
});
