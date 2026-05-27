import { View, ActivityIndicator } from 'react-native';
import { DS } from '@/theme';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DS.colors.bg }}>
      <ActivityIndicator size="large" color={DS.colors.accent} />
    </View>
  );
}
