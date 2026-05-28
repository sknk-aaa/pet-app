import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const C = {
  bg:          '#F4F1ED',
  card:        '#FFFFFF',
  ink:         '#18160F',
  inkMid:      '#564E44',
  inkFaint:    '#9A9088',
  accent:      '#CC4E1E',
  accentLight: '#F5ECE7',
  border:      '#E4DDD6',
} as const;

const F = {
  regular: 'NotoSansJP_400Regular',
  medium:  'NotoSansJP_500Medium',
  bold:    'NotoSansJP_700Bold',
  black:   'NotoSansJP_900Black',
} as const;

function formatHeaderDate(date: string): string {
  const [, month, day] = date.split('-').map(Number);
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][
    new Date(Number(date.slice(0, 4)), month - 1, day).getDay()
  ];
  return `${month}/${day} ${weekday}`;
}

export default function Home() {
  const { data: todayEntry, isLoading } = useTodayEntry();
  const { data: streak }  = useStreak();
  const selectedPet       = useSelectedPet();
  const today             = getTodayJST();

  const displayName = selectedPet?.name ?? 'うちの子';
  const streakCount = streak?.display_streak ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── ヘッダー ── */}
        <View style={styles.header}>
          <Text style={styles.headerDate}>{formatHeaderDate(today)}</Text>
          <Text style={styles.headerTitle}>今日の1枚</Text>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.headerRight}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={20} color={C.inkFaint} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : todayEntry ? (
          <RecordedView entry={todayEntry} streakCount={streakCount} />
        ) : (
          <UnrecordedView petName={displayName} streakCount={streakCount} />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────

function RecordedView({ entry, streakCount }: { entry: EntryWithPets; streakCount: number }) {
  const tagDisplay = entry.anniversary_tag_type
    ? ANNIVERSARY_TAG_DB_TO_DISPLAY[entry.anniversary_tag_type]
    : null;

  return (
    <>
      {/* ── 写真ヒーロー ── */}
      <View style={styles.hero}>
        <Photo radius={0} style={styles.heroPhoto} uri={entry.image_uri} />

        {/* グラデーションオーバーレイ */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* ストリーク（右上） */}
        {streakCount > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{streakCount}日</Text>
          </View>
        )}

        {/* タイトル（左下） */}
        <View style={styles.heroBottom}>
          <Text style={styles.heroTitle} numberOfLines={2}>{entry.title}</Text>
        </View>
      </View>

      {/* ── コンテンツカード ── */}
      <View style={styles.contentCard}>

        {/* メモ */}
        {entry.memo ? (
          <Text style={styles.memo}>{entry.memo}</Text>
        ) : null}

        {/* タグ */}
        {(entry.pets.length > 0 || tagDisplay) && (
          <View style={styles.tagsRow}>
            {entry.pets.map(pet => (
              <View key={pet.id} style={styles.tag}>
                <Ionicons name="paw" size={12} color={C.accent} />
                <Text style={styles.tagText}>{pet.name}</Text>
              </View>
            ))}
            {tagDisplay && (
              <View style={styles.tag}>
                <Ionicons name="pricetag-outline" size={12} color={C.inkFaint} />
                <Text style={styles.tagText}>{tagDisplay}</Text>
              </View>
            )}
          </View>
        )}

        {/* 今日のペット参加中 */}
        {entry.featured_submitted === 1 && (
          <View style={styles.featuredRow}>
            <Ionicons name="paw" size={13} color={C.accent} />
            <Text style={styles.featuredText}>今日のペット 参加中</Text>
          </View>
        )}

        {/* アクション */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/photo-form')}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={14} color={C.accent} />
            <Text style={styles.editText}>編集</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/calendar')}
            activeOpacity={0.7}
          >
            <Text style={styles.calLink}>カレンダーで見返す ›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

// ─────────────────────────────────────────────────────────

function UnrecordedView({ petName, streakCount }: { petName: string; streakCount: number }) {
  const { data: memory } = useMemoryEntry();

  return (
    <>
      {/* ── 撮影CTA ── */}
      <TouchableOpacity onPress={() => router.push('/photo-form')} activeOpacity={0.88}>
        <LinearGradient
          colors={['#D4601A', '#A83A10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaHero}
        >
          {streakCount > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>{streakCount}日</Text>
            </View>
          )}
          <View style={styles.ctaContent}>
            <Ionicons name="camera-outline" size={40} color="rgba(255,255,255,0.9)" />
            <Text style={styles.ctaTitle}>今日の1枚を残す</Text>
            <Text style={styles.ctaSub}>{petName}の渾身の1枚を</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── 思い出カード ── */}
      {memory && <MemoryCard entry={memory} />}
    </>
  );
}

function MemoryCard({ entry }: { entry: Entry }) {
  return (
    <View style={styles.memory}>
      <View style={styles.memHeader}>
        <View style={styles.memHeaderLeft}>
          <Ionicons name="time-outline" size={14} color={C.inkFaint} />
          <Text style={styles.memLabel}>去年の今日</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Photo radius={0} style={styles.memPhoto} uri={entry.thumbnail_uri} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.heroBottom}>
          <Text style={styles.heroTitle} numberOfLines={2}>{entry.title}</Text>
          <Text style={styles.memDate}>{formatDisplayDate(entry.date)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 48 },
  loader: { height: 400, justifyContent: 'center', alignItems: 'center' },

  // ── ヘッダー ──
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingTop:        8,
    paddingBottom:     12,
  },
  headerDate: {
    flex:       1,
    fontFamily: F.medium,
    fontSize:   13,
    color:      C.inkFaint,
    letterSpacing: 0.2,
  },
  headerTitle: {
    flex:          1,
    fontFamily:    F.black,
    fontSize:      18,
    color:         C.ink,
    textAlign:     'center',
    letterSpacing: 1.5,
  },
  headerRight: {
    flex:       1,
    alignItems: 'flex-end',
  },

  // ── 写真ヒーロー ──
  hero: {
    width:    '100%',
    overflow: 'hidden',
  },
  heroPhoto: { width: '100%', height: 360 },
  memPhoto:  { width: '100%', height: 240 },

  // ストリークバッジ（写真右上）
  streakBadge: {
    position:        'absolute',
    top:             14,
    right:           14,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius:    100,
    paddingVertical:   5,
    paddingHorizontal: 10,
  },
  streakEmoji: { fontSize: 13 },
  streakText:  {
    fontFamily: F.bold,
    fontSize:   13,
    color:      '#FFFFFF',
  },

  // タイトル（写真左下）
  heroBottom: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: 20,
    paddingBottom:     20,
    paddingTop:        48,
    gap:               4,
  },
  heroTitle: {
    fontFamily:    F.black,
    fontSize:      26,
    color:         '#FFFFFF',
    lineHeight:    36,
    letterSpacing: -0.3,
    textShadowColor:  'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  memDate: {
    fontFamily: F.regular,
    fontSize:   12,
    color:      'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
  },

  // ── コンテンツカード ──
  contentCard: {
    backgroundColor:   C.card,
    paddingHorizontal: 20,
    paddingTop:        20,
    paddingBottom:     8,
    gap:               16,
    shadowColor:       '#18160F',
    shadowOffset:      { width: 0, height: -2 },
    shadowOpacity:     0.06,
    shadowRadius:      8,
    elevation:         3,
  },
  memo: {
    fontFamily: F.regular,
    fontSize:   15,
    color:      C.inkMid,
    lineHeight: 26,
  },

  // タグ
  tagsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  tag: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   C.accentLight,
    borderRadius:      100,
    paddingVertical:   5,
    paddingHorizontal: 10,
  },
  tagText: {
    fontFamily: F.medium,
    fontSize:   12,
    color:      C.inkMid,
  },

  // 今日のペット参加中
  featuredRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingVertical:   10,
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor:       C.border,
  },
  featuredText: {
    fontFamily: F.medium,
    fontSize:   13,
    color:      C.accent,
  },

  // アクション
  actions: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor:    C.border,
  },
  editBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingVertical:   8,
    paddingHorizontal: 14,
    borderRadius:      100,
    borderWidth:       1.5,
    borderColor:       C.accent,
  },
  editText: {
    fontFamily: F.medium,
    fontSize:   13,
    color:      C.accent,
  },
  calLink: {
    fontFamily: F.medium,
    fontSize:   13,
    color:      C.accent,
  },

  // ── 未記録 CTA ──
  ctaHero: {
    width:          '100%',
    height:         360,
    justifyContent: 'center',
    alignItems:     'center',
  },
  ctaContent: {
    alignItems: 'center',
    gap:        12,
  },
  ctaTitle: {
    fontFamily:    F.black,
    fontSize:      24,
    color:         '#FFFFFF',
    letterSpacing: 0.5,
  },
  ctaSub: {
    fontFamily: F.regular,
    fontSize:   14,
    color:      'rgba(255,255,255,0.75)',
  },

  // ── 思い出 ──
  memory: {
    marginTop: 24,
    gap:       0,
  },
  memHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingBottom:     10,
  },
  memHeaderLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  memLabel: {
    fontFamily:    F.medium,
    fontSize:      13,
    color:         C.inkFaint,
    letterSpacing: 0.3,
  },
});
