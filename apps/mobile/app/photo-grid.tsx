import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { Photo } from '@/components/Photo';
import { useAllEntries } from '@/hooks/useEntries';
import type { CalendarEntryInfo } from '@/types';

const COLS = 3;
const GAP  = 2;

type Section = { yearMonth: string; label: string; entries: CalendarEntryInfo[] };

function groupByMonth(entries: CalendarEntryInfo[]): Section[] {
  const map = new Map<string, CalendarEntryInfo[]>();
  for (const e of entries) {
    const ym = e.date.slice(0, 7);
    if (!map.has(ym)) map.set(ym, []);
    map.get(ym)!.push(e);
  }
  return Array.from(map.entries()).map(([ym, items]) => {
    const [y, m] = ym.split('-').map(Number);
    return { yearMonth: ym, label: `${y}年${m}月`, entries: items };
  });
}

export default function PhotoGrid() {
  const { width }  = useWindowDimensions();
  const cellSize   = (width - GAP * (COLS - 1)) / COLS;
  const { data: entries = [], isLoading } = useAllEntries();

  const sections = useMemo(() => groupByMonth(entries), [entries]);

  type Item = { type: 'header'; label: string } | { type: 'photo'; entry: CalendarEntryInfo };

  const flatItems: Item[] = useMemo(() => {
    const items: Item[] = [];
    for (const s of sections) {
      items.push({ type: 'header', label: s.label });
      for (const e of s.entries) items.push({ type: 'photo', entry: e });
      const remainder = s.entries.length % COLS;
      if (remainder !== 0) {
        for (let i = 0; i < COLS - remainder; i++) {
          items.push({ type: 'photo', entry: { date: '', thumbnail_uri: '', anniversary_tag_type: null, featured_status_cache: null } });
        }
      }
    }
    return items;
  }, [sections]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.accent} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>すべての写真</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={DS.colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={flatItems}
          keyExtractor={(_, i) => String(i)}
          numColumns={COLS}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={[styles.sectionHeader, { width }]}>
                  <Text style={styles.sectionLabel}>{item.label}</Text>
                </View>
              );
            }
            if (!item.entry.date) {
              return <View style={{ width: cellSize, height: cellSize }} />;
            }
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/day-detail', params: { date: item.entry.date } })}
              >
                <Photo
                  style={{ width: cellSize, height: cellSize }}
                  uri={item.entry.thumbnail_uri}
                />
              </TouchableOpacity>
            );
          }}
          getItemLayout={(_, index) => ({ length: cellSize, offset: cellSize * index, index })}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  nav: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   10,
    backgroundColor:   DS.colors.bg,
  },
  backBtn:   { padding: 4 },
  navTitle:  { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  loader:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DS.colors.bg },
  list:      { gap: 0 },
  row:       { gap: GAP },
  sectionHeader: {
    backgroundColor: DS.colors.bg,
    paddingHorizontal: 14,
    paddingVertical:   10,
  },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: DS.colors.text },
});
