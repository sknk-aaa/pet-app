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
import { Photo } from '@/components/Photo';
import { PetAvatar } from '@/components/PetAvatar';
import { useMonthEntries } from '@/hooks/useEntries';
import { useSelectedPet } from '@/hooks/usePets';
import { useAppStore } from '@/store/appStore';
import {
  getTodayJST,
  getMonthStartDay,
  getMonthTotalDays,
  formatMonthLabel,
  formatDisplayDate,
} from '@/utils/date';
import { SPECIES_DB_TO_DISPLAY } from '@/utils/species';
import type { CalendarEntryInfo } from '@/types';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function Calendar() {
  const { width } = useWindowDimensions();
  const CELL = (width - 32) / 7;

  const today = getTodayJST();
  const [todayYear, todayMonth] = today.split('-').map(Number);
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedPet = useSelectedPet();
  const petFilter = useAppStore(state => state.petFilter);
  const displaySpecies = selectedPet ? SPECIES_DB_TO_DISPLAY[selectedPet.species] : 'ねこ';

  const { data: entries = [] } = useMonthEntries(year, month);

  const entryMap = useMemo(() => {
    const m = new Map<string, CalendarEntryInfo>();
    for (const e of entries) m.set(e.date, e);
    return m;
  }, [entries]);

  const startDay = getMonthStartDay(year, month);
  const totalDays = getMonthTotalDays(year, month);

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const dateStr = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const photoCount = entries.length;
  const todayDay = (year === todayYear && month === todayMonth) ? Number(today.split('-')[2]) : 0;
  const totalDaysElapsed = todayDay || totalDays;
  const recordRate = totalDaysElapsed > 0 ? Math.round((photoCount / totalDaysElapsed) * 100) : 0;
  const anniversaryCount = entries.filter(e => e.anniversary_tag_type).length;

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
        <View style={styles.header}>
          <TouchableOpacity style={styles.petPill} onPress={() => router.push('/pet-select')}>
            <PetAvatar species={displaySpecies} iconUri={selectedPet?.icon_uri} size={24} />
            <Text style={styles.petName}>{selectedPet?.name ?? 'うちの子'}</Text>
            <Ionicons name="chevron-down" size={14} color={DS.colors.textMid} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/anniversaries')}>
            <Ionicons name="options-outline" size={22} color={DS.colors.textMid} />
          </TouchableOpacity>
        </View>

        <View style={styles.monthRow}>
          <TouchableOpacity onPress={prevMonth}>
            <Ionicons name="chevron-back" size={22} color={DS.colors.textMid} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthLabel(year, month)}</Text>
          <TouchableOpacity onPress={nextMonth}>
            <Ionicons name="chevron-forward" size={22} color={DS.colors.textMid} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map(d => (
            <Text key={d} style={[styles.weekday, { width: CELL }]}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) return <View key={i} style={{ width: CELL, height: CELL }} />;
            const ds = dateStr(day);
            const entry = entryMap.get(ds);
            const hasPhoto = !!entry;
            const isAnniv = !!entry?.anniversary_tag_type;
            const isFeatured = entry?.featured_status_cache === 'featured' || entry?.featured_status_cache === 'scheduled';
            const isToday = ds === today;
            const isSelected = ds === selectedDate;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.cell, { width: CELL, height: CELL }]}
                onPress={() => {
                  setSelectedDate(ds);
                  if (hasPhoto) router.push({ pathname: '/day-detail', params: { date: ds } });
                }}
              >
                {hasPhoto ? (
                  <Photo
                    style={[
                      styles.cellPhoto,
                      { width: CELL - 4, height: CELL - 4 },
                      isSelected ? styles.cellSelected : undefined,
                    ]}
                    uri={entry.thumbnail_uri}
                  />
                ) : (
                  <View style={[styles.cellEmpty, { width: CELL - 4, height: CELL - 4 }]} />
                )}
                <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{day}</Text>
                {isAnniv    && <View style={[styles.dot, { backgroundColor: DS.colors.sage }]} />}
                {isFeatured && <View style={[styles.dot, { backgroundColor: DS.colors.accent }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{photoCount}</Text>
            <Text style={styles.statLabel}>記録</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{anniversaryCount}</Text>
            <Text style={styles.statLabel}>記念日</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{recordRate}%</Text>
            <Text style={styles.statLabel}>記録率</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.anniversaryBtn} onPress={() => router.push('/anniversaries')}>
          <Ionicons name="gift-outline" size={16} color={DS.colors.accent} />
          <Text style={styles.anniversaryBtnText}>記念日を見る</Text>
          <Ionicons name="chevron-forward" size={16} color={DS.colors.accent} />
        </TouchableOpacity>

        {selectedEntry && (
          <TouchableOpacity
            style={styles.preview}
            onPress={() => router.push({ pathname: '/day-detail', params: { date: selectedDate! } })}
          >
            <Photo style={styles.previewPhoto} uri={selectedEntry.thumbnail_uri} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewDate}>{formatDisplayDate(selectedDate!)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={DS.colors.textHint} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  petPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: DS.colors.card,
    borderRadius: DS.radius.pill, paddingHorizontal: 12, paddingVertical: 6,
    gap: 6, flex: 1, ...DS.shadow.card,
  },
  petName: { fontSize: 15, fontWeight: '600', color: DS.colors.text, flex: 1 },
  iconBtn: { padding: 4 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthText: { fontSize: 18, fontWeight: '700', color: DS.colors.text },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { fontSize: 11, color: DS.colors.textHint, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellPhoto: { borderRadius: 6, position: 'absolute' },
  cellSelected: { borderWidth: 2, borderColor: DS.colors.accent },
  cellEmpty: { borderRadius: 6, backgroundColor: DS.colors.border, opacity: 0.4, position: 'absolute' },
  dayNum: {
    fontSize: 10, color: DS.colors.white, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2, zIndex: 1,
  },
  dayNumToday: { color: DS.colors.accent },
  dot: { width: 5, height: 5, borderRadius: 3, position: 'absolute', bottom: 3, zIndex: 2 },
  statsBar: {
    flexDirection: 'row', backgroundColor: DS.colors.card, borderRadius: DS.radius.md,
    marginVertical: 16, paddingVertical: 14, ...DS.shadow.card,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 20, fontWeight: '700', color: DS.colors.accent },
  statLabel: { fontSize: 12, color: DS.colors.textHint },
  statDivider: { width: 0.5, backgroundColor: DS.colors.border },
  anniversaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: DS.colors.accentLight, borderRadius: DS.radius.pill,
    paddingVertical: 12, marginBottom: 16,
  },
  anniversaryBtnText: { fontSize: 14, color: DS.colors.accent, fontWeight: '600' },
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: DS.colors.card, borderRadius: DS.radius.card, padding: 14, ...DS.shadow.card,
  },
  previewPhoto: { width: 64, aspectRatio: 1, borderRadius: DS.radius.sm, flexShrink: 0 },
  previewInfo: { flex: 1 },
  previewDate: { fontSize: 12, color: DS.colors.textHint, marginBottom: 4 },
  previewTitle: { fontSize: 15, fontWeight: '600', color: DS.colors.text },
});
