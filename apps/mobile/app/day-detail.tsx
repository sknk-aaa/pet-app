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
import { DUMMY_ENTRY, DUMMY_PET } from '@/dummy';
import { Photo } from '@/components/Photo';
import { Chip } from '@/components/Chip';

export default function DayDetail() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ナビゲーションバー */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>2026年5月27日</Text>
        <TouchableOpacity onPress={() => router.push('/photo-form')} style={styles.editBtn}>
          <Ionicons name="create-outline" size={22} color={DS.colors.textMid} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 写真 */}
        <Photo style={styles.photo} />

        {/* タイトル・メモ */}
        <View style={styles.card}>
          <Text style={styles.petName}>{DUMMY_PET.name}</Text>
          <Text style={styles.entryTitle}>{DUMMY_ENTRY.title}</Text>
          {DUMMY_ENTRY.memo ? (
            <Text style={styles.entryMemo}>{DUMMY_ENTRY.memo}</Text>
          ) : null}
          <View style={styles.tagRow}>
            {DUMMY_ENTRY.tag && <Chip label={DUMMY_ENTRY.tag} selected={false} small />}
          </View>
        </View>

        {/* 今日のペット情報 */}
        {DUMMY_ENTRY.featured && (
          <View style={styles.featuredCard}>
            <Ionicons name="star" size={18} color={DS.colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.featuredTitle}>今日のペットに参加中</Text>
              <Text style={styles.featuredSub}>
                {DUMMY_ENTRY.featuredStatus === 'pending'
                  ? '審査中です'
                  : '掲載されています'}
              </Text>
            </View>
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
  editBtn: { padding: 4 },
  navTitle: {
    fontSize:   17,
    fontWeight: '600',
    color:      DS.colors.text,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom:     32,
    gap:               16,
  },
  photo: {
    borderRadius: DS.radius.card,
    aspectRatio:  1,
  },
  card: {
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.card,
    padding:         20,
    gap:             10,
    ...DS.shadow.card,
  },
  petName: {
    fontSize:   13,
    color:      DS.colors.textHint,
    fontWeight: '500',
  },
  entryTitle: {
    fontSize:   20,
    fontWeight: '700',
    color:      DS.colors.text,
  },
  entryMemo: {
    fontSize:   15,
    color:      DS.colors.textMid,
    lineHeight: 24,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            8,
  },
  featuredCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    backgroundColor: DS.colors.accentLight,
    borderRadius:    DS.radius.md,
    padding:         16,
    borderWidth:      1,
    borderColor:      DS.colors.accent,
  },
  featuredTitle: {
    fontSize:   15,
    fontWeight: '600',
    color:      DS.colors.accent,
  },
  featuredSub: {
    fontSize:   13,
    color:      DS.colors.accentSoft,
    marginTop:   2,
  },
});
