import { Tabs, router } from 'expo-router';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomTabBar } from '@/components/CustomTabBar';
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

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerTitle: '',
        headerStyle: styles.header,
        headerShadowVisible: false,
        headerLeftContainerStyle: styles.headerLeft,
        headerRightContainerStyle: styles.headerRight,
      }}
    >
      <Tabs.Screen name="calendar" options={{ title: 'カレンダー' }} />
      <Tabs.Screen name="index" options={{ title: 'ホーム', headerShown: false }} />
      <Tabs.Screen name="today-pet" options={{ title: '今日のペット', headerLeft: () => <SettingsHeaderButton /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    height:          110,
    backgroundColor: DS.colors.bg,
  },
  headerLeft:  { paddingLeft: 16 },
  headerRight: { paddingRight: 14 },
  headerButton: {
    padding: 6,
  },
});
