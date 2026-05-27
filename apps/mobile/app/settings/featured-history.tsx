import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { DUMMY_FEATURED_HISTORY, REACTION_LABELS } from '@/dummy';
import { Photo } from '@/components/Photo';

export default function FeaturedHistory() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>掲載履歴</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {DUMMY_FEATURED_HISTORY.map(item => (
          <TouchableOpacity key={item.id} style={styles.card} onPress={() => router.push('/day-detail')}>
            <Photo style={styles.photo} />
            <View style={styles.info}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.reactions}>
                {Object.entries(item.reactions).map(([key, count]) => (
                  <View key={key} style={styles.reactionChip}>
                    <Text style={styles.reactionText}>{REACTION_LABELS[key]} {count}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {DUMMY_FEATURED_HISTORY.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⭐</Text>
            <Text style={styles.emptyText}>まだ掲載されていません</Text>
          </View>
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
  nav: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  backBtn: { padding: 4 },
  navTitle: {
    fontSize:   17,
    fontWeight: '600',
    color:      DS.colors.text,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom:     32,
    gap:               12,
    paddingTop:         4,
  },
  card: {
    flexDirection:   'row',
    gap:             14,
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.card,
    padding:         14,
    ...DS.shadow.card,
  },
  photo: {
    width:        88,
    aspectRatio:  1,
    borderRadius: DS.radius.md,
    flexShrink:   0,
  },
  info: {
    flex: 1,
    gap:   8,
  },
  date: {
    fontSize: 12,
    color:    DS.colors.textHint,
  },
  title: {
    fontSize:   15,
    fontWeight: '600',
    color:      DS.colors.text,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            6,
  },
  reactionChip: {
    backgroundColor: DS.colors.accentPill,
    borderRadius:    DS.radius.pill,
    paddingHorizontal: 8,
    paddingVertical:    3,
  },
  reactionText: {
    fontSize:   11,
    color:      DS.colors.accent,
    fontWeight: '600',
  },
  empty: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap:             12,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    fontSize: 15,
    color:    DS.colors.textHint,
  },
});
