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
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { DS } from '@/theme';
import { TAG_OPTIONS } from '@/dummy';
import { Card } from '@/components/Card';
import { Photo } from '@/components/Photo';
import { Chip } from '@/components/Chip';
import { Toggle } from '@/components/Toggle';
import { PetAvatar } from '@/components/PetAvatar';
import { createEntry, getEntryByDate, updateEntry } from '@/db/entries';
import { addPendingUpload } from '@/db/pendingUploads';
import { getStreakState } from '@/db/streak';
import { getSetting } from '@/db/settings';
import { pickPhoto, takePhoto, processPhoto, saveToMediaLibrary } from '@/services/photo';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { generateUUID } from '@/utils/uuid';
import { getTodayJST, formatDisplayDate } from '@/utils/date';
import { ANNIVERSARY_TAG_DISPLAY_TO_DB, SPECIES_DB_TO_DISPLAY } from '@/utils/species';
import type { AnniversaryTagType } from '@/types';

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={DS.colors.accent} strokeWidth={2.2} strokeLinecap="round">
      <Path d="M15 19L8 12L15 5" />
    </Svg>
  );
}

function CameraIcon({ color = '#fff', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <Circle cx={12} cy={13} r={4} />
    </Svg>
  );
}

function PawIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Ellipse cx={12} cy={16.5} rx={5.5} ry={3.8} fill={DS.colors.accent} />
      <Ellipse cx={7} cy={10.5} rx={2} ry={2.6} fill={DS.colors.accent} />
      <Ellipse cx={17} cy={10.5} rx={2} ry={2.6} fill={DS.colors.accent} />
      <Ellipse cx={4} cy={7} rx={1.6} ry={2} fill={DS.colors.accent} />
      <Ellipse cx={20} cy={7} rx={1.6} ry={2} fill={DS.colors.accent} />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <Path d="M2 7l4 4 6-6" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={11} height={11} viewBox="0 0 16 18">
      <Path x={1} y={8} width={14} height={10} rx={2.5} fill={DS.colors.textHint} />
      <Path d="M4 8V6a4 4 0 018 0v2" stroke={DS.colors.textHint} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

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

  const pickFromCamera  = async () => { const uri = await takePhoto(); if (uri) setImageUri(uri); };
  const pickFromLibrary = async () => { const uri = await pickPhoto(); if (uri) setImageUri(uri); };

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

      const tagType     = tag ? ANNIVERSARY_TAG_DISPLAY_TO_DB[tag] as AnniversaryTagType : null;
      const activePets  = selectedPetId ? pets.filter(p => p.id === selectedPetId) : pets.slice(0, 1);
      const petIds      = activePets.map(p => p.id);

      let submittedEntry;
      if (existingEntryId) {
        await updateEntry(existingEntryId, {
          title: title.trim(), memo: memo.trim() || null,
          image_uri: finalImageUri, thumbnail_uri: thumbnailUri,
          anniversary_tag_type: tagType,
          anniversary_tag_name: tagType ? tag : null,
        });
        submittedEntry = await getEntryByDate(today);
      } else {
        submittedEntry = await createEntry(
          { date: today, title: title.trim(), memo: memo.trim() || null,
            image_uri: finalImageUri, thumbnail_uri: thumbnailUri,
            anniversary_tag_type: tagType, anniversary_tag_name: tagType ? tag : null },
          petIds
        );
      }

      if (featured && isPro && submittedEntry && !submittedEntry.featured_submitted) {
        const streakState  = await getStreakState();
        const firstPet     = activePets[0];
        const petNamesDisplay    = activePets.map(p => p.name).join('と');
        const petSpeciesPrimary  = firstPet ? SPECIES_DB_TO_DISPLAY[firstPet.species] : '';
        await addPendingUpload('featured_candidate', {
          entry_id: submittedEntry.id, entry_date: today,
          title: title.trim(), pet_names_display: petNamesDisplay,
          pet_species_primary: petSpeciesPrimary,
          featured_weight_streak: streakState.featured_weight_streak,
          image_uri: finalImageUri, thumbnail_uri: thumbnailUri,
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

  const activePet = selectedPetId ? pets.find(p => p.id === selectedPetId) : pets[0];
  const displaySpecies = activePet ? SPECIES_DB_TO_DISPLAY[activePet.species] : 'ねこ';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Nav bar */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navSide}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>今日の1枚を残す</Text>
          <Text style={styles.navDate}>{formatDisplayDate(today)}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.navSide}>
          <Text style={styles.cancelText}>キャンセル</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Photo area */}
        <View style={styles.photoWrap}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.9}>
            <Photo style={styles.photo} uri={imageUri} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickPhoto}>
            <CameraIcon color={DS.colors.text} size={14} />
            <Text style={styles.changePhotoBtnText}>写真を変更</Text>
          </TouchableOpacity>
        </View>

        {/* Helper text */}
        <View style={styles.helperRow}>
          <PawIcon />
          <Text style={styles.helperText}>今日の渾身の1枚を選びましょう</Text>
        </View>

        {/* Title + Memo card */}
        <Card style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>タイトル</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="今日はどんな顔をしてた？"
              placeholderTextColor={DS.colors.textHint}
              maxLength={50}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>メモ</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={memo}
              onChangeText={setMemo}
              placeholder="今日の出来事を書いてみましょう…"
              placeholderTextColor={DS.colors.textHint}
              multiline
              maxLength={200}
            />
            <View style={styles.memoHint}>
              <LockIcon />
              <Text style={styles.memoHintText}>メモは自分だけに表示されます</Text>
            </View>
          </View>
        </Card>

        {/* Pet + Tags card */}
        <Card style={styles.formCard}>
          {/* Pet selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>写っているペット</Text>
            <View style={styles.petChipsRow}>
              {activePet && (
                <View style={styles.petSelected}>
                  <PetAvatar species={displaySpecies} iconUri={activePet.icon_uri} size={26} />
                  <Text style={styles.petSelectedName}>{activePet.name}</Text>
                  <View style={styles.checkCircle}><CheckIcon /></View>
                </View>
              )}
              <TouchableOpacity style={styles.addPetBtn}>
                <Text style={styles.addPetBtnText}>＋ 追加</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Anniversary tags */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>記念日タグ</Text>
            <View style={styles.tagChipsRow}>
              {TAG_OPTIONS.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagChip, tag === t && styles.tagChipSelected]}
                  onPress={() => setTag(tag === t ? null : t)}
                >
                  {tag === t && (
                    <View style={styles.tagCheckCircle}><CheckIcon /></View>
                  )}
                  <Text style={[styles.tagChipText, tag === t && styles.tagChipTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.tagChipDash}>
                <Text style={styles.tagChipDashText}>＋ その他</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Today's pet toggle card */}
        <Card>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>今日のペットに参加</Text>
              <Text style={styles.toggleSub}>ONにすると、確認後に掲載される可能性があります</Text>
              <Text style={styles.toggleSub2}>メモは公開されません</Text>
            </View>
            <Toggle
              label=""
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
          </View>
        </Card>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.85}
        >
          <CameraIcon color="#fff" size={18} />
          <Text style={styles.saveBtnText}>{saving ? '保存中…' : '保存する'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },

  nav: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 16,
    paddingTop:        4,
    paddingBottom:     10,
  },
  navSide:    { minWidth: 60 },
  navCenter:  { alignItems: 'center', gap: 2 },
  navTitle:   { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  navDate:    { fontSize: 11, color: DS.colors.textHint },
  cancelText: { fontSize: 14, fontWeight: '500', color: DS.colors.accent, textAlign: 'right' },

  scroll: { paddingBottom: 32, gap: 10 },

  photoWrap: {
    marginHorizontal: 16,
    borderRadius:     18,
    overflow:         'hidden',
    position:         'relative',
  },
  photo: { width: '100%', height: 220, borderRadius: 0 },
  changePhotoBtn: {
    position:         'absolute',
    bottom:           12,
    right:            12,
    flexDirection:    'row',
    alignItems:       'center',
    gap:              6,
    backgroundColor:  'rgba(255,255,255,0.88)',
    borderRadius:     DS.radius.pill,
    paddingVertical:  8,
    paddingHorizontal: 14,
  },
  changePhotoBtnText: { fontSize: 13, fontWeight: '500', color: DS.colors.text },

  helperRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            5,
    paddingVertical: 10,
  },
  helperText: { fontSize: 12, color: DS.colors.accent, fontWeight: '500' },

  formCard:   { marginHorizontal: 16, gap: 14 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: DS.colors.textMid },
  input: {
    backgroundColor:  DS.colors.cardCream,
    borderRadius:     10,
    borderWidth:      1,
    borderColor:      DS.colors.border,
    paddingHorizontal: 14,
    paddingVertical:  11,
    fontSize:         15,
    color:            DS.colors.text,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  memoHint:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  memoHintText: { fontSize: 11, color: DS.colors.textHint },

  petChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  petSelected: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              6,
    backgroundColor:  DS.colors.accentPill,
    borderRadius:     DS.radius.pill,
    paddingVertical:  6,
    paddingLeft:      6,
    paddingRight:     10,
    borderWidth:      1.5,
    borderColor:      DS.colors.accent,
  },
  petSelectedName: { fontSize: 14, fontWeight: '600', color: DS.colors.text },
  checkCircle: {
    width:            18,
    height:           18,
    borderRadius:     9,
    backgroundColor:  DS.colors.accent,
    alignItems:       'center',
    justifyContent:   'center',
  },
  addPetBtn: {
    borderWidth:      1.5,
    borderColor:      DS.colors.border,
    borderRadius:     DS.radius.pill,
    paddingVertical:  6,
    paddingHorizontal: 14,
    borderStyle:      'dashed',
  },
  addPetBtnText: { fontSize: 13, color: DS.colors.textHint },

  tagChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              5,
    backgroundColor:  DS.colors.cardCream,
    borderRadius:     DS.radius.pill,
    paddingVertical:  7,
    paddingHorizontal: 14,
    borderWidth:      1.5,
    borderColor:      DS.colors.border,
  },
  tagChipSelected: {
    backgroundColor: DS.colors.accentPill,
    borderColor:     DS.colors.accent,
  },
  tagCheckCircle: {
    width:            16,
    height:           16,
    borderRadius:     8,
    backgroundColor:  DS.colors.accent,
    alignItems:       'center',
    justifyContent:   'center',
  },
  tagChipText:         { fontSize: 13, color: DS.colors.textMid },
  tagChipTextSelected: { fontSize: 13, fontWeight: '600', color: DS.colors.accent },
  tagChipDash: {
    borderWidth:      1.5,
    borderColor:      DS.colors.border,
    borderRadius:     DS.radius.pill,
    paddingVertical:  7,
    paddingHorizontal: 14,
    borderStyle:      'dashed',
  },
  tagChipDashText: { fontSize: 13, color: DS.colors.textHint },

  toggleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  toggleInfo: { flex: 1, paddingRight: 12, gap: 4 },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: DS.colors.text },
  toggleSub:   { fontSize: 12, color: DS.colors.textHint, lineHeight: 19 },
  toggleSub2:  { fontSize: 12, color: DS.colors.textHint },

  saveBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              8,
    marginHorizontal: 16,
    backgroundColor:  DS.colors.accent,
    borderRadius:     DS.radius.pill,
    paddingVertical:  16,
    marginBottom:     8,
    ...DS.shadow.float,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
