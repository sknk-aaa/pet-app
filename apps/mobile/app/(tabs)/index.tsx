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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ヘッダー: [日付 左] [今日の1枚 中央] [歯車 右] */}
        <View style={styles.header}>
          <Text style={styles.headerDate}>{formatHomeDate(today)}</Text>
          <Text style={styles.headerTitle}>今日の1枚</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="settings-outline" size={22} color={DS.home.text} />
          </TouchableOpacity>
        </View>

        {/* ストリークバッジ 中央 */}
        {streakCount > 0 && (
          <View style={styles.streakRow}>
            <StreakBadge count={streakCount} note={isRecorded ? undefined : '昨日まで記録中'} />
          </View>
        )}

        {isLoading ? (
          <View style={styles.loader}>
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
      {/* 写真+情報 一体カード (shadow外層 + overflow内層) */}
      <View style={styles.cardOuter}>
        <View style={styles.cardInner}>

          {/* 写真 */}
          <Photo radius={0} style={styles.photo} uri={entry.image_uri} />

          {/* 情報エリア */}
          <View style={styles.info}>
            <Text style={styles.infoTitle}>{entry.title}</Text>

            {entry.memo ? (
              <Text style={styles.infoMemo}>{entry.memo}</Text>
            ) : null}

            <View style={styles.chipsRow}>
              {entry.pets.map(pet => (
                <Chip key={pet.id} icon="paw" label={pet.name} />
              ))}
              {tagDisplay && <Chip icon="pricetag-outline" label={tagDisplay} />}
            </View>

            {entry.featured_submitted === 1 && (
              <View style={styles.featuredBtn}>
                <Ionicons name="paw" size={15} color={DS.home.accent} />
                <Text style={styles.featuredText}>今日のペット 参加中</Text>
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
          <Text style={styles.editText}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.calLink}
          onPress={() => router.push('/(tabs)/calendar')}
          activeOpacity={0.75}
        >
          <Text style={styles.calLinkText}>カレンダーで見返す</Text>
          <Ionicons name="chevron-forward" size={16} color={DS.home.accent} />
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

function UnrecordedView({ petName }: { petName: string }) {
  const { data: memory } = useMemoryEntry();
  return (
    <>
      <Card style={styles.emptyCard}>
        <View style={styles.cameraCircle}>
          <Ionicons name="camera-outline" size={28} color={DS.colors.accent} />
        </View>
        <Text style={styles.emptyTitle}>今日はまだ記録がありません</Text>
        <Text style={styles.emptySub}>{petName}の今日の渾身の1枚を残しましょう</Text>
        <TouchableOpacity style={styles.cta} onPress={() => router.push('/photo-form')} activeOpacity={0.85}>
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.ctaText}>今日の1枚を残す</Text>
        </TouchableOpacity>
      </Card>
      {memory && <MemoryCard entry={memory} />}
    </>
  );
}

function MemoryCard({ entry }: { entry: Entry }) {
  return (
    <Card style={styles.memCard} p={0}>
      <View style={styles.memHead}>
        <View style={styles.memHeadLeft}>
          <Ionicons name="image-outline" size={16} color={DS.colors.textMid} />
          <Text style={styles.memHeadTitle}>思い出の1枚</Text>
        </View>
        <View style={styles.memBadge}>
          <Text style={styles.memBadgeText}>去年の今日</Text>
        </View>
      </View>
      <Photo style={styles.memPhoto} uri={entry.thumbnail_uri} />
      <View style={styles.memFoot}>
        <Text style={styles.memTitle}>{entry.title}</Text>
        <Text style={styles.memDate}>{formatDisplayDate(entry.date)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: DS.home.background },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },

  // ── ヘッダー ──
  // [日付 flex:1 左] [タイトル 中央] [歯車 flex:1 右]
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingTop:     10,
    paddingBottom:  6,
  },
  headerDate: {
    flex:       1,
    fontFamily: DS.font.regular,
    fontSize:   13,
    color:      DS.colors.textHint,
  },
  headerTitle: {
    fontFamily:    DS.font.bold,
    fontSize:      28,
    color:         DS.home.text,
    letterSpacing: -0.5,
  },
  settingsBtn: {
    flex:        1,
    alignItems:  'flex-end',
    padding:     4,
  },

  // ── ストリーク ──
  streakRow: { alignItems: 'center', paddingTop: 6, paddingBottom: 14 },
  loader:    { minHeight: 200, justifyContent: 'center', alignItems: 'center' },

  // ── 写真カード ──
  // 外層: shadow / 内層: overflow:hidden でコーナークリップ
  cardOuter: {
    borderRadius:    20,
    backgroundColor: '#FFFFFF',
    shadowColor:     '#6B3A1F',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.10,
    shadowRadius:    18,
    elevation:       5,
  },
  cardInner: {
    borderRadius: 20,
    overflow:     'hidden',
  },
  photo: { width: '100%', height: 280 },

  // 情報エリア
  info: {
    backgroundColor:   '#FFFFFF',
    paddingTop:        16,
    paddingHorizontal: 18,
    paddingBottom:     16,
    gap:               10,
  },
  infoTitle: {
    fontFamily:    DS.font.bold,
    fontSize:      22,
    color:         DS.home.text,
    letterSpacing: -0.3,
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
    gap:               7,
    backgroundColor:   DS.home.pill,
    borderRadius:      100,
    borderWidth:       1,
    borderColor:       DS.home.outline,
    paddingVertical:   7,
    paddingHorizontal: 14,
  },
  chipText: {
    fontFamily: DS.font.medium,
    fontSize:   14,
    color:      DS.home.text,
  },

  // 今日のペット参加中
  featuredBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    borderWidth:       1,
    borderColor:       DS.home.accent,
    borderRadius:      100,
    paddingVertical:   10,
  },
  featuredText: {
    fontFamily: DS.font.medium,
    fontSize:   14,
    color:      DS.home.accent,
  },

  // アクション行
  actionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingTop:        16,
    paddingBottom:     8,
    paddingHorizontal: 4,
  },
  editBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    borderWidth:       1,
    borderColor:       DS.home.accent,
    borderRadius:      100,
    paddingVertical:   10,
    paddingHorizontal: 22,
  },
  editText: {
    fontFamily: DS.font.bold,
    fontSize:   15,
    color:      DS.home.accent,
  },
  calLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calLinkText: {
    fontFamily: DS.font.bold,
    fontSize:   15,
    color:      DS.home.accent,
  },

  // ── 未記録 ──
  emptyCard: { alignItems: 'center', gap: 12, paddingVertical: 32, paddingHorizontal: 22 },
  cameraCircle: {
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: DS.colors.accentLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  emptyTitle: { fontFamily: DS.font.bold, fontSize: 22, color: DS.colors.text, textAlign: 'center', marginTop: 4 },
  emptySub:   { fontFamily: DS.font.regular, fontSize: 14, color: DS.colors.textMid, textAlign: 'center', lineHeight: 23 },
  cta: {
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
    shadowOpacity:   0.28,
    shadowRadius:    12,
    elevation:       6,
  },
  ctaText: { fontFamily: DS.font.bold, color: '#fff', fontSize: 17 },

  // ── 思い出カード ──
  memCard: { overflow: 'hidden', marginTop: 16 },
  memHead: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        14,
    paddingBottom:     10,
  },
  memHeadLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memHeadTitle: { fontFamily: DS.font.bold, fontSize: 16, color: DS.colors.text },
  memBadge: {
    backgroundColor:   DS.colors.cardCream,
    borderRadius:      DS.radius.pill,
    paddingVertical:   3,
    paddingHorizontal: 10,
    borderWidth:       1,
    borderColor:       DS.colors.border,
  },
  memBadgeText: { fontFamily: DS.font.medium, fontSize: 12, color: DS.colors.textMid },
  memPhoto:  { width: '100%', height: 200, borderRadius: 0 },
  memFoot: {
    paddingVertical:   14,
    paddingHorizontal: 16,
    alignItems:        'center',
    gap:               4,
  },
  memTitle: { fontFamily: DS.font.bold, fontSize: 20, color: DS.colors.text },
  memDate:  { fontFamily: DS.font.regular, fontSize: 13, color: DS.colors.textHint },
});
