import React, { useState, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { Card } from '@/components/Card';
import { Photo } from '@/components/Photo';
import { PetAvatar } from '@/components/PetAvatar';
import { useMonthEntries } from '@/hooks/useEntries';
import { useSelectedPet } from '@/hooks/usePets';
import {
  getTodayJST,
  getMonthStartDay,
  getMonthTotalDays,
  formatMonthLabel,
} from '@/utils/date';
import { SPECIES_DB_TO_DISPLAY } from '@/utils/species';
import type { CalendarEntryInfo } from '@/types';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const CELL_HEIGHT = 52;
const GRID_GAP = 0;
const GRID_LINE = 'rgba(210, 190, 172, 0.45)';
const SCREEN_HORIZONTAL_PADDING = 14;
const GRID_CARD_PADDING = 12;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

export default function Calendar() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const gridWidth = width - SCREEN_HORIZONTAL_PADDING * 2 - GRID_CARD_PADDING * 2;
  const cellWidth = Math.floor(gridWidth / 7);

  const today = getTodayJST();
  const [todayYear, todayMonth] = today.split('-').map(Number);
  const [year, setYear]         = useState(todayYear);
  const [month, setMonth]       = useState(todayMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [draftYear, setDraftYear] = useState(todayYear);
  const [draftMonth, setDraftMonth] = useState(todayMonth);

  const selectedPet = useSelectedPet();
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

  const isCurrentMonth = year === todayYear && month === todayMonth;
  const selectableYears = useMemo(
    () => Array.from({ length: 22 }, (_, index) => todayYear + 1 - index),
    [todayYear],
  );

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
  const openMonthPicker = () => {
    setDraftYear(year);
    setDraftMonth(month);
    setMonthPickerVisible(true);
  };
  const applyMonthPicker = () => {
    setYear(draftYear);
    setMonth(draftMonth);
    setSelectedDate(null);
    setMonthPickerVisible(false);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.petPill} onPress={() => router.push('/pet-select')}>
          <PetAvatar species={displaySpecies} iconUri={selectedPet?.icon_uri} size={22} />
          <Text style={styles.petPillName}>{selectedPet?.name ?? 'うちの子'}</Text>
          <Ionicons name="chevron-down" size={10} color={DS.colors.textHint} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, displaySpecies, selectedPet?.icon_uri, selectedPet?.name]);

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {/* ── 日付行 ── */}
      <View style={styles.dateRow}>
        <View style={styles.dateRowLeft}>
          <TouchableOpacity style={styles.monthBtn} onPress={openMonthPicker} activeOpacity={0.7}>
            <Text style={styles.monthLabel}>{formatMonthLabel(year, month)}</Text>
            <Ionicons name="chevron-down" size={14} color={DS.colors.textMid} />
          </TouchableOpacity>
          {!isCurrentMonth && (
            <TouchableOpacity
              style={styles.todayBtn}
              onPress={() => { setYear(todayYear); setMonth(todayMonth); setSelectedDate(null); }}
            >
              <Text style={styles.todayBtnText}>今日へ</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.gridViewBtn}
          onPress={() => router.push('/photo-grid')}
        >
          <Ionicons name="grid-outline" size={20} color={DS.colors.textMid} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
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
                  <View style={[
                    styles.dayBadge,
                    isSelected && styles.dayBadgeSelected,
                    isToday && !isSelected && styles.dayBadgeToday,
                  ]}>
                    <Text style={[
                      styles.dayNum,
                      { color: isToday ? DS.colors.accent : numColor },
                      isToday && styles.dayNumToday,
                      isSelected && styles.dayNumSelected,
                    ]}>
                      {day}
                    </Text>
                  </View>
                  {hasPic ? (
                    <View style={[
                      styles.thumb,
                      { width: cellWidth, height: CELL_HEIGHT },
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
                    <View style={[styles.thumbEmpty, { width: cellWidth, height: CELL_HEIGHT }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Anniversary link */}
        <TouchableOpacity style={styles.anniCard} onPress={() => router.push('/anniversaries')} activeOpacity={0.75}>
          <View style={styles.anniIconWrap}>
            <Ionicons name="ribbon-outline" size={17} color={DS.colors.accent} />
          </View>
          <Text style={styles.anniLinkText}>記念日を見る</Text>
          <Ionicons name="chevron-forward" size={15} color={DS.colors.textHint} />
        </TouchableOpacity>

        <View style={{ height: 4 }} />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={monthPickerVisible}
        onRequestClose={() => setMonthPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            accessibilityLabel="年月選択を閉じる"
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => setMonthPickerVisible(false)}
          />
          <View style={styles.monthSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>年月を選択</Text>
              <TouchableOpacity onPress={() => setMonthPickerVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={21} color={DS.colors.textMid} />
              </TouchableOpacity>
            </View>
            <Text style={styles.optionLabel}>年</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearOptions}>
              {selectableYears.map(optionYear => (
                <TouchableOpacity
                  key={optionYear}
                  style={[styles.yearOption, optionYear === draftYear && styles.optionSelected]}
                  onPress={() => setDraftYear(optionYear)}
                >
                  <Text style={[styles.optionText, optionYear === draftYear && styles.optionTextSelected]}>
                    {optionYear}年
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.optionLabel}>月</Text>
            <View style={styles.monthOptions}>
              {MONTHS.map(optionMonth => (
                <TouchableOpacity
                  key={optionMonth}
                  style={[styles.monthOption, optionMonth === draftMonth && styles.optionSelected]}
                  onPress={() => setDraftMonth(optionMonth)}
                >
                  <Text style={[styles.optionText, optionMonth === draftMonth && styles.optionTextSelected]}>
                    {optionMonth}月
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.applyButton} onPress={applyMonthPicker}>
              <Text style={styles.applyButtonText}>表示する</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: DS.colors.bg },
  scroll: { paddingHorizontal: 14, paddingBottom: 24, gap: 10 },

  dateRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   10,
  },
  monthBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthLabel: { fontSize: 20, fontWeight: '700', color: DS.colors.text, letterSpacing: -0.4 },
  dateRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  todayBtn: {
    backgroundColor:   DS.colors.accentLight,
    borderRadius:      DS.radius.pill,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  todayBtnText: { fontSize: 13, fontWeight: '600', color: DS.colors.accent },
  gridViewBtn: { padding: 4 },

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

  gridCard: { overflow: 'hidden' },
  weekRow: {
    flexDirection:   'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor:     GRID_LINE,
    marginBottom:    0,
  },
  weekday: {
    fontSize:        11,
    fontWeight:      '600',
    color:           DS.colors.textMid,
    textAlign:       'center',
    paddingVertical: 5,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor:     GRID_LINE,
  },
  weekdaySun: { color: DS.colors.red },
  weekdaySat: { color: DS.colors.sage },
  grid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor:    GRID_LINE,
  },
  cell: {
    alignItems:       'center',
    gap:              1,
    paddingTop:       2,
    paddingBottom:    3,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor:      GRID_LINE,
  },
  dayNum:         { fontSize: 10, lineHeight: 14 },
  dayNumToday:    { fontWeight: '700' },
  dayNumSelected: { color: DS.colors.white, fontWeight: '700' },
  dayBadge: {
    width:          22,
    height:         20,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  dayBadgeSelected: { backgroundColor: DS.colors.accent },
  dayBadgeToday:    { backgroundColor: DS.colors.accentLight },
  thumb:     { borderRadius: 4, overflow: 'hidden' },
  thumbEmpty: {
    borderRadius:    4,
    backgroundColor: DS.colors.cardCream,
  },
  anniBadge:   { position: 'absolute', top: 1, right: 1 },
  pawBadge:    { position: 'absolute', bottom: 1, right: 1 },

  anniCard: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    backgroundColor:   DS.colors.card,
    borderRadius:      DS.radius.card,
    paddingVertical:   13,
    paddingHorizontal: 14,
    ...DS.shadow.card,
  },
  anniIconWrap: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: DS.colors.accentLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  anniLinkText: { flex: 1, fontSize: 14, fontWeight: '600', color: DS.colors.text },

  modalBackdrop: {
    flex:            1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(59,35,20,0.24)',
  },
  monthSheet: {
    backgroundColor:   DS.colors.bg,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop:        16,
    paddingBottom:     32,
    gap:               12,
  },
  sheetHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   2,
  },
  sheetTitle:   { fontSize: 18, fontWeight: '700', color: DS.colors.text },
  closeButton:  { padding: 4 },
  optionLabel:  { fontSize: 12, fontWeight: '600', color: DS.colors.textHint },
  yearOptions:  { gap: 8, paddingBottom: 2 },
  yearOption: {
    paddingVertical:   8,
    paddingHorizontal: 14,
    borderRadius:      DS.radius.pill,
    backgroundColor:   DS.colors.cardCream,
  },
  monthOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthOption: {
    width:          '22%',
    alignItems:     'center',
    paddingVertical: 9,
    borderRadius:   DS.radius.pill,
    backgroundColor: DS.colors.cardCream,
  },
  optionSelected:     { backgroundColor: DS.colors.accent },
  optionText:         { fontSize: 14, fontWeight: '500', color: DS.colors.textMid },
  optionTextSelected: { color: DS.colors.white, fontWeight: '700' },
  applyButton: {
    backgroundColor: DS.colors.accent,
    borderRadius:    DS.radius.pill,
    alignItems:      'center',
    paddingVertical: 13,
    marginTop:       6,
  },
  applyButtonText: { color: DS.colors.white, fontSize: 15, fontWeight: '700' },
});
