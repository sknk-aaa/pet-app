import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Photo } from '@/components/Photo';
import { PetAvatar } from '@/components/PetAvatar';
import { useMonthEntries } from '@/hooks/useEntries';
import { useStreak } from '@/hooks/useStreak';
import { useSelectedPet } from '@/hooks/usePets';
import { useAppStore } from '@/store/appStore';
import {
  getTodayJST,
  getMonthStartDay,
  getMonthTotalDays,
  formatMonthLabel,
  formatDisplayDate,
} from '@/utils/date';
import { SPECIES_DB_TO_DISPLAY, ANNIVERSARY_TAG_DB_TO_DISPLAY } from '@/utils/species';
import type { CalendarEntryInfo } from '@/types';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const CELL_HEIGHT = 38;

export default function Calendar() {
  const { width } = useWindowDimensions();
  const cellWidth = Math.floor((width - 32 - 12 * 2) / 7);

  const today = getTodayJST();
  const [todayYear, todayMonth] = today.split('-').map(Number);
  const [year, setYear]         = useState(todayYear);
  const [month, setMonth]       = useState(todayMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedPet = useSelectedPet();
  const { data: streakData } = useStreak();
  const displaySpecies = selectedPet ? SPECIES_DB_TO_DISPLAY[selectedPet.species] : 'ねこ';

  const { data: entries = [] } = useMonthEntries(year, month);

  const entryMap = useMemo(() => {
    const m = new Map<string, CalendarEntryInfo>();
    for (const e of entries) m.set(e.date, e);
    return m;
  }, [entries]);

  const startDay  = getMonthStartDay(year, month);
  const totalDays = getMonthTotalDays(year, month);

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const dateStr = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const photoCount = entries.length;

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  const selectedEntry = selectedDate ? entryMap.get(selectedDate) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>カレンダー</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.petPill} onPress={() => router.push('/pet-select')}>
              <PetAvatar species={displaySpecies} iconUri={selectedPet?.icon_uri} size={26} />
              <Text style={styles.petPillName}>{selectedPet?.name ?? 'うちの子'}</Text>
              <Ionicons name="chevron-down" size={10} color={DS.colors.textHint} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn} onPress={() => router.push('/anniversaries')}>
              <Ionicons name="options-outline" size={16} color={DS.colors.textMid} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month navigation — card style */}
        <View style={[styles.monthNav, DS.shadow.card]}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={18} color={DS.colors.accent} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthLabel(year, month)}</Text>
          <View style={styles.navRight}>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={18} color={DS.colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setYear(todayYear); setMonth(todayMonth); setSelectedDate(null); }}
              style={styles.todayBtn}
            >
              <Text style={styles.todayBtnText}>今日</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats bar — peach background */}
        <View style={styles.statsBar}>
          <View style={styles.statGroup}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text style={styles.statLabel}>連続</Text>
            <Text style={styles.statNumAccent}>{streakData?.display_streak ?? 0}日</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statGroup}>
            <Text style={styles.statLabel}>今月</Text>
            <Text style={styles.statNumSage}>{photoCount}枚</Text>
          </View>
        </View>

        {/* Calendar grid */}
        <Card style={styles.gridCard} p={12}>
          {/* Day headers */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d, i) => (
              <Text
                key={d}
                style={[
                  styles.weekday,
                  { width: cellWidth },
                  i === 0 && styles.weekdaySun,
                  i === 6 && styles.weekdaySat,
                ]}
              >
                {d}
              </Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={idx} style={{ width: cellWidth }} />;
              const col      = idx % 7;
              const ds       = dateStr(day);
              const entry    = entryMap.get(ds);
              const hasPic   = !!entry;
              const isAnni   = !!entry?.anniversary_tag_type;
              const isPetDay = entry?.featured_status_cache === 'featured';
              const isToday  = ds === today;
              const isSelected = ds === selectedDate;
              const numColor = col === 0 ? DS.colors.red : col === 6 ? DS.colors.sage : DS.colors.text;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.cell, { width: cellWidth }]}
                  onPress={() => {
                    setSelectedDate(ds);
                    if (hasPic) router.push({ pathname: '/day-detail', params: { date: ds } });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayNum, { color: isToday ? DS.colors.accent : numColor }, isToday && styles.dayNumToday]}>
                    {day}
                  </Text>
                  {hasPic ? (
                    <View style={[
                      styles.thumb,
                      { width: cellWidth - 4, height: CELL_HEIGHT },
                      isSelected && styles.thumbSelected,
                      isToday && !isSelected && styles.thumbToday,
                    ]}>
                      <Photo style={StyleSheet.absoluteFill} uri={entry.thumbnail_uri} />
                      {isAnni && (
                        <View style={styles.anniBadge}>
                          <Ionicons name="star" size={8} color="#E8C040" />
                        </View>
                      )}
                      {isPetDay && (
                        <View style={styles.pawBadge}>
                          <Ionicons name="paw" size={8} color="rgba(255,255,255,0.9)" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={[styles.thumbEmpty, { width: cellWidth - 4, height: CELL_HEIGHT }]} />
                  )}
                  {isSelected && <View style={styles.selectedDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Anniversary link */}
        <Card p={12}>
          <TouchableOpacity style={styles.anniLinkInner} onPress={() => router.push('/anniversaries')}>
            <Text style={styles.anniEmoji}>🎖</Text>
            <Text style={styles.anniLinkText}>記念日を見る</Text>
            <Ionicons name="chevron-forward" size={16} color={DS.colors.textHint} />
          </TouchableOpacity>
        </Card>

        {/* Selected day preview */}
        {selectedEntry && (
          <Card p={14}>
            <Text style={styles.previewDate}>{formatDisplayDate(selectedDate!)}</Text>
            <TouchableOpacity
              style={styles.previewInner}
              onPress={() => router.push({ pathname: '/day-detail', params: { date: selectedDate! } })}
            >
              <Photo style={styles.previewPhoto} uri={selectedEntry.thumbnail_uri} />
              <View style={styles.previewInfo}>
                {selectedEntry.anniversary_tag_type && (
                  <Chip
                    label={ANNIVERSARY_TAG_DB_TO_DISPLAY[selectedEntry.anniversary_tag_type] ?? selectedEntry.anniversary_tag_type}
                    selected={false}
                    small
                  />
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={DS.colors.textHint} />
            </TouchableOpacity>
          </Card>
        )}

        <View style={{ height: 4 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: DS.colors.bg },
  scroll: { paddingHorizontal: 14, paddingBottom: 24, gap: 10 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, paddingBottom: 4 },
  heading:     { fontSize: 26, fontWeight: '700', color: DS.colors.text, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  petPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   DS.colors.card,
    borderRadius:      DS.radius.pill,
    paddingVertical:   6,
    paddingLeft:       6,
    paddingRight:      12,
    borderWidth:       1,
    borderColor:       DS.colors.border,
    ...DS.shadow.card,
  },
  petPillName: { fontSize: 14, fontWeight: '600', color: DS.colors.text },
  filterBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: DS.colors.card,
    borderWidth:     1,
    borderColor:     DS.colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },

  monthNav: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   DS.colors.card,
    borderRadius:      16,
    paddingVertical:   10,
    paddingHorizontal: 14,
  },
  navBtn:       { paddingVertical: 4, paddingHorizontal: 8 },
  monthText:    { fontSize: 16, fontWeight: '600', color: DS.colors.text },
  navRight:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  todayBtn:     { paddingHorizontal: 8, paddingVertical: 4 },
  todayBtnText: { fontSize: 13, fontWeight: '600', color: DS.colors.accent },

  statsBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    backgroundColor:   DS.colors.peach,
    borderRadius:      14,
    paddingVertical:   9,
    paddingHorizontal: 20,
    ...DS.shadow.card,
  },
  statGroup:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDivider:   { width: 1, height: 20, backgroundColor: DS.colors.border, marginHorizontal: 18 },
  fireEmoji:     { fontSize: 15 },
  statLabel:     { fontSize: 13, color: DS.colors.textMid },
  statNumAccent: { fontSize: 17, fontWeight: '700', color: DS.colors.accent },
  statNumSage:   { fontSize: 17, fontWeight: '700', color: DS.colors.sage },

  gridCard: {},
  weekRow:  { flexDirection: 'row', marginBottom: 4 },
  weekday:  { fontSize: 11, fontWeight: '600', color: DS.colors.textMid, textAlign: 'center', paddingVertical: 4 },
  weekdaySun: { color: DS.colors.red },
  weekdaySat: { color: DS.colors.sage },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell:       { alignItems: 'center', gap: 1 },
  dayNum:     { fontSize: 10, lineHeight: 14 },
  dayNumToday: { fontWeight: '700' },
  thumb: { borderRadius: 8, overflow: 'hidden' },
  thumbSelected: { borderWidth: 2, borderColor: DS.colors.accent },
  thumbToday:    { borderWidth: 1.5, borderColor: DS.colors.accentSoft },
  thumbEmpty: {
    borderRadius:    8,
    backgroundColor: DS.colors.cardCream,
    borderWidth:     1,
    borderColor:     DS.colors.border,
    borderStyle:     'dashed',
  },
  anniBadge:   { position: 'absolute', top: 1, right: 1 },
  pawBadge:    { position: 'absolute', bottom: 1, right: 1 },
  selectedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: DS.colors.accent, marginTop: 1 },

  anniLinkInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  anniEmoji:     { fontSize: 18 },
  anniLinkText:  { flex: 1, fontSize: 14, fontWeight: '600', color: DS.colors.text },

  previewDate:  { fontSize: 12, color: DS.colors.textHint, marginBottom: 10 },
  previewInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  previewPhoto: { width: 72, height: 72, borderRadius: DS.radius.md, flexShrink: 0 },
  previewInfo:  { flex: 1, gap: 6 },
});
