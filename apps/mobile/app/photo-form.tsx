import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { TAG_OPTIONS } from '@/dummy';
import { Photo } from '@/components/Photo';
import { Chip } from '@/components/Chip';
import { Toggle } from '@/components/Toggle';
import { createEntry, getEntryByDate, updateEntry } from '@/db/entries';
import { addPendingUpload } from '@/db/pendingUploads';
import { getStreakState } from '@/db/streak';
import { getSetting } from '@/db/settings';
import { pickPhoto, takePhoto, processPhoto, saveToMediaLibrary } from '@/services/photo';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { generateUUID } from '@/utils/uuid';
import { getTodayJST } from '@/utils/date';
import { ANNIVERSARY_TAG_DISPLAY_TO_DB, SPECIES_DB_TO_DISPLAY } from '@/utils/species';
import type { AnniversaryTagType } from '@/types';

export default function PhotoForm() {
  const today = getTodayJST();
  const queryClient = useQueryClient();
  const { pets, selectedPetId, settings } = useAppStore();
  const isPro = useAuthStore(state => state.isPro);

  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title,    setTitle]    = useState('');
  const [memo,     setMemo]     = useState('');
  const [tag,      setTag]      = useState<string | null>(null);
  const [showTags, setShowTags] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    getEntryByDate(today).then(entry => {
      if (!entry) return;
      setExistingEntryId(entry.id);
      setImageUri(entry.image_uri);
      setTitle(entry.title);
      setMemo(entry.memo ?? '');
      setFeatured(entry.featured_submitted === 1);
      if (entry.anniversary_tag_type) {
        const display = Object.entries(ANNIVERSARY_TAG_DISPLAY_TO_DB)
          .find(([, v]) => v === entry.anniversary_tag_type)?.[0] ?? null;
        setTag(display);
      }
    });
  }, [today]);

  const handlePickPhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['キャンセル', 'カメラで撮る', 'ライブラリから選ぶ'], cancelButtonIndex: 0 },
        async idx => {
          if (idx === 1) await pickFromCamera();
          else if (idx === 2) await pickFromLibrary();
        }
      );
    } else {
      Alert.alert('写真を選ぶ', '', [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'カメラで撮る', onPress: pickFromCamera },
        { text: 'ライブラリから選ぶ', onPress: pickFromLibrary },
      ]);
    }
  };

  const pickFromCamera = async () => {
    const uri = await takePhoto();
    if (uri) setImageUri(uri);
  };

  const pickFromLibrary = async () => {
    const uri = await pickPhoto();
    if (uri) setImageUri(uri);
  };

  const canSave = imageUri !== null && title.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving || !imageUri) return;
    setSaving(true);
    try {
      const entryId = existingEntryId ?? generateUUID();
      const { imageUri: finalImageUri, thumbnailUri } = await processPhoto(imageUri, entryId);

      if (settings.save_to_camera_roll) {
        await saveToMediaLibrary(finalImageUri).catch(() => {});
      }

      const tagType = tag ? ANNIVERSARY_TAG_DISPLAY_TO_DB[tag] as AnniversaryTagType : null;
      const activePets = selectedPetId ? pets.filter(p => p.id === selectedPetId) : pets.slice(0, 1);
      const petIds = activePets.map(p => p.id);

      let submittedEntry;
      if (existingEntryId) {
        await updateEntry(existingEntryId, {
          title: title.trim(),
          memo: memo.trim() || null,
          image_uri: finalImageUri,
          thumbnail_uri: thumbnailUri,
          anniversary_tag_type: tagType,
          anniversary_tag_name: tagType ? tag : null,
        });
        submittedEntry = await getEntryByDate(today);
      } else {
        submittedEntry = await createEntry(
          {
            date: today,
            title: title.trim(),
            memo: memo.trim() || null,
            image_uri: finalImageUri,
            thumbnail_uri: thumbnailUri,
            anniversary_tag_type: tagType,
            anniversary_tag_name: tagType ? tag : null,
          },
          petIds
        );
      }

      if (featured && isPro && submittedEntry && !submittedEntry.featured_submitted) {
        const streakState = await getStreakState();
        const firstPet = activePets[0];
        const petNamesDisplay = activePets.map(p => p.name).join('と');
        const petSpeciesPrimary = firstPet
          ? SPECIES_DB_TO_DISPLAY[firstPet.species]
          : '';

        await addPendingUpload('featured_candidate', {
          entry_id: submittedEntry.id,
          entry_date: today,
          title: title.trim(),
          pet_names_display: petNamesDisplay,
          pet_species_primary: petSpeciesPrimary,
          featured_weight_streak: streakState.featured_weight_streak,
          image_uri: finalImageUri,
          thumbnail_uri: thumbnailUri,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['entry', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['entry', 'memory'] });
      queryClient.invalidateQueries({ queryKey: ['entries', 'month'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });

      router.back();
    } catch {
      Alert.alert('エラー', '保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.handle} />
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={DS.colors.textMid} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>今日の1枚</Text>
        <TouchableOpacity onPress={handleSave} disabled={!canSave || saving}>
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={handlePickPhoto}>
          <Photo style={styles.photo} uri={imageUri} />
          <View style={styles.photoOverlay}>
            <Ionicons name="camera-outline" size={24} color="#fff" />
            <Text style={styles.photoOverlayText}>写真を選ぶ</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>タイトル</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="今日はどんな顔をしてた？"
          placeholderTextColor={DS.colors.textHint}
          maxLength={50}
        />

        <Text style={styles.label}>メモ（任意）</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={memo}
          onChangeText={setMemo}
          placeholder="今日の出来事を書いてみましょう…"
          placeholderTextColor={DS.colors.textHint}
          multiline
          maxLength={200}
        />

        <Text style={styles.label}>記念日タグ（任意）</Text>
        {tag ? (
          <View style={styles.tagRow}>
            <Chip label={tag} selected onPress={() => setTag(null)} />
          </View>
        ) : showTags ? (
          <View style={styles.tagRow}>
            {TAG_OPTIONS.map(t => (
              <Chip
                key={t}
                label={t}
                selected={false}
                onPress={() => { setTag(t); setShowTags(false); }}
              />
            ))}
          </View>
        ) : (
          <TouchableOpacity style={styles.addTagBtn} onPress={() => setShowTags(true)}>
            <Ionicons name="add-circle-outline" size={18} color={DS.colors.accent} />
            <Text style={styles.addTagText}>+ タグを追加</Text>
          </TouchableOpacity>
        )}

        <View style={styles.toggleSection}>
          <Toggle
            label="今日のペットに参加する"
            sublabel="選ばれたらみんなにリアクションが届きます"
            value={featured}
            onValueChange={v => {
              if (v && !isPro) {
                Alert.alert('Pro機能', '今日のペットへの参加はProプランのみご利用いただけます。', [
                  { text: 'キャンセル', style: 'cancel' },
                  { text: 'Proを見る', onPress: () => router.push('/pro') },
                ]);
                return;
              }
              setFeatured(v);
            }}
          />
          {featured && (
            <View style={styles.featuredNote}>
              <Ionicons name="information-circle-outline" size={16} color={DS.colors.textHint} />
              <Text style={styles.featuredNoteText}>
                毎日1枚が選ばれます。選ばれた写真はホームに表示されます。
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: DS.colors.border,
    alignSelf: 'center', marginTop: 8,
  },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  navTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  saveText: { fontSize: 16, fontWeight: '700', color: DS.colors.accent },
  saveTextDisabled: { color: DS.colors.textHint },
  scroll: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  photo: { borderRadius: DS.radius.card, aspectRatio: 1 },
  photoOverlay: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: DS.radius.pill,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  photoOverlayText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: DS.colors.text, marginBottom: -8 },
  input: {
    backgroundColor: DS.colors.card, borderRadius: DS.radius.md, borderWidth: 1,
    borderColor: DS.colors.border, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: DS.colors.text,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addTagBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addTagText: { fontSize: 14, color: DS.colors.accent, fontWeight: '600' },
  toggleSection: {
    backgroundColor: DS.colors.card, borderRadius: DS.radius.md,
    padding: 16, gap: 12, ...DS.shadow.card,
  },
  featuredNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  featuredNoteText: { flex: 1, fontSize: 12, color: DS.colors.textHint, lineHeight: 18 },
});
