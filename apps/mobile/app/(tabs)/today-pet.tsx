import React, { useState } from 'react';
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
import Svg, { Path, Ellipse, Circle, Line, Rect } from 'react-native-svg';
import { DS } from '@/theme';
import { Card } from '@/components/Card';
import { Photo } from '@/components/Photo';
import { useFeaturedPetToday } from '@/hooks/useFeaturedPetToday';
import { useToggleReaction } from '@/hooks/useReactions';
import { formatDisplayDate, getTodayJST } from '@/utils/date';
import type { ReactionType } from '@/types';

const REACTIONS: { key: ReactionType; icon: string; label: string }[] = [
  { key: 'cute',      icon: '🐾', label: 'かわいい'  },
  { key: 'beautiful', icon: '✦',  label: 'きれい'    },
  { key: 'cool',      icon: '♛',  label: 'かっこいい' },
  { key: 'like',      icon: '👍', label: 'いいね'    },
];

function SparkIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill={DS.colors.accent}>
      <Path d="M12 2l1.9 5.8H20l-5 3.6 1.9 5.8L12 13.6l-4.9 3.6 1.9-5.8-5-3.6h6.1z" />
    </Svg>
  );
}

function CalIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={DS.colors.accent} strokeWidth={1.7} strokeLinecap="round">
      <Rect x={3} y={4} width={18} height={17} rx={3} />
      <Line x1={16} y1={2} x2={16} y2={6} />
      <Line x1={8} y1={2} x2={8} y2={6} />
      <Line x1={3} y1={10} x2={21} y2={10} />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={DS.colors.textHint} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

function InfoIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={DS.colors.textMid} strokeWidth={1.8} strokeLinecap="round">
      <Circle cx={12} cy={12} r={10} />
      <Line x1={12} y1={8} x2={12} y2={12} />
      <Line x1={12} y1={16} x2={12.01} y2={16} />
    </Svg>
  );
}

