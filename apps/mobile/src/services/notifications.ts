import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

const REMINDER_ID = 'daily-reminder';

const REMINDER_MESSAGES = [
  { title: 'うちの子の今日を残しましょう',    body: '今日の1枚を記録しよう' },
  { title: '今日の1枚はもう撮りましたか?',    body: 'カレンダーに今日の記録を追加しよう' },
  { title: '今日のうちの子、忘れずに',        body: 'あとで見返したい瞬間を残しておこう' },
];

function randomMessage() {
  return REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
}

export async function requestPermission(): Promise<boolean> {
  if (!Device.isDevice) return false; // シミュレータは false
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleOrUpdateDailyReminder(
  enabled: boolean,
  time: string  // 'HH:MM'
): Promise<void> {
  // 既存をキャンセル
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});

  if (!enabled) return;

  const [hour, minute] = time.split(':').map(Number);
  const msg = randomMessage();

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: msg.title, body: msg.body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

// 当日分の未配信リマインダーをdismiss
export async function dismissTodayReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
  // 翌日の同じ時刻で再スケジュールは _layout の設定変更リスナーがカバー
}

// Expo Push Token を取得して Supabase の users テーブルに upsert
export async function registerPushToken(userId: string): Promise<void> {
  if (!Device.isDevice) return;
  const permitted = await requestPermission();
  if (!permitted) return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);
  } catch {
    // Push Token 取得失敗は無視
  }
}

// ログアウト時: push_token を NULL に
export async function clearPushToken(userId: string): Promise<void> {
  await supabase
    .from('users')
    .update({ push_token: null })
    .eq('id', userId);
}
