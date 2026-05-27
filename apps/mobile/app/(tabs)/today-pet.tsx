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
import { REACTION_LABELS } from '@/dummy';
import { Photo } from '@/components/Photo';
import { useFeaturedPetToday } from '@/hooks/useFeaturedPetToday';
import { useToggleReaction } from '@/hooks/useReactions';
import { formatDisplayDate, getTodayJST } from '@/utils/date';
import type { ReactionType } from '@/types';

const REACTION_EMOJIS: Record<ReactionType, string> = {
  cute:      '🥰',
  beautiful: '✨',
  cool:      '😎',
  like:      '👍',
};

const REACTION_KEYS: ReactionType[] = ['cute', 'beautiful', 'cool', 'like'];

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

  const countFor = (key: ReactionType): number => {
    if (!pet) return 0;
    return pet[`${key}_count`];
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.heading}>今日のペット</Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/report', params: { featuredPetId: pet?.id } })}
            style={styles.iconBtn}
          >
            <Ionicons name="flag-outline" size={20} color={DS.colors.textHint} />
          </TouchableOpacity>
        </View>

        <Text style={styles.date}>{formatDisplayDate(today)}</Text>

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
            <Photo style={styles.photo} uri={pet.image_url} />

            <View style={styles.petInfo}>
              <Text style={styles.petName}>{pet.pet_names_display}</Text>
              <Text style={styles.petTitle}>{pet.title}</Text>
            </View>

            <View style={styles.reactions}>
              {REACTION_KEYS.map(key => {
                const isActive = activeReactions.has(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.reactionBtn, isActive && styles.reactionBtnActive]}
                    onPress={() => handleToggle(key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.reactionEmoji}>{REACTION_EMOJIS[key]}</Text>
                    <Text style={[styles.reactionLabel, isActive && styles.reactionLabelActive]}>
                      {REACTION_LABELS[key]}
                    </Text>
                    <Text style={[styles.reactionCount, isActive && styles.reactionCountActive]}>
                      {countFor(key)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={DS.colors.textHint} />
          <Text style={styles.infoText}>
            今日のペットは投票で選ばれた1枚です。リアクションを送って応援しましょう！
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  heading: { fontSize: 22, fontWeight: '700', color: DS.colors.text },
  iconBtn: { padding: 4 },
  date: { fontSize: 13, color: DS.colors.textHint, marginTop: -8 },
  loadingContainer: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { height: 200, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  emptySubtitle: { fontSize: 13, color: DS.colors.textMid },
  photo: { borderRadius: DS.radius.card, aspectRatio: 1 },
  petInfo: { alignItems: 'center', gap: 4 },
  petName: { fontSize: 22, fontWeight: '700', color: DS.colors.text },
  petTitle: { fontSize: 15, color: DS.colors.textMid },
  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  reactionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: DS.colors.card, borderRadius: DS.radius.pill,
    paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1.5, borderColor: DS.colors.border,
    ...DS.shadow.card,
  },
  reactionBtnActive: { backgroundColor: DS.colors.accentPill, borderColor: DS.colors.accent },
  reactionEmoji: { fontSize: 18 },
  reactionLabel: { fontSize: 13, color: DS.colors.textMid },
  reactionLabelActive: { color: DS.colors.accent, fontWeight: '700' },
  reactionCount: { fontSize: 13, color: DS.colors.textHint, fontWeight: '600' },
  reactionCountActive: { color: DS.colors.accent },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: DS.colors.card, borderRadius: DS.radius.md, padding: 14, ...DS.shadow.card,
  },
  infoText: { flex: 1, fontSize: 13, color: DS.colors.textMid, lineHeight: 20 },
});
