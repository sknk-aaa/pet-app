import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={props => <CustomTabBar {...props} />}>
      <Tabs.Screen name="calendar"  options={{ title: 'カレンダー' }} />
      <Tabs.Screen name="index"     options={{ title: 'ホーム'     }} />
      <Tabs.Screen name="today-pet" options={{ title: '今日のペット' }} />
    </Tabs>
  );
}
