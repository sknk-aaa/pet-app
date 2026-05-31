import React, { useEffect, useState } from 'react';
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
import { Photo } from '@/components/Photo';
import { StreakBadge } from '@/components/StreakBadge';
import { SaveToast } from '@/components/SaveToast';
import { PawIcon } from '@/components/icons/PawIcon';
import { useTodayEntry, useMemoryEntry } from '@/hooks/useEntries';
import { useStreak } from '@/hooks/useStreak';
import { useSelectedPet } from '@/hooks/usePets';
import { useAppStore } from '@/store/appStore';
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
  const { savedAt, setSavedAt } = useAppStore();
  const [toastVisible, setToastVisible] = useState(false);

  const displayName = selectedPet?.name ?? 'うちの子';
  const streakCount = streak?.display_streak ?? 0;

  useEffect(() => {
    if (!savedAt) return;
    setToastVisible(true);
    const hideTimer = setTimeout(() => {
      setToastVisible(false);
      setSavedAt(null);
    }, 2500);
    return () => clearTimeout(hideTimer);
  }, [savedAt]);

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── ヘッダー ── */}
        <View style={styles.header}>
          <Text style={styles.headerDate}>{formatHomeDate(today)}</Text>
          <Text style={styles.headerTitle}>今日の1枚</Text>
        </View>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={DS.home.accent} size="large" />
          </View>
        ) : todayEntry ? (
          <RecordedView entry={todayEntry} streak={streakCount} />
        ) : (
          <UnrecordedView petName={displayName} streak={streakCount} />
        )}

      </ScrollView>
      <SaveToast visible={toastVisible} />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────

