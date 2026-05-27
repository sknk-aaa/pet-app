import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { DUMMY_PET } from '@/dummy';

const PETS = [
  { id: '1', name: DUMMY_PET.name, species: DUMMY_PET.species, emoji: '🐱' },
  { id: '2', name: 'もも',          species: 'いぬ',               emoji: '🐶' },
];

export default function PetSelect() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* ドラッグハンドル */}
      <View style={styles.handle} />

      <View style={styles.nav}>
        <Text style={styles.navTitle}>ペットを選ぶ</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={DS.colors.textMid} />
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {PETS.map(pet => (
          <TouchableOpacity
            key={pet.id}
            style={[styles.row, pet.id === '1' && styles.rowActive]}
            onPress={() => router.back()}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{pet.emoji}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petSpecies}>{pet.species}</Text>
            </View>
            {pet.id === '1' && (
              <Ionicons name="checkmark-circle" size={22} color={DS.colors.accent} />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addRow} onPress={() => router.push('/settings/pet-form')}>
          <View style={[styles.avatar, styles.addAvatar]}>
            <Ionicons name="add" size={24} color={DS.colors.accent} />
          </View>
          <Text style={styles.addText}>ペットを追加する</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: DS.colors.card,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingBottom:        16,
  },
  handle: {
    width:           40,
    height:           4,
    borderRadius:     2,
    backgroundColor:  DS.colors.border,
    alignSelf:        'center',
    marginTop:         12,
    marginBottom:       8,
  },
  nav: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical:   12,
  },
  navTitle: {
    fontSize:   17,
    fontWeight: '600',
    color:      DS.colors.text,
  },
  list: {
    paddingHorizontal: 20,
    gap:               8,
  },
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    backgroundColor: DS.colors.bg,
    borderRadius:    DS.radius.md,
    padding:         14,
    borderWidth:      1.5,
    borderColor:      DS.colors.border,
  },
  rowActive: {
    borderColor:     DS.colors.accent,
    backgroundColor: DS.colors.accentLight,
  },
  avatar: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: DS.colors.accentPill,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarEmoji: { fontSize: 26 },
  info: { flex: 1 },
  petName: {
    fontSize:   16,
    fontWeight: '600',
    color:      DS.colors.text,
  },
  petSpecies: {
    fontSize: 13,
    color:    DS.colors.textMid,
  },
  addRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    backgroundColor: DS.colors.bg,
    borderRadius:    DS.radius.md,
    padding:         14,
    borderWidth:      1,
    borderStyle:      'dashed',
    borderColor:      DS.colors.accent,
  },
  addAvatar: {
    backgroundColor: DS.colors.accentLight,
  },
  addText: {
    fontSize:   15,
    color:      DS.colors.accent,
    fontWeight: '600',
  },
});
