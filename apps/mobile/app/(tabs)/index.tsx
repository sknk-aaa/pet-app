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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ヘッダー — 日付(左上)+タイトル(左下大) + 設定(右) */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerDate}>{formatHomeDate(today)}</Text>
            <Text style={styles.headerTitle}>今日の1枚</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.settingsBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={22} color={DS.home.text} />
          </TouchableOpacity>
        </View>

        {/* ストリークバッジ */}
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

/* ────────────────────────────────────────────────────
   記録済みビュー
   写真が全幅ヒーロー → 白いシートがスライドアップ
──────────────────────────────────────────────────── */
function RecordedView({ entry }: { entry: EntryWithPets }) {
  const tagDisplay = entry.anniversary_tag_type
    ? ANNIVERSARY_TAG_DB_TO_DISPLAY[entry.anniversary_tag_type]
    : null;

  return (
    <>
      {/* 全幅ヒーロー写真 */}
      <View style={styles.hero}>
        <Photo radius={0} style={styles.heroImg} uri={entry.image_uri} />

        {/* 下端へ向かう暗いグラデーション */}
        <LinearGradient
          colors={['transparent', 'rgba(38,14,2,0.68)']}
          style={styles.heroGrad}
        />

        {/* タグチップ — グラデーションの上に浮かぶ */}
        <View style={styles.heroChips}>
          {entry.pets.map(pet => (
            <GhostChip key={pet.id} icon="paw" label={pet.name} />
          ))}
          {tagDisplay && <GhostChip icon="pricetag-outline" label={tagDisplay} />}
        </View>
      </View>

      {/* 白いシート — 写真の上にスライドアップ */}
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{entry.title}</Text>

        {entry.memo ? (
          <Text style={styles.sheetMemo}>{entry.memo}</Text>
        ) : null}

        {entry.featured_submitted === 1 && (
          <View style={styles.featuredBtn}>
            <Ionicons name="paw" size={15} color={DS.home.accent} />
            <Text style={styles.featuredBtnText}>今日のペット 参加中</Text>
          </View>
        )}

        <View style={styles.sheetDivider} />

        {/* アクション */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/photo-form')}
            activeOpacity={0.75}
          >
            <Ionicons name="create-outline" size={15} color={DS.home.accent} />
            <Text style={styles.editBtnText}>編集</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.calLink}
            onPress={() => router.push('/(tabs)/calendar')}
            activeOpacity={0.75}
          >
            <Text style={styles.calLinkText}>カレンダーで見返す</Text>
            <Ionicons name="chevron-forward" size={15} color={DS.home.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

function GhostChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.ghostChip}>
      <Ionicons name={icon} size={12} color="rgba(255,255,255,0.92)" />
      <Text style={styles.ghostChipText}>{label}</Text>
    </View>
  );
}

/* ────────────────────────────────────────────────────
   未記録ビュー
──────────────────────────────────────────────────── */
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

/* ────────────────────────────────────────────────────
   スタイル
──────────────────────────────────────────────────── */
const SHEET_OVERLAP = 28;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: DS.home.background },
  scroll: { paddingBottom: 32 },

  // ── ヘッダー ──
  header: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingTop:        10,
    paddingBottom:     4,
  },
  headerLeft:  { gap: 1 },
  headerDate: {
    fontFamily: DS.font.regular,
    fontSize:   12,
    color:      DS.colors.textHint,
    lineHeight: 16,
  },
  headerTitle: {
    fontFamily:    DS.font.heavy,
    fontSize:      30,
    color:         DS.home.text,
    letterSpacing: -1,
    lineHeight:    36,
  },
  settingsBtn: { marginTop: 8, padding: 2 },

  // ── ストリーク ──
  streakRow: {
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingTop:        6,
    paddingBottom:     14,
  },
  loader: { minHeight: 200, justifyContent: 'center', alignItems: 'center' },

  // ── ヒーロー写真 ──
  hero: { width: '100%', height: 360 },
  heroImg: { width: '100%', height: 360 },
  heroGrad: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
    height:   180,
  },
  heroChips: {
    position:      'absolute',
    bottom:        SHEET_OVERLAP + 20,
    left:          20,
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  ghostChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(255,255,255,0.16)',
    borderRadius:      100,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.32)',
    paddingVertical:   6,
    paddingHorizontal: 13,
  },
  ghostChipText: {
    fontFamily: DS.font.medium,
    fontSize:   13,
    color:      '#FFFFFF',
  },

  // ── 白いシート ──
  sheet: {
    backgroundColor:      '#FFFFFF',
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    marginTop:            -SHEET_OVERLAP,
    paddingTop:           24,
    paddingHorizontal:    22,
    paddingBottom:        10,
    gap:                  10,
    shadowColor:          '#2A1200',
    shadowOffset:         { width: 0, height: -4 },
    shadowOpacity:        0.07,
    shadowRadius:         10,
    elevation:            6,
  },
  sheetTitle: {
    fontFamily:    DS.font.heavy,
    fontSize:      24,
    color:         DS.home.text,
    letterSpacing: -0.5,
    lineHeight:    32,
  },
  sheetMemo: {
    fontFamily: DS.font.regular,
    fontSize:   14,
    color:      DS.home.textSoft,
    lineHeight: 22,
  },
  featuredBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    borderWidth:       1.5,
    borderColor:       DS.home.accent,
    borderRadius:      100,
    paddingVertical:   12,
    marginTop:         2,
  },
  featuredBtnText: {
    fontFamily: DS.font.bold,
    fontSize:   14,
    color:      DS.home.accent,
  },
  sheetDivider: {
    height:          1,
    backgroundColor: DS.colors.border,
    marginVertical:  4,
  },
  actions: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingTop:     4,
    paddingBottom:  8,
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
  calLink: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  calLinkText: {
    fontFamily: DS.font.medium,
    fontSize:   14,
    color:      DS.home.accent,
  },

  // ── 未記録 ──
  emptyCard: {
    alignItems:        'center',
    gap:               12,
    paddingVertical:   32,
    paddingHorizontal: 22,
    marginHorizontal:  16,
  },
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
    shadowOpacity:   0.30,
    shadowRadius:    12,
    elevation:       6,
  },
  ctaText: { fontFamily: DS.font.bold, color: '#fff', fontSize: 17 },

  // ── 思い出カード ──
  memCard: { overflow: 'hidden', marginTop: 16, marginHorizontal: 16 },
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
