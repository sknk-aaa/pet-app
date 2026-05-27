import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { Toggle } from '@/components/Toggle';

export default function Notifications() {
  const [dailyReminder, setDailyReminder] = useState(true);
  const [featuredAlert, setFeaturedAlert] = useState(true);
  const [reactionAlert, setReactionAlert] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>通知設定</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionHeader}>リマインダー</Text>
        <View style={styles.section}>
          <Toggle
            label="毎日の記録リマインダー"
            sublabel="毎晩21時に今日の1枚を促します"
            value={dailyReminder}
            onValueChange={setDailyReminder}
          />
        </View>

        <Text style={styles.sectionHeader}>今日のペット</Text>
        <View style={styles.section}>
          <Toggle
            label="掲載通知"
            sublabel="写真が今日のペットに選ばれたとき"
            value={featuredAlert}
            onValueChange={setFeaturedAlert}
          />
          <View style={styles.divider} />
          <Toggle
            label="リアクション通知"
            sublabel="リアクションが届いたとき"
            value={reactionAlert}
            onValueChange={setReactionAlert}
          />
        </View>

        <Text style={styles.note}>
          通知の受信には、端末の通知設定でこのアプリへの許可が必要です。
        </Text>
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
  scroll: {
    paddingHorizontal: 16,
    paddingBottom:     32,
  },
  sectionHeader: {
    fontSize:     12,
    fontWeight:   '600',
    color:        DS.colors.textHint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop:    20,
    marginBottom:  8,
  },
  section: {
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.card,
    paddingHorizontal: 16,
    paddingVertical:    4,
    ...DS.shadow.card,
  },
  divider: {
    height:          0.5,
    backgroundColor: DS.colors.border,
  },
  note: {
    fontSize:   13,
    color:      DS.colors.textHint,
    lineHeight: 20,
    marginTop:  20,
    textAlign:  'center',
    paddingHorizontal: 8,
  },
});