export default function TodayPet() {
  const { data: pet, isLoading } = useFeaturedPetToday();
  const [activeReactions, setActiveReactions] = useState<Set<ReactionType>>(new Set());
  const toggleMutation = useToggleReaction(pet?.id ?? '');
  const today = getTodayJST();

  const handleToggle = (reactionType: ReactionType) => {
    if (!pet) return;
    const currentlyActive = activeReactions.has(reactionType);
    setActiveReactions(prev => {
      const next = new Set(prev);
      if (currentlyActive) next.delete(reactionType);
      else next.add(reactionType);
      return next;
    });
    toggleMutation.mutate({ reactionType, currentlyActive });
  };

  const totalReactions = pet
    ? REACTIONS.reduce((sum, r) => sum + (pet[`${r.key}_count`] ?? 0), 0)
    : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerDate}>{formatDisplayDate(today)}</Text>
          <Text style={styles.heading}>今日のペット</Text>
          <Text style={styles.headerSub}>きょう選ばれた、みんなの1枚</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/report', params: { featuredPetId: pet?.id } })}
          style={styles.iconBtn}
        >
          <InfoIcon />
        </TouchableOpacity>
      </View>

      {/* 毎日更新バッジ */}
      <View style={styles.badgeRow}>
        <View style={styles.updateBadge}>
          <SparkIcon />
          <Text style={styles.updateBadgeText}>毎日更新</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DS.colors.accent} />
          </View>
        ) : !pet ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={styles.emptyTitle}>今日のペットは準備中です</Text>
            <Text style={styles.emptySubtitle}>しばらくお待ちください</Text>
          </View>
        ) : (
          <>
            {/* Main photo card */}
            <Card style={styles.photoCard} p={0}>
              <Photo style={styles.photo} uri={pet.image_url} />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.pet_names_display}</Text>
                <Text style={styles.petTitle}>{pet.title}</Text>

                {/* Reaction buttons */}
                <View style={styles.reactions}>
                  {REACTIONS.map(rx => {
                    const isActive = activeReactions.has(rx.key);
                    return (
                      <TouchableOpacity
                        key={rx.key}
                        style={[styles.reactionBtn, isActive && styles.reactionBtnActive]}
                        onPress={() => handleToggle(rx.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reactionIcon}>{rx.icon}</Text>
                        <Text style={[styles.reactionLabel, isActive && styles.reactionLabelActive]}>
                          {rx.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Total reactions + menu */}
                <View style={styles.reactionCountRow}>
                  <Text style={styles.reactionCountText}>{totalReactions} リアクション</Text>
                  <TouchableOpacity style={styles.moreBtn}>
                    <Text style={styles.moreBtnDots}>···</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>

            {/* Info card — peach */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconCircle}>
                <CalIcon />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>今日の掲載はこの1枚</Text>
                <Text style={styles.infoSub}>明日も新しい1枚をお届けします</Text>
              </View>
            </View>

            {/* Safety note */}
            <View style={styles.safetyRow}>
              <ShieldIcon />
              <Text style={styles.safetyText}>掲載写真は事前に確認しています</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: DS.colors.bg },
  header: {
    flexDirection:    'row',
    alignItems:       'flex-start',
    justifyContent:   'space-between',
    paddingHorizontal: 20,
    paddingTop:        6,
    paddingBottom:     2,
  },
  headerLeft: { flex: 1 },
  headerDate: { fontSize: 12, color: DS.colors.textHint },
  heading:    { fontSize: 26, fontWeight: '700', color: DS.colors.text, letterSpacing: -0.5, marginTop: 4, marginBottom: 2 },
  headerSub:  { fontSize: 13, color: DS.colors.textMid },
  iconBtn:    { padding: 4, marginTop: 6 },
  badgeRow:   { paddingHorizontal: 20, paddingVertical: 8 },
  updateBadge: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              6,
    backgroundColor:  DS.colors.accentLight,
    borderRadius:     DS.radius.pill,
    paddingVertical:  5,
    paddingHorizontal: 14,
    alignSelf:        'flex-start',
  },
  updateBadgeText: { fontSize: 12, fontWeight: '600', color: DS.colors.accent },

  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  loadingContainer: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyContainer:   { height: 200, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyEmoji:       { fontSize: 48 },
  emptyTitle:       { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  emptySubtitle:    { fontSize: 13, color: DS.colors.textMid },

  photoCard: { overflow: 'hidden' },
  photo:     { width: '100%', height: 260, borderRadius: 0 },
  petInfo:   { padding: 14, paddingBottom: 16, gap: 10 },
  petName:   { fontSize: 20, fontWeight: '700', color: DS.colors.text },
  petTitle:  { fontSize: 14, color: DS.colors.textMid },

  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reactionBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              5,
    backgroundColor:  DS.colors.cardCream,
    borderRadius:     DS.radius.pill,
    paddingVertical:  7,
    paddingHorizontal: 14,
    borderWidth:      1.5,
    borderColor:      DS.colors.border,
  },
  reactionBtnActive: {
    backgroundColor: DS.colors.accentPill,
    borderColor:     DS.colors.accent,
  },
  reactionIcon:       { fontSize: 13 },
  reactionLabel:      { fontSize: 13, color: DS.colors.textMid },
  reactionLabelActive: { color: DS.colors.accent, fontWeight: '700' },

  reactionCountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reactionCountText: { fontSize: 14, fontWeight: '600', color: DS.colors.accent },
  moreBtn:   { padding: 4 },
  moreBtnDots: { fontSize: 18, color: DS.colors.textHint, letterSpacing: 1 },

  infoCard: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              14,
    backgroundColor:  DS.colors.peach,
    borderRadius:     16,
    padding:          14,
  },
  infoIconCircle: {
    width:            40,
    height:           40,
    borderRadius:     20,
    backgroundColor:  'rgba(255,255,255,0.6)',
    alignItems:       'center',
    justifyContent:   'center',
    flexShrink:       0,
  },
  infoText:  { flex: 1, gap: 3 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: DS.colors.text },
  infoSub:   { fontSize: 12, color: DS.colors.textMid },

  safetyRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    paddingVertical: 2,
    paddingBottom:  8,
  },
  safetyText: { fontSize: 12, color: DS.colors.textHint },
});
