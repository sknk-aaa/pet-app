import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPetById, createPet, updatePet, deletePet } from '@/db/pets';
import { setSetting } from '@/db/settings';
import { pickPhoto, processIcon } from '@/services/photo';
import { useAppStore } from '@/store/appStore';
import {
  GENDER_DB_TO_DISPLAY,
  GENDER_DISPLAY_TO_DB,
} from '@/utils/species';
import { DS } from '@/theme';
import { GENDER_OPTIONS } from '@/dummy';
import type { PetGender } from '@/types';

export default function PetForm() {
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const isNew = !petId;

  const [name,     setName]     = useState('');
  const [gender,   setGender]   = useState<string | null>(null);
  const [birthday, setBirthday] = useState('');
  const [iconUri,  setIconUri]  = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);

  const canSave = name.trim().length > 0;

  useEffect(() => {
    if (!petId) return;
    getPetById(petId).then(pet => {
      if (!pet) return;
      setName(pet.name);
      setGender(pet.gender ? GENDER_DB_TO_DISPLAY[pet.gender] ?? null : null);
      setBirthday(pet.birthday ?? '');
      setIconUri(pet.icon_uri);
    });
  }, [petId]);

  const handlePickIcon = async () => {
    const uri = await pickPhoto();
    if (!uri) return;
    const id = petId ?? 'tmp';
    const processed = await processIcon(uri, id);
    setIconUri(processed);
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const genderDb = gender ? (GENDER_DISPLAY_TO_DB[gender] as PetGender) : null;

      const { setPets, pets } = useAppStore.getState();

      if (isNew) {
        const pet = await createPet({
          name: name.trim(),
          species: 'other',
          gender: genderDb,
          birthday: birthday.trim() || null,
          icon_uri: iconUri,
          sort_order: pets.length,
        });
        const allPets = [...pets, pet];
        setPets(allPets);
        if (allPets.length === 1) {
          useAppStore.getState().setSelectedPetId(pet.id);
          await setSetting('selected_pet_id', pet.id);
        }
      } else {
        await updatePet(petId!, {
          name: name.trim(),
          species: 'other',
          gender: genderDb,
          birthday: birthday.trim() || null,
          icon_uri: iconUri,
        });
        setPets(pets.map(p => p.id === petId ? { ...p, name: name.trim(), species: 'other', gender: genderDb, birthday: birthday.trim() || null, icon_uri: iconUri } : p));
      }
      router.back();
    } catch {
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'ペットを削除',
      `${name} を削除しますか？この操作は元に戻せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePet(petId!);
              const { setPets, pets, selectedPetId, setSelectedPetId } = useAppStore.getState();
              const newPets = pets.filter(p => p.id !== petId);
              setPets(newPets);
              if (selectedPetId === petId) {
                const next = newPets[0]?.id ?? null;
                setSelectedPetId(next);
                if (next) await setSetting('selected_pet_id', next);
              }
              router.back();
            } catch {
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{isNew ? 'ペットを追加' : 'ペットを編集'}</Text>
        <TouchableOpacity disabled={!canSave || saving} onPress={handleSave}>
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* アイコン */}
        <TouchableOpacity style={styles.iconContainer} onPress={handlePickIcon}>
          {iconUri ? (
            <Image source={{ uri: iconUri }} style={styles.iconImage} />
          ) : (
            <View style={styles.iconPlaceholder}>
              <Ionicons name="camera-outline" size={32} color={DS.colors.textHint} />
              <Text style={styles.iconPlaceholderText}>写真を選ぶ</Text>
            </View>
          )}
          <View style={styles.iconBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

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

        {!isNew && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteText}>このペットを削除する</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  navTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  saveText: { fontSize: 16, fontWeight: '700', color: DS.colors.accent },
  saveTextDisabled: { color: DS.colors.textHint },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, gap: 16, alignItems: 'center' },
  iconContainer: { position: 'relative', marginBottom: 8 },
  iconImage: { width: 88, height: 88, borderRadius: 44 },
  iconPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: DS.colors.border, alignItems: 'center', justifyContent: 'center',
    gap: 4,
  },
  iconPlaceholderText: { fontSize: 11, color: DS.colors.textHint },
  iconEmoji: { fontSize: 36 },
  iconBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: DS.colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    justifyContent: 'center', marginBottom: 8, width: '100%',
  },
  avatarCell: {
    alignItems: 'center', width: 80, paddingVertical: 12,
    borderRadius: DS.radius.md, borderWidth: 1.5, borderColor: DS.colors.border,
    backgroundColor: DS.colors.card, gap: 4,
  },
  avatarCellActive: { borderColor: DS.colors.accent, backgroundColor: DS.colors.accentLight },
  avatarEmoji: { fontSize: 32 },
  avatarLabel: { fontSize: 11, color: DS.colors.textMid, fontWeight: '500' },
  avatarLabelActive: { color: DS.colors.accent },
  label: { fontSize: 14, fontWeight: '600', color: DS.colors.text, marginBottom: -8, alignSelf: 'flex-start' },
  input: {
    backgroundColor: DS.colors.card, borderRadius: DS.radius.md, borderWidth: 1,
    borderColor: DS.colors.border, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: DS.colors.text, width: '100%',
  },
  pillRow: { flexDirection: 'row', gap: 10, alignSelf: 'flex-start' },
  pill: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: DS.radius.pill,
    borderWidth: 1.5, borderColor: DS.colors.border, backgroundColor: DS.colors.card,
  },
  pillActive: { borderColor: DS.colors.accent, backgroundColor: DS.colors.accentPill },
  pillText: { fontSize: 14, color: DS.colors.textMid, fontWeight: '500' },
  pillTextActive: { color: DS.colors.accent, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', marginTop: 16, paddingVertical: 12 },
  deleteText: { fontSize: 14, color: DS.colors.red, fontWeight: '600' },
});
