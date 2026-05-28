import { Tabs, router } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomTabBar } from '@/components/CustomTabBar';
import { PetAvatar } from '@/components/PetAvatar';
import { useSelectedPet } from '@/hooks/usePets';
import { SPECIES_DB_TO_DISPLAY } from '@/utils/species';
import { DS } from '@/theme';

function SettingsHeaderButton() {
  return (
    <TouchableOpacity
      accessibilityLabel="設定"
      onPress={() => router.push('/settings')}
      style={styles.headerButton}
    >
      <Ionicons name="settings-outline" size={23} color={DS.colors.textMid} />
    </TouchableOpacity>
  );
}

function PetPillHeader() {
  const selectedPet = useSelectedPet();
  const species = selectedPet ? SPECIES_DB_TO_DISPLAY[selectedPet.species] : 'ねこ';
  return (
    <TouchableOpacity
      style={styles.petPill}
      onPress={() => router.push('/pet-select')}
      activeOpacity={0.8}
    >
      <PetAvatar species={species} iconUri={selectedPet?.icon_uri} size={22} />
      <Text style={styles.petPillName}>{selectedPet?.name ?? '—'}</Text>
      <Ionicons name="chevron-down" size={10} color={DS.colors.textHint} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerTitle: '',
        headerStyle: styles.header,
        headerShadowVisible: false,
        headerLeftContainerStyle:  styles.headerLeft,
        headerRightContainerStyle: styles.headerRight,
      }}
    >
      <Tabs.Screen
        name="calendar"
        options={{
          title:       'カレンダー',
          headerLeft:  () => <SettingsHeaderButton />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title:       'ホーム',
          headerLeft:  () => <SettingsHeaderButton />,
          headerRight: () => <PetPillHeader />,
        }}
      />
      <Tabs.Screen
        name="today-pet"
        options={{
          title:      '今日のペット',
          headerLeft: () => <SettingsHeaderButton />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    height:          56,
    backgroundColor: DS.colors.bg,
  },
  headerLeft:  { paddingLeft: 16 },
  headerRight: { paddingRight: 14 },
  headerButton: { padding: 6 },
  petPill: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.pill,
    paddingVertical: 5,
    paddingLeft:     5,
    paddingRight:    9,
    borderWidth:     1,
    borderColor:     DS.colors.border,
    ...DS.shadow.card,
  },
  petPillName: { fontSize: 12, fontWeight: '600', color: DS.colors.text },
});
