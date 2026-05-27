import React, { useState } from 'react';
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
import { DUMMY_CALENDAR, DUMMY_PET } from '@/dummy';
import { Photo } from '@/components/Photo';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function Calendar() {
  const { width } = useWindowDimensions();
  const CELL = (width - 32) / 7;
  const [selected, setSelected] = useState<number | null>(DUMMY_CALENDAR.today);

  const cells: (number | null)[] = [
    ...Array(DUMMY_CALENDAR.startDay).fill(null),
    ...Array.from({ length: DUMMY_CALENDAR.totalDays }, (_, i) => i + 1),
  ];
  // pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  const photoCount  = DUMMY_CALENDAR.photoDays.size;
  const totalDays   = DUMMY_CALENDAR.today;
  const recordRate  = Math.round((photoCount / totalDays) * 100);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.petPill} onPress={() => router.push('/pet-select')}>
            <Text style={styles.petEmoji}>🐱</Text>
            <Text style={styles.petName}>{DUMMY_PET.name}</Text>
            <Ionicons name="chevron-down" size={14} color={DS.colors.textMid} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="options-outline" size={22} color={DS.colors.textMid} />
          </TouchableOpacity>
        </View>

        {/* 月表示 */}
        <View style={styles.monthRow}>
          <TouchableOpacity><Ionicons name="chevron-back" size={22} color={DS.colors.textMid} /></TouchableOpacity>
          <Text style={styles.monthText}>2026年5月</Text>
          <TouchableOpacity><Ionicons name="chevron-forward" size={22} color={DS.colors.textMid} /></TouchableOpacity>
        </View>

        {/* 曜日ヘッダー */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map(d => (
            <Text key={d} style={[styles.weekday, { width: CELL }]}>{d}</Text>
          ))}
        </View>

        {/* 日付グリッド */}
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) return <View key={i} style={{ width: CELL, height: CELL }} />;
            const hasPhoto    = DUMMY_CALENDAR.photoDays.has(day);
            const isAnniv     = DUMMY_CALENDAR.anniversaryDays.has(day);
            const isFeatured  = DUMMY_CALENDAR.featuredDays.has(day);
            const isToday     = day === DUMMY_CALENDAR.today;
            const isSelected  = day === selected;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.cell, { width: CELL, height: CELL }]}
                onPress={() => {
                  setSelected(day);
                  if (hasPhoto) router.push('/day-detail');
                }}
              >
                {hasPhoto ? (
                  <Photo
                    style={[
                      styles.cellPhoto,
                      { width: CELL - 4, height: CELL - 4 },
                      isSelected && styles.cellSelected,
                    ]}
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

        {/* 統計バー */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{photoCount}</Text>
            <Text style={styles.statLabel}>記録</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{DUMMY_CALENDAR.anniversaryDays.size}</Text>
            <Text style={styles.statLabel}>記念日</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{recordRate}%</Text>
            <Text style={styles.statLabel}>記録率</Text>
          </View>
        </View>

        {/* 記念日を見る */}
        <TouchableOpacity style={styles.anniversaryBtn} onPress={() => router.push('/anniversaries')}>
          <Ionicons name="gift-outline" size={16} color={DS.colors.accent} />
          <Text style={styles.anniversaryBtnText}>記念日を見る</Text>
          <Ionicons name="chevron-forward" size={16} color={DS.colors.accent} />
        </TouchableOpacity>

        {/* 選択日プレビュー */}
        {selected && DUMMY_CALENDAR.photoDays.has(selected) && (
          <TouchableOpacity style={styles.preview} onPress={() => router.push('/day-detail')}>
            <Photo style={styles.previewPhoto} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewDate}>2026年5月{selected}日</Text>
              <Text style={styles.previewTitle}>今日はいい顔してる</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={DS.colors.textHint} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: DS.colors.bg,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom:     24,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 12,
    gap:            8,
  },
  petPill: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.pill,
    paddingHorizontal: 12,
    paddingVertical:    6,
    gap:             6,
    flex:            1,
    ...DS.shadow.card,
  },
  petEmoji: { fontSize: 18 },
  petName: {
    fontSize:   15,
    fontWeight: '600',
    color:      DS.colors.text,
    flex:       1,
  },
  iconBtn: { padding: 4 },
  monthRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   12,
  },
  monthText: {
    fontSize:   18,
    fontWeight: '700',
    color:      DS.colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom:  4,
  },
  weekday: {
    fontSize:  11,
    color:     DS.colors.textHint,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
  },
  cell: {
    alignItems:     'center',
    justifyContent: 'center',
    padding:         2,
  },
  cellPhoto: {
    borderRadius: 6,
    position:     'absolute',
  },
  cellSelected: {
    borderWidth:  2,
    borderColor:  DS.colors.accent,
  },
  cellEmpty: {
    borderRadius:    6,
    backgroundColor: DS.colors.border,
    opacity:         0.4,
    position:        'absolute',
  },
  dayNum: {
    fontSize:   10,
    color:      DS.colors.white,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  dayNumToday: {
    color: DS.colors.accent,
  },
  dot: {
    width:        5,
    height:       5,
    borderRadius: 3,
    position:     'absolute',
    bottom:       3,
    zIndex:       2,
  },
  statsBar: {
    flexDirection:   'row',
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.md,
    marginVertical:  16,
    paddingVertical: 14,
    ...DS.shadow.card,
  },
  statItem: {
    flex:       1,
    alignItems: 'center',
    gap:        2,
  },
  statNum: {
    fontSize:   20,
    fontWeight: '700',
    color:      DS.colors.accent,
  },
  statLabel: {
    fontSize: 12,
    color:    DS.colors.textHint,
  },
  statDivider: {
    width:           0.5,
    backgroundColor: DS.colors.border,
  },
  anniversaryBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             6,
    backgroundColor: DS.colors.accentLight,
    borderRadius:    DS.radius.pill,
    paddingVertical: 12,
    marginBottom:    16,
  },
  anniversaryBtnText: {
    fontSize:   14,
    color:      DS.colors.accent,
    fontWeight: '600',
  },
  preview: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.card,
    padding:         14,
    ...DS.shadow.card,
  },
  previewPhoto: {
    width:        64,
    aspectRatio:  1,
    borderRadius: DS.radius.sm,
    flexShrink:   0,
  },
  previewInfo: { flex: 1 },
  previewDate: {
    fontSize:   12,
    color:      DS.colors.textHint,
    marginBottom: 4,
  },
  previewTitle: {
    fontSize:   15,
    fontWeight: '600',
    color:      DS.colors.text,
  },
});