function RecordedView({ entry, streak }: { entry: EntryWithPets; streak: number }) {
  const tagDisplay = entry.anniversary_tag_type
    ? ANNIVERSARY_TAG_DB_TO_DISPLAY[entry.anniversary_tag_type]
    : null;

  return (
    <>
      {/* ── メインカード ── */}
      <View style={styles.cardOuter}>
        <View style={styles.cardInner}>

          {/* 写真 */}
          <Photo radius={0} style={styles.photo} uri={entry.image_uri} autoAspect minAspectRatio={1 / 1.05} />

          {/* カード下部：情報エリア */}
          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <Text style={styles.infoTitle}>{entry.title}</Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push('/photo-form')}
                activeOpacity={0.75}
              >
                <Ionicons name="create-outline" size={14} color={DS.home.accent} />
                <Text style={styles.editText}>編集</Text>
              </TouchableOpacity>
            </View>

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

        {/* ── ストリークバッジ（写真右上） ── */}
        {streak >= 2 && (
          <View style={styles.streakOverlay}>
            <StreakBadge count={streak} />
          </View>
        )}
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

function UnrecordedView({ petName, streak: _streak }: { petName: string; streak: number }) {
  const { data: memory } = useMemoryEntry();

  return (
    <>
      <View style={styles.cardOuter}>
        <View style={[styles.cardInner, styles.emptyCard]}>
          <LinearGradient
            colors={['#FFF0E4', '#FFE2CA', '#FFCFAD']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.pawCircle}>
            <PawIcon size={34} color={DS.home.accent} />
          </View>
          <Text style={styles.emptyTitle}>{petName}の今日の1枚は？</Text>
          <Text style={styles.emptySub}>毎日の記録が、かけがえない思い出になります</Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/photo-form')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#F59060', DS.home.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <PawIcon size={18} color="#fff" />
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
            <Text style={styles.memBadgeText}>おもいで</Text>
          </View>
        </View>
        <Photo radius={0} style={styles.memPhoto} uri={entry.thumbnail_uri || entry.image_uri} />
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
  scroll: { paddingTop: 10, paddingBottom: 28 },

  // ── ヘッダー ──
  header: {
    paddingHorizontal: 20,
    paddingTop:        8,
    paddingBottom:     4,
  },
  headerDate: {
    fontSize: 12,
    color:    DS.home.textSoft,
  },
  headerTitle: {
    fontWeight:    'bold',
    fontSize:      24,
    color:         DS.home.text,
    marginTop:     4,
    letterSpacing: -0.3,
  },
  petPill: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.pill,
    paddingVertical: 5,
    paddingLeft:     5,
    paddingRight:    9,
    borderWidth:     1,
    borderColor:     DS.colors.border,
    ...DS.shadow.card,
  },
  petPillName: { fontSize: 12, fontWeight: '600', color: DS.colors.text },

  loader: { minHeight: 240, justifyContent: 'center', alignItems: 'center' },

  streakOverlay: {
    position: 'absolute',
    top:      12,
    right:    12,
  },

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
  photo: { width: '100%' },

  // カード本文
  cardBody: {
    marginTop:              -12,
    borderTopLeftRadius:    12,
    borderTopRightRadius:   12,
    backgroundColor:        '#FFFFFF',
    paddingTop:             16,
    paddingHorizontal:      18,
    paddingBottom:          18,
    gap:                    12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           8,
  },
  infoTitle: {
    flex:          1,
    fontWeight:    'bold',
    fontSize:      19,
    color:         DS.home.text,
    lineHeight:    27,
    letterSpacing: -0.3,
  },
  infoMemo: {
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
    height:        30,
    borderRadius:  15,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    paddingLeft:   13,
    paddingRight:  15,
    backgroundColor: '#FDEBD4',
  },
  chipText: {
    fontSize: 12,
    color:    DS.home.text,
  },

  // 今日のペット 参加中
  featuredBtn: {
    height:         36,
    borderRadius:   18,
    borderWidth:    1,
    borderColor:    DS.home.accent,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    marginTop:      2,
    alignSelf:      'center',
    paddingHorizontal: 20,
  },
  featuredText: {
    fontSize: 13,
    color:    DS.home.accent,
  },

  editBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    borderRadius:    DS.radius.pill,
    borderWidth:     1,
    borderColor:     DS.home.accent,
    paddingVertical: 4,
    paddingLeft:     8,
    paddingRight:    10,
    marginTop:       2,
  },
  editText: {
    fontSize: 12,
    color:    DS.home.accent,
  },

  // ── 未記録 ──
  emptyCard: {
    alignItems:        'center',
    gap:               12,
    paddingVertical:   36,
    paddingHorizontal: 24,
    overflow:          'hidden',
  },
  pawCircle: {
    width:           68,
    height:          68,
    borderRadius:    34,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  emptyTitle: {
    fontWeight: 'bold',
    fontSize:   19,
    color:      DS.home.text,
    textAlign:  'center',
    marginTop:  4,
  },
  emptySub: {
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
    overflow:        'hidden',
    borderRadius:    DS.home.radius.pill,
    paddingVertical: 15,
    justifyContent:  'center',
    marginTop:       6,
    shadowColor:     '#C85020',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.22,
    shadowRadius:    12,
    elevation:       6,
  },
  ctaText: { fontWeight: 'bold', color: '#fff', fontSize: 17 },

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
  memHeadTitle: { fontWeight: 'bold', fontSize: 15, color: DS.colors.text },
  memBadge: {
    backgroundColor:   DS.colors.cardCream,
    borderRadius:      DS.radius.pill,
    paddingVertical:   3,
    paddingHorizontal: 10,
    borderWidth:       1,
    borderColor:       DS.colors.border,
  },
  memBadgeText: { fontWeight: '500', fontSize: 12, color: DS.colors.textMid },
  memPhoto:  { width: '100%', height: 200 },
  memFoot: {
    paddingVertical:   14,
    paddingHorizontal: 16,
    alignItems:        'center',
    gap:               4,
  },
  memTitle: { fontWeight: 'bold', fontSize: 19, color: DS.colors.text },
  memDate:  { fontSize: 12, color: DS.colors.textHint },
});
