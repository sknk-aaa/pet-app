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
import { DUMMY_TODAYS_PET, REACTION_LABELS } from '@/dummy';
import { Photo } from '@/components/Photo';

const REACTION_EMOJIS: Record<string, string> = {
  cute:      '🥰',
  beautiful: '✨',
  cool:      '😎',
  like:      '👍',
};

export default function TodayPet() {
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [counts,  setCounts]  = useState({ ...DUMMY_TODAYS_PET.reactions });

  const toggle = (key: string) => {
    setPressed(prev => {
      const next = new Set(prev);
      setCounts(c => {
        if (next.has(key)) {
          next.delete(key);
          return { ...c, [key]: c[key] - 1 };
        } else {
          next.add(key);
          return { ...c, [key]: c[key] + 1 };
        }
      });
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.heading}>今日のペット</Text>
          <TouchableOpacity onPress={() => router.push('/report')} style={styles.iconBtn}>
            <Ionicons name="flag-outline" size={20} color={DS.colors.textHint} />
          </TouchableOpacity>
        </View>

        {/* 日付 */}
        <Text style={styles.date}>2026年5月27日</Text>

        {/* 写真 */}
        <Photo style={styles.photo} />

        {/* ペット情報 */}
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{DUMMY_TODAYS_PET.name}</Text>
          <Text style={styles.petTitle}>{DUMMY_TODAYS_PET.title}</Text>
        </View>

        {/* リアクション */}
        <View style={styles.reactions}>
          {Object.entries(counts).map(([key, count]) => {
            const isPressed = pressed.has(key);
            return (
              <TouchableOpacity
                key={key}
                style={[styles.reactionBtn, isPressed && styles.reactionBtnActive]}
                onPress={() => toggle(key)}
                activeOpacity={0.8}
              >
                <Text style={styles.reactionEmoji}>{REACTION_EMOJIS[key]}</Text>
                <Text style={[styles.reactionLabel, isPressed && styles.reactionLabelActive]}>
                  {REACTION_LABELS[key]}
                </Text>
                <Text style={[styles.reactionCount, isPressed && styles.reactionCountActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 説明 */}
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
  safe: {
    flex:            1,
    backgroundColor: DS.colors.bg,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom:     32,
    gap:               16,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingTop:     12,
  },
  heading: {
    fontSize:   22,
    fontWeight: '700',
    color:      DS.colors.text,
  },
  iconBtn: { padding: 4 },
  date: {
    fontSize:   13,
    color:      DS.colors.textHint,
    marginTop:  -8,
  },
  photo: {
    borderRadius: DS.radius.card,
    aspectRatio:  1,
  },
  petInfo: {
    alignItems: 'center',
    gap:         4,
  },
  petName: {
    fontSize:   22,
    fontWeight: '700',
    color:      DS.colors.text,
  },
  petTitle: {
    fontSize: 15,
    color:    DS.colors.textMid,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
    justifyContent: 'center',
  },
  reactionBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.pill,
    paddingHorizontal: 16,
    paddingVertical:    10,
    borderWidth:        1.5,
    borderColor:        DS.colors.border,
    ...DS.shadow.card,
  },
  reactionBtnActive: {
    backgroundColor: DS.colors.accentPill,
    borderColor:     DS.colors.accent,
  },
  reactionEmoji: { fontSize: 18 },
  reactionLabel: {
    fontSize:   13,
    color:      DS.colors.textMid,
  },
  reactionLabelActive: {
    color:      DS.colors.accent,
    fontWeight: '700',
  },
  reactionCount: {
    fontSize:   13,
    color:      DS.colors.textHint,
    fontWeight: '600',
  },
  reactionCountActive: {
    color: DS.colors.accent,
  },
  infoCard: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             8,
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.md,
    padding:         14,
    ...DS.shadow.card,
  },
  infoText: {
    flex:       1,
    fontSize:   13,
    color:      DS.colors.textMid,
    lineHeight: 20,
  },
});
