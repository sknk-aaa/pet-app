import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { DS } from '@/theme';
import { SPECIES_OPTIONS, GENDER_OPTIONS } from '@/dummy';

const EMOJI: Record<string, string> = {
  ねこ: '🐱', いぬ: '🐶', インコ: '🦜', うさぎ: '🐰', ハムスター: '🐹', その他: '🐾',
};

export default function PetSetup() {
  const [name,    setName]    = useState('');
  const [species, setSpecies] = useState<string | null>(null);
  const [gender,  setGender]  = useState<string | null>(null);
  const [birthday, setBirthday] = useState('');

  const canProceed = name.trim().length > 0 && species !== null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>うちの子を登録しよう</Text>
        <Text style={styles.sub}>後から変更できます</Text>

        {/* アイコン */}
        <View style={styles.avatarRow}>
          {SPECIES_OPTIONS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.avatarCell, species === s && styles.avatarCellActive]}
              onPress={() => setSpecies(s)}
            >
              <Text style={styles.avatarEmoji}>{EMOJI[s]}</Text>
              <Text style={[styles.avatarLabel, species === s && styles.avatarLabelActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 名前 */}
        <Text style={styles.label}>名前</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="まる"
          placeholderTextColor={DS.colors.textHint}
          maxLength={20}
        />

        {/* 生年月日 */}
        <Text style={styles.label}>生年月日（任意）</Text>
        <TextInput
          style={styles.input}
          value={birthday}
          onChangeText={setBirthday}
          placeholder="2025-05-03"
          placeholderTextColor={DS.colors.textHint}
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
        />

        {/* 性別 */}
        <Text style={styles.label}>性別（任意）</Text>
        <View style={styles.pillRow}>
          {GENDER_OPTIONS.map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.pill, gender === g && styles.pillActive]}
              onPress={() => setGender(g === gender ? null : g)}
            >
              <Text style={[styles.pillText, gender === g && styles.pillTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !canProceed && styles.buttonDisabled]}
          onPress={() => canProceed && router.replace('/(tabs)')}
          disabled={!canProceed}
        >
          <Text style={styles.buttonText}>はじめる</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: DS.colors.bg,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop:        40,
    paddingBottom:     24,
  },
  heading: {
    fontSize:   26,
    fontWeight: '700',
    color:      DS.colors.text,
    textAlign:  'center',
  },
  sub: {
    fontSize:   14,
    color:      DS.colors.textHint,
    textAlign:  'center',
    marginTop:  6,
    marginBottom: 32,
  },
  avatarRow: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            12,
    justifyContent: 'center',
    marginBottom:   32,
  },
  avatarCell: {
    alignItems:     'center',
    width:           80,
    paddingVertical: 12,
    borderRadius:    DS.radius.md,
    borderWidth:     1.5,
    borderColor:     DS.colors.border,
    backgroundColor: DS.colors.card,
    gap:             4,
  },
  avatarCellActive: {
    borderColor:     DS.colors.accent,
    backgroundColor: DS.colors.accentLight,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  avatarLabel: {
    fontSize:   11,
    color:      DS.colors.textMid,
    fontWeight: '500',
  },
  avatarLabelActive: {
    color: DS.colors.accent,
  },
  label: {
    fontSize:     14,
    fontWeight:   '600',
    color:        DS.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.md,
    borderWidth:     1,
    borderColor:     DS.colors.border,
    paddingHorizontal: 16,
    paddingVertical:   14,
    fontSize:          16,
    color:             DS.colors.text,
    marginBottom:      24,
  },
  pillRow: {
    flexDirection: 'row',
    gap:           10,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical:    10,
    borderRadius:       DS.radius.pill,
    borderWidth:        1.5,
    borderColor:        DS.colors.border,
    backgroundColor:    DS.colors.card,
  },
  pillActive: {
    borderColor:     DS.colors.accent,
    backgroundColor: DS.colors.accentPill,
  },
  pillText: {
    fontSize:   14,
    color:      DS.colors.textMid,
    fontWeight: '500',
  },
  pillTextActive: {
    color:      DS.colors.accent,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom:     24,
  },
  button: {
    backgroundColor: DS.colors.accent,
    borderRadius:    DS.radius.pill,
    paddingVertical: 16,
    alignItems:      'center',
    ...DS.shadow.float,
  },
  buttonDisabled: {
    backgroundColor: DS.colors.accentPill,
    shadowOpacity:   0,
    elevation:       0,
  },
  buttonText: {
    color:      '#fff',
    fontSize:   17,
    fontWeight: '700',
  },
});
