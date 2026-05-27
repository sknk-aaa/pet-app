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
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { Card } from '@/components/Card';
import { Photo } from '@/components/Photo';
import { useFeaturedPetToday } from '@/hooks/useFeaturedPetToday';
import { useToggleReaction } from '@/hooks/useReactions';
import { formatDisplayDate, getTodayJST } from '@/utils/date';
import type { ReactionType } from '@/types';

const REACTIONS: { key: ReactionType; icon: string; label: string }[] = [
  { key: 'cute',      icon: '🐾', label: 'かわいい'   },
  { key: 'beautiful', icon: '✦',  label: 'きれい'     },
  { key: 'cool',      icon: '♛',  label: 'かっこいい'  },
  { key: 'like',      icon: '👍', label: 'いいね'     },
];

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
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={styles.header}>
        <Text style={styles.headerDate}>{formatDisplayDate(today)}</Text>
        <Text style={styles.heading}>今日のペット</Text>
        <Text style={styles.headerSub}>きょう選ばれた、みんなの1枚</Text>
      </View>

      {/* 毎日更新バッジ */}
      <View style={styles.badgeRow}>
        <View style={styles.updateBadge}>
          <Ionicons name="sparkles" size={12} color={DS.colors.accent} />
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

                {/* Total reactions */}
                <View style={styles.reactionCountRow}>
                  <Text style={styles.reactionCountText}>{totalReactions} リアクション</Text>
                  <TouchableOpacity style={styles.moreBtn}
                    onPress={() => router.push({ pathname: '/report', params: { featuredPetId: pet.id } })}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color={DS.colors.textHint} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>

            {/* Info card — peach */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconCircle}>
                <Ionicons name="calendar-outline" size={20} color={DS.colors.accent} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>今日の掲載はこの1枚</Text>
                <Text style={styles.infoSub}>明日も新しい1枚をお届けします</Text>
              </View>
            </View>

            {/* Safety note */}
            <View style={styles.safetyRow}>
              <Ionicons name="shield-checkmark-outline" size={13} color={DS.colors.textHint} />
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
    paddingHorizontal: 20,
    paddingTop:        6,
    paddingBottom:     2,
  },
  headerDate: { fontSize: 12, color: DS.colors.textHint },
  heading:    { fontSize: 26, fontWeight: '700', color: DS.colors.text, letterSpacing: -0.5, marginTop: 4, marginBottom: 2 },
  headerSub:  { fontSize: 13, color: DS.colors.textMid },
  badgeRow:   { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  updateBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   DS.colors.accentLight,
    borderRadius:      DS.radius.pill,
    paddingVertical:   5,
    paddingHorizontal: 14,
    alignSelf:         'flex-start',
  },
  updateBadgeText: { fontSize: 12, fontWeight: '600', color: DS.colors.accent },

  scroll:           { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
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
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   DS.colors.cardCream,
    borderRadius:      DS.radius.pill,
    paddingVertical:   7,
    paddingHorizontal: 14,
    borderWidth:       1.5,
    borderColor:       DS.colors.border,
  },
  reactionBtnActive:   { backgroundColor: DS.colors.accentPill, borderColor: DS.colors.accent },
  reactionIcon:        { fontSize: 13 },
  reactionLabel:       { fontSize: 13, color: DS.colors.textMid },
  reactionLabelActive: { color: DS.colors.accent, fontWeight: '700' },

  reactionCountRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reactionCountText: { fontSize: 14, fontWeight: '600', color: DS.colors.accent },
  moreBtn:           { padding: 4 },

  infoCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    backgroundColor: DS.colors.peach,
    borderRadius:    16,
    padding:         14,
  },
  infoIconCircle: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  infoText:  { flex: 1, gap: 3 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: DS.colors.text },
  infoSub:   { fontSize: 12, color: DS.colors.textMid },

  safetyRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    paddingBottom:  8,
  },
  safetyText: { fontSize: 12, color: DS.colors.textHint },
});
