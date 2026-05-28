import React from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePets } from '@/hooks/usePets';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { setSetting } from '@/db/settings';
import { SPECIES_DB_TO_DISPLAY } from '@/utils/species';
import { speciesEmoji } from '@/utils/species';
import { DS } from '@/theme';
import { PetAvatar } from '@/components/PetAvatar';

const MAX_PETS_FREE = 1;

export default function PetSelect() {
  const pets = usePets();
  const { selectedPetId, setSelectedPetId } = useAppStore();
  const isPro = useAuthStore(state => state.isPro);
  const canAddPet = isPro || pets.length < MAX_PETS_FREE;

  const handleSelect = async (id: string) => {
    setSelectedPetId(id);
    await setSetting('selected_pet_id', id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.handle} />

      <View style={styles.nav}>
        <Text style={styles.navTitle}>ペットを選ぶ</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={DS.colors.textMid} />
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {pets.map(pet => {
          const active = pet.id === selectedPetId;
          return (
            <TouchableOpacity
              key={pet.id}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => handleSelect(pet.id)}
            >
              <PetAvatar
                species={SPECIES_DB_TO_DISPLAY[pet.species]}
                iconUri={pet.icon_uri}
                size={48}
              />
              <View style={styles.info}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petSpecies}>{SPECIES_DB_TO_DISPLAY[pet.species]}</Text>
              </View>
              {active && (
                <Ionicons name="checkmark-circle" size={22} color={DS.colors.accent} />
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.addRow}
          onPress={() => {
            if (!canAddPet) {
              Alert.alert('Pro機能', '2匹目以降の登録にはProプランが必要です。', [
                { text: 'キャンセル', style: 'cancel' },
                { text: 'Proを見る', onPress: () => router.push('/pro') },
              ]);
              return;
            }
            router.push('/settings/pet-form');
          }}
        >
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
    borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: DS.colors.border,
    alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  navTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  list: { paddingHorizontal: 20, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: DS.colors.bg, borderRadius: DS.radius.md,
    padding: 14, borderWidth: 1.5, borderColor: DS.colors.border,
  },
  rowActive: { borderColor: DS.colors.accent, backgroundColor: DS.colors.accentLight },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: DS.colors.accentPill, alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  petName: { fontSize: 16, fontWeight: '600', color: DS.colors.text },
  petSpecies: { fontSize: 13, color: DS.colors.textMid },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: DS.colors.bg, borderRadius: DS.radius.md,
    padding: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: DS.colors.accent,
  },
  addAvatar: { backgroundColor: DS.colors.accentLight },
  addText: { fontSize: 15, color: DS.colors.accent, fontWeight: '600' },
});
