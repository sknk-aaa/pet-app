import React, { useState } from 'react';
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
import { DUMMY_PET, DUMMY_ENTRY, DUMMY_MEMORY, DUMMY_STREAK } from '@/dummy';
import { Card } from '@/components/Card';
import { Photo } from '@/components/Photo';
import { StreakBadge } from '@/components/StreakBadge';
import { Chip } from '@/components/Chip';

export default function Home() {
  const [recorded, setRecorded] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.petPill} onPress={() => router.push('/pet-select')}>
          <Text style={styles.petEmoji}>🐱</Text>
          <Text style={styles.petName}>{DUMMY_PET.name}</Text>
          <Ionicons name="chevron-down" size={14} color={DS.colors.textMid} />
        </TouchableOpacity>
        <StreakBadge streak={DUMMY_STREAK} />
        <TouchableOpacity onPress={() => router.push('/settings/')} style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={22} color={DS.colors.textMid} />
        </TouchableOpacity>
      </View>

      {/* dev toggle */}
      <View style={styles.devToggle}>
        <TouchableOpacity style={styles.devBtn} onPress={() => setRecorded(r => !r)}>
          <Text style={styles.devBtnText}>{recorded ? '記録済みを表示中' : '未記録を表示中'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {recorded ? <RecordedView /> : <UnrecordedView />}
      </ScrollView>
    </SafeAreaView>
  );
}

function RecordedView() {
  return (
    <>
      {/* 今日の記録 */}
      <Card style={styles.entryCard}>
        <View style={styles.entryDateRow}>
          <Text style={styles.entryDate}>2026年5月27日 (水)</Text>
          <TouchableOpacity onPress={() => router.push('/photo-form')}>
            <Ionicons name="create-outline" size={20} color={DS.colors.textHint} />
          </TouchableOpacity>
        </View>
        <Photo style={styles.photo} />
        <Text style={styles.entryTitle}>{DUMMY_ENTRY.title}</Text>
        {DUMMY_ENTRY.memo ? <Text style={styles.entryMemo}>{DUMMY_ENTRY.memo}</Text> : null}
        <View style={styles.entryFooter}>
          {DUMMY_ENTRY.tag && <Chip label={DUMMY_ENTRY.tag} selected={false} small />}
          {DUMMY_ENTRY.featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={11} color={DS.colors.accent} />
              <Text style={styles.featuredText}>今日のペットに参加中</Text>
            </View>
          )}
        </View>
      </Card>

      {/* 思い出カード */}
      <Text style={styles.sectionTitle}>この日の思い出</Text>
      <Card style={styles.memoryCard}>
        <Photo style={styles.memoryPhoto} />
        <View style={styles.memoryInfo}>
          <Text style={styles.memoryDate}>{DUMMY_MEMORY.date}</Text>
          <Text style={styles.memoryTitle}>{DUMMY_MEMORY.title}</Text>
        </View>
      </Card>
    </>
  );
}

function UnrecordedView() {
  return (
    <>
      {/* CTA カード */}
      <Card cream style={styles.ctaCard}>
        <Text style={styles.ctaEmoji}>📷</Text>
        <Text style={styles.ctaTitle}>今日の1枚を残そう</Text>
        <Text style={styles.ctaSub}>{DUMMY_PET.name}の今日を記録しましょう</Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/photo-form')}
        >
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.ctaButtonText}>今日の1枚を残す</Text>
        </TouchableOpacity>
      </Card>

      {/* 思い出カード */}
      <Text style={styles.sectionTitle}>この日の思い出</Text>
      <Card style={styles.memoryCard}>
        <Photo style={styles.memoryPhoto} />
        <View style={styles.memoryInfo}>
          <Text style={styles.memoryDate}>{DUMMY_MEMORY.date}</Text>
          <Text style={styles.memoryTitle}>{DUMMY_MEMORY.title}</Text>
        </View>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: DS.colors.bg,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingVertical:   12,
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
  iconBtn: {
    padding: 4,
  },
  devToggle: {
    alignItems: 'center',
    marginBottom: 4,
  },
  devBtn: {
    backgroundColor: DS.colors.border,
    borderRadius:    DS.radius.pill,
    paddingHorizontal: 16,
    paddingVertical:   6,
  },
  devBtnText: {
    fontSize: 12,
    color:    DS.colors.textMid,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom:     24,
    gap:               16,
  },
  entryCard: { gap: 10 },
  entryDateRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  entryDate: {
    fontSize:   13,
    color:      DS.colors.textHint,
    fontWeight: '500',
  },
  photo: {
    borderRadius: DS.radius.md,
    aspectRatio:  1,
  },
  entryTitle: {
    fontSize:   17,
    fontWeight: '700',
    color:      DS.colors.text,
  },
  entryMemo: {
    fontSize:   14,
    color:      DS.colors.textMid,
    lineHeight: 22,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    flexWrap:      'wrap',
  },
  featuredBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: DS.colors.accentLight,
    borderRadius:    DS.radius.pill,
    paddingHorizontal: 10,
    paddingVertical:    4,
  },
  featuredText: {
    fontSize:   11,
    color:      DS.colors.accent,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize:   14,
    fontWeight: '600',
    color:      DS.colors.textMid,
    marginTop:  4,
  },
  memoryCard: {
    flexDirection: 'row',
    gap:           12,
    alignItems:    'center',
  },
  memoryPhoto: {
    width:        80,
    aspectRatio:  1,
    borderRadius: DS.radius.sm,
    flexShrink:   0,
  },
  memoryInfo: { flex: 1 },
  memoryDate: {
    fontSize:   12,
    color:      DS.colors.textHint,
    marginBottom: 4,
  },
  memoryTitle: {
    fontSize:   15,
    fontWeight: '600',
    color:      DS.colors.text,
  },
  // CTA
  ctaCard: {
    alignItems: 'center',
    gap:        12,
    paddingVertical: 32,
  },
  ctaEmoji: { fontSize: 48 },
  ctaTitle: {
    fontSize:   20,
    fontWeight: '700',
    color:      DS.colors.text,
  },
  ctaSub: {
    fontSize:  14,
    color:     DS.colors.textMid,
    textAlign: 'center',
  },
  ctaButton: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:              8,
    backgroundColor: DS.colors.accent,
    borderRadius:    DS.radius.pill,
    paddingHorizontal: 28,
    paddingVertical:    14,
    marginTop:          8,
    ...DS.shadow.float,
  },
  ctaButtonText: {
    color:      '#fff',
    fontSize:   16,
    fontWeight: '700',
  },
});
