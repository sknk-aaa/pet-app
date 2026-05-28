import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePets } from '@/hooks/usePets';
import { useAuthStore } from '@/store/authStore';
import { SPECIES_DB_TO_DISPLAY, GENDER_DB_TO_DISPLAY } from '@/utils/species';
import { DS } from '@/theme';
import { PetAvatar } from '@/components/PetAvatar';

const MAX_PETS_FREE = 1;

export default function Pets() {
  const pets = usePets();
  const isPro = useAuthStore(state => state.isPro);
  const canAddPet = isPro || pets.length < MAX_PETS_FREE;

  const handleAdd = () => {
    if (!canAddPet) {
      Alert.alert('Pro機能', `ペットを${MAX_PETS_FREE + 1}匹以上登録するにはProプランが必要です。`, [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'Proを見る', onPress: () => router.push('/pro') },
      ]);
      return;
    }
    router.push({ pathname: '/settings/pet-form' });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>ペット管理</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={DS.colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {pets.map(pet => (
          <TouchableOpacity
            key={pet.id}
            style={styles.card}
            onPress={() => router.push({ pathname: '/settings/pet-form', params: { petId: pet.id } })}
          >
            <PetAvatar species={SPECIES_DB_TO_DISPLAY[pet.species]} size={52} iconUri={pet.icon_uri} />
            <View style={styles.info}>
              <Text style={styles.name}>{pet.name}</Text>
              <Text style={styles.detail}>
                {SPECIES_DB_TO_DISPLAY[pet.species]}
                {pet.gender ? ` · ${GENDER_DB_TO_DISPLAY[pet.gender]}` : ''}
                {pet.birthday ? ` · ${pet.birthday}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={DS.colors.textHint} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addCard} onPress={handleAdd}>
          <Ionicons name="add-circle-outline" size={24} color={DS.colors.accent} />
          <Text style={styles.addText}>ペットを追加する</Text>
        </TouchableOpacity>
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
  addBtn: { padding: 4 },
  navTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 12, paddingTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: DS.colors.card, borderRadius: DS.radius.card,
    padding: 16, ...DS.shadow.card,
  },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600', color: DS.colors.text, marginBottom: 3 },
  detail: { fontSize: 13, color: DS.colors.textMid },
  addCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: DS.colors.card, borderRadius: DS.radius.card, padding: 18,
    borderWidth: 1, borderStyle: 'dashed', borderColor: DS.colors.accent,
  },
  addText: { fontSize: 15, color: DS.colors.accent, fontWeight: '600' },
});
