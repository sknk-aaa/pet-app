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
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { DUMMY_PET, SPECIES_OPTIONS, GENDER_OPTIONS } from '@/dummy';

const EMOJI: Record<string, string> = {
  ねこ: '🐱', いぬ: '🐶', インコ: '🦜', うさぎ: '🐰', ハムスター: '🐹', その他: '🐾',
};

export default function PetForm() {
  const [name,     setName]     = useState(DUMMY_PET.name);
  const [species,  setSpecies]  = useState<string>(DUMMY_PET.species);
  const [gender,   setGender]   = useState<string | null>(DUMMY_PET.gender);
  const [birthday, setBirthday] = useState(DUMMY_PET.birthday);

  const canSave = name.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>ペットを編集</Text>
        <TouchableOpacity
          disabled={!canSave}
          onPress={() => router.back()}
        >
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* アイコン選択 */}
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

        <Text style={styles.label}>名前</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="まる"
          placeholderTextColor={DS.colors.textHint}
          maxLength={20}
        />

        <Text style={styles.label}>生年月日</Text>
        <TextInput
          style={styles.input}
          value={birthday}
          onChangeText={setBirthday}
          placeholder="2025-05-03"
          placeholderTextColor={DS.colors.textHint}
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
        />

        <Text style={styles.label}>性別</Text>
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

        {/* 削除 */}
        <TouchableOpacity style={styles.deleteBtn}>
          <Text style={styles.deleteText}>このペットを削除する</Text>
        </TouchableOpacity>
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
  saveText: {
    fontSize:   16,
    fontWeight: '700',
    color:      DS.colors.accent,
  },
  saveTextDisabled: {
    color: DS.colors.textHint,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom:     40,
    gap:               16,
  },
  avatarRow: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            12,
    justifyContent: 'center',
    marginBottom:   8,
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
  avatarEmoji: { fontSize: 32 },
  avatarLabel: {
    fontSize:   11,
    color:      DS.colors.textMid,
    fontWeight: '500',
  },
  avatarLabelActive: { color: DS.colors.accent },
  label: {
    fontSize:     14,
    fontWeight:   '600',
    color:        DS.colors.text,
    marginBottom: -8,
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
  deleteBtn: {
    alignItems:  'center',
    marginTop:   16,
    paddingVertical: 12,
  },
  deleteText: {
    fontSize:   14,
    color:      DS.colors.red,
    fontWeight: '600',
  },
});
