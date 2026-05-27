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
import { DUMMY_ANNIVERSARIES } from '@/dummy';
import { Photo } from '@/components/Photo';

export default function Anniversaries() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>記念日</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {DUMMY_ANNIVERSARIES.map(anniv => (
          <TouchableOpacity key={anniv.id} style={styles.card} onPress={() => router.push('/day-detail')}>
            <Photo style={styles.photo} />
            <View style={styles.info}>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{anniv.tag}</Text>
              </View>
              <Text style={styles.title}>{anniv.title}</Text>
              <Text style={styles.date}>{anniv.date}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={DS.colors.textHint} />
          </TouchableOpacity>
        ))}
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
  },
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.card,
    padding:         14,
    ...DS.shadow.card,
  },
  photo: {
    width:        72,
    aspectRatio:  1,
    borderRadius: DS.radius.md,
    flexShrink:   0,
  },
  info: {
    flex: 1,
    gap:   6,
  },
  tagPill: {
    alignSelf:         'flex-start',
    backgroundColor:   DS.colors.sagePill,
    borderRadius:      DS.radius.pill,
    paddingHorizontal: 10,
    paddingVertical:    3,
  },
  tagText: {
    fontSize:   11,
    color:      DS.colors.sage,
    fontWeight: '600',
  },
  title: {
    fontSize:   15,
    fontWeight: '600',
    color:      DS.colors.text,
  },
  date: {
    fontSize: 12,
    color:    DS.colors.textHint,
  },
});
