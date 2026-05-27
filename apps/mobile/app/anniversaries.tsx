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
import { Photo } from '@/components/Photo';
import { useAnniversaryEntries } from '@/hooks/useEntries';
import { formatDisplayDate } from '@/utils/date';
import { ANNIVERSARY_TAG_DB_TO_DISPLAY } from '@/utils/species';

export default function Anniversaries() {
  const { data: entries = [], isLoading } = useAnniversaryEntries();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>記念日</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={DS.colors.accent} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>記念日の記録はまだありません</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {entries.map(entry => (
            <TouchableOpacity
              key={entry.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/day-detail', params: { date: entry.date } })}
            >
              <Photo style={styles.photo} uri={entry.thumbnail_uri} />
              <View style={styles.info}>
                {entry.anniversary_tag_type && (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagText}>
                      {ANNIVERSARY_TAG_DB_TO_DISPLAY[entry.anniversary_tag_type]}
                    </Text>
                  </View>
                )}
                <Text style={styles.title}>{entry.title}</Text>
                <Text style={styles.date}>{formatDisplayDate(entry.date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={DS.colors.textHint} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  navTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: DS.colors.textMid },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: DS.colors.card, borderRadius: DS.radius.card,
    padding: 14, ...DS.shadow.card,
  },
  photo: { width: 72, aspectRatio: 1, borderRadius: DS.radius.md, flexShrink: 0 },
  info: { flex: 1, gap: 6 },
  tagPill: {
    alignSelf: 'flex-start', backgroundColor: DS.colors.sagePill,
    borderRadius: DS.radius.pill, paddingHorizontal: 10, paddingVertical: 3,
  },
  tagText: { fontSize: 11, color: DS.colors.sage, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '600', color: DS.colors.text },
  date: { fontSize: 12, color: DS.colors.textHint },
});
