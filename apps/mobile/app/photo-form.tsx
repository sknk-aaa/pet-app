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
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
const PRESET_TAGS = ['誕生日'] as const;
const OTHER_TAGS  = ['うちの子記念日', 'はじめて', 'おでかけ', 'その他'] as const;
import { Card } from '@/components/Card';
import { Photo } from '@/components/Photo';
import { Toggle } from '@/components/Toggle';
import { PetAvatar } from '@/components/PetAvatar';
import { createEntry, getEntryByDate, updateEntry, updateEntryFeaturedState } from '@/db/entries';
import { addPendingUpload, removePendingFeaturedCandidate } from '@/db/pendingUploads';
import { getStreakState } from '@/db/streak';
import * as FileSystem from 'expo-file-system';
import { pickPhoto, takePhoto, processPhoto, saveToMediaLibrary } from '@/services/photo';
import { flushPendingUploads } from '@/services/uploadQueue';
import { supabase } from '@/services/supabase';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { generateUUID } from '@/utils/uuid';
import { getTodayJST, formatDisplayDate } from '@/utils/date';
import { ANNIVERSARY_TAG_DISPLAY_TO_DB, SPECIES_DB_TO_DISPLAY } from '@/utils/species';
import type { AnniversaryTagType, FeaturedStatus } from '@/types';

export default function PhotoForm() {
  const { firstEntry } = useLocalSearchParams<{ firstEntry?: string }>();
  const isFirstEntry = firstEntry === 'true';
  const today = getTodayJST();
  const queryClient = useQueryClient();
  const { pets, selectedPetId, settings } = useAppStore();
  const session = useAuthStore(state => state.session);

  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);
  const [originalThumbnailUri, setOriginalThumbnailUri] = useState<string | null>(null);
  const [title,    setTitle]    = useState('');
  const [memo,     setMemo]     = useState('');
  const [tag,      setTag]      = useState<string | null>(null);
  const [featured, setFeatured] = useState(false);
  const [featuredSubmitted, setFeaturedSubmitted] = useState(false);
  const [featuredCandidateId, setFeaturedCandidateId] = useState<string | null>(null);
  const [featuredStatus, setFeaturedStatus] = useState<FeaturedStatus | null>(null);
  const [awaitingFeaturedLogin, setAwaitingFeaturedLogin] = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [withdrawing,     setWithdrawing]     = useState(false);
  const [petModalVisible, setPetModalVisible] = useState(false);

  const initialPet = selectedPetId ? (pets.find(p => p.id === selectedPetId) ?? pets[0]) : pets[0];
  const [selectedPets, setSelectedPets] = useState<import('@/types').Pet[]>(
    initialPet ? [initialPet] : []
  );

  useEffect(() => {
    if (!selectedPetId) return;
    getEntryByDate(today, selectedPetId).then(entry => {
      if (!entry) return;
      setExistingEntryId(entry.id);
      setImageUri(entry.image_uri);
      setOriginalImageUri(entry.image_uri);
      setOriginalThumbnailUri(entry.thumbnail_uri);
      setTitle(entry.title);
      setMemo(entry.memo ?? '');
      setFeatured(entry.featured_submitted === 1);
      setFeaturedSubmitted(entry.featured_submitted === 1);
      setFeaturedCandidateId(entry.featured_candidate_id);
      setFeaturedStatus(entry.featured_status_cache);
      if (entry.pets.length > 0) setSelectedPets(entry.pets);
      if (entry.anniversary_tag_type) {
        const display = Object.entries(ANNIVERSARY_TAG_DISPLAY_TO_DB)
          .find(([, v]) => v === entry.anniversary_tag_type)?.[0] ?? null;
        setTag(display);
      }
    });
  }, [today, selectedPetId]);

  useEffect(() => {
    if (session && awaitingFeaturedLogin) {
      setFeatured(true);
      setAwaitingFeaturedLogin(false);
    }
  }, [session, awaitingFeaturedLogin]);

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
      const photoChanged = imageUri !== originalImageUri;

      let finalImageUri: string;
      let thumbnailUri: string;
      if (photoChanged) {
        const fileKey = existingEntryId ? `${existingEntryId}_${Date.now()}` : entryId;
        const processed = await processPhoto(imageUri, fileKey);
        finalImageUri = processed.imageUri;
        thumbnailUri  = processed.thumbnailUri;
        if (existingEntryId && originalImageUri) {
          await FileSystem.deleteAsync(originalImageUri, { idempotent: true }).catch(() => {});
          if (originalThumbnailUri) {
            await FileSystem.deleteAsync(originalThumbnailUri, { idempotent: true }).catch(() => {});
          }
        }
      } else {
        finalImageUri = imageUri!;
        thumbnailUri  = originalThumbnailUri ?? '';
      }

      if (settings.save_to_camera_roll && photoChanged) {
        await saveToMediaLibrary(finalImageUri).catch(() => {});
      }

      const tagType = tag ? ANNIVERSARY_TAG_DISPLAY_TO_DB[tag] as AnniversaryTagType : null;
      const petIds  = selectedPets.map(p => p.id);

      let submittedEntry;
      if (existingEntryId) {
        await updateEntry(existingEntryId, {
          title: title.trim(), memo: memo.trim() || null,
          ...(photoChanged ? { image_uri: finalImageUri, thumbnail_uri: thumbnailUri } : {}),
          anniversary_tag_type: tagType,
          anniversary_tag_name: tagType ? tag : null,
        }, petIds);
        submittedEntry = await getEntryByDate(today, petIds[0]);
      } else {
        submittedEntry = await createEntry(
          { date: today, title: title.trim(), memo: memo.trim() || null,
            image_uri: finalImageUri, thumbnail_uri: thumbnailUri,
            anniversary_tag_type: tagType, anniversary_tag_name: tagType ? tag : null },
          petIds
        );
      }

      if (featured && session && submittedEntry && !submittedEntry.featured_submitted) {
        const streakState       = await getStreakState();
        const petNamesDisplay   = selectedPets.map(p => p.name).join('と');
        const petSpeciesPrimary = primaryPet ? SPECIES_DB_TO_DISPLAY[primaryPet.species] : '';
        await addPendingUpload('featured_candidate', {
          entry_id: submittedEntry.id, entry_date: today,
          title: title.trim(), pet_names_display: petNamesDisplay,
          pet_species_primary: petSpeciesPrimary,
          featured_weight_streak: streakState.featured_weight_streak,
          image_uri: finalImageUri, thumbnail_uri: thumbnailUri,
        });
        await updateEntryFeaturedState(submittedEntry.id, 1, null, 'pending');
        flushPendingUploads().catch(() => {});
      }

      queryClient.invalidateQueries({ queryKey: ['entry', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['entry', 'memory'] });
      queryClient.invalidateQueries({ queryKey: ['entries', 'month'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      useAppStore.getState().setSavedAt(Date.now());
      if (isFirstEntry) {
        router.replace('/login-prompt');
      } else {
        router.back();
      }
    } catch (error) {
      console.error('[photo-form] save failed', error);
      const detail = error instanceof Error ? error.message : String(error);
      Alert.alert(
        'エラー',
        __DEV__
          ? `保存に失敗しました。\n\n${detail}`
          : '保存に失敗しました。もう一度お試しください。'
      );
    } finally {
      setSaving(false);
    }
  };

  const primaryPet     = selectedPets[0] ?? null;
  const displaySpecies = primaryPet ? SPECIES_DB_TO_DISPLAY[primaryPet.species] : 'ねこ';
  const participationStatus = featuredCandidateId
    ? featuredStatus === 'approved' || featuredStatus === 'scheduled'
      ? '掲載候補として確認済みです'
      : '確認を待っています'
    : '送信を待っています';
  const handleClose = () => {
    if (isFirstEntry) {
      router.replace('/(tabs)');
    } else {
      router.back();
    }
  };

  const handleWithdraw = () => {
    if (!existingEntryId || withdrawing || featuredStatus === 'featured') return;
    Alert.alert('参加を取り下げる', '今日のペットへの参加を取り下げますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '取り下げる',
        style: 'destructive',
        onPress: async () => {
          setWithdrawing(true);
          try {
            if (featuredCandidateId) {
              const { data, error } = await supabase.functions.invoke('withdraw-candidate', {
                body: { candidate_id: featuredCandidateId },
              });
              if (error) throw error;
              const previousStatus =
                (data as { previous_status?: FeaturedStatus } | null)?.previous_status ?? featuredStatus;
              const nextStatus =
                previousStatus === 'approved' || previousStatus === 'scheduled'
                  ? 'withdrawn'
                  : null;
              await updateEntryFeaturedState(
                existingEntryId,
                0,
                nextStatus ? featuredCandidateId : null,
                nextStatus
              );
              setFeaturedCandidateId(nextStatus ? featuredCandidateId : null);
              setFeaturedStatus(nextStatus);
            } else {
              await removePendingFeaturedCandidate(existingEntryId);
              await updateEntryFeaturedState(existingEntryId, 0, null, null);
              setFeaturedStatus(null);
            }
            setFeatured(false);
            setFeaturedSubmitted(false);
            queryClient.invalidateQueries({ queryKey: ['entry', 'today'] });
            Alert.alert('取り下げました', '今日のペットへの参加を取り下げました。');
          } catch {
            Alert.alert('エラー', '参加の取り下げに失敗しました。もう一度お試しください。');
          } finally {
            setWithdrawing(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Nav bar */}
      <View style={styles.nav}>
        {isFirstEntry ? (
          <View style={styles.navSide} />
        ) : (
          <TouchableOpacity onPress={handleClose} style={styles.navSide}>
            <Ionicons name="chevron-back" size={24} color={DS.colors.accent} />
          </TouchableOpacity>
        )}
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>{isFirstEntry ? '最初の1枚を残そう' : '今日の1枚を残す'}</Text>
          <Text style={styles.navDate}>{formatDisplayDate(today)}</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={[styles.navSide, styles.navSideRight]}>
          <Text style={styles.cancelText}>{isFirstEntry ? 'スキップ' : 'キャンセル'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Photo area */}
        <View style={styles.photoWrap}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.9}>
            <Photo style={styles.photo} uri={imageUri} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickPhoto}>
            <Ionicons name="camera-outline" size={14} color={DS.colors.text} />
            <Text style={styles.changePhotoBtnText}>写真を変更</Text>
          </TouchableOpacity>
        </View>

        {/* Helper text */}
        <View style={styles.helperRow}>
          <Ionicons name="paw" size={13} color={DS.colors.accent} />
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
              <Ionicons name="lock-closed-outline" size={11} color={DS.colors.textHint} />
              <Text style={styles.memoHintText}>メモは自分だけに表示されます</Text>
            </View>
          </View>
        </Card>

        {/* Pet + Tags card */}
        <Card style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>写っているペット</Text>
            <View style={styles.petChipsRow}>
              {selectedPets.map((pet, idx) => (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petSelected}
                  onPress={idx > 0 ? () => setSelectedPets(prev => prev.filter(p => p.id !== pet.id)) : undefined}
                  activeOpacity={idx > 0 ? 0.7 : 1}
                >
                  <PetAvatar
                    species={SPECIES_DB_TO_DISPLAY[pet.species]}
                    iconUri={pet.icon_uri}
                    size={26}
                  />
                  <Text style={styles.petSelectedName}>{pet.name}</Text>
                  {idx > 0 ? (
                    <Ionicons name="close-circle" size={14} color={DS.colors.textHint} />
                  ) : (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {pets.filter(p => !selectedPets.some(sp => sp.id === p.id)).length > 0 && (
                <TouchableOpacity
                  style={styles.addPetBtn}
                  onPress={() => setPetModalVisible(true)}
                >
                  <Ionicons name="add" size={15} color={DS.colors.accent} />
                  <Text style={styles.addPetBtnText}>追加</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>記念日タグ</Text>
            <View style={styles.tagChipsRow}>
              {PRESET_TAGS.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagChip, tag === t && styles.tagChipSelected]}
                  onPress={() => setTag(tag === t ? null : t)}
                >
                  {tag === t && (
                    <View style={styles.tagCheckCircle}>
                      <Ionicons name="checkmark" size={9} color="#fff" />
                    </View>
                  )}
                  <Text style={[styles.tagChipText, tag === t && styles.tagChipTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
              {tag && !(PRESET_TAGS as readonly string[]).includes(tag) && (
                <TouchableOpacity
                  style={[styles.tagChip, styles.tagChipSelected]}
                  onPress={() => setTag(null)}
                >
                  <View style={styles.tagCheckCircle}>
                    <Ionicons name="checkmark" size={9} color="#fff" />
                  </View>
                  <Text style={styles.tagChipTextSelected}>{tag}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.addTagBtn}
                onPress={() => {
                  Alert.prompt(
                    '記念日タグ',
                    'タグ名を入力してください',
                    [
                      { text: 'キャンセル', style: 'cancel' },
                      { text: '追加', onPress: (text) => { if (text?.trim()) setTag(text.trim()); } },
                    ],
                    'plain-text'
                  );
                }}
              >
                <Ionicons name="add" size={15} color={DS.colors.textMid} />
                <Text style={styles.addTagBtnText}>追加</Text>
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
              <Text style={styles.toggleSub}>メモは公開されません</Text>
            </View>
            {!featuredSubmitted && featuredStatus !== 'withdrawn' && (
              <Toggle
                label=""
                value={featured}
                onValueChange={v => {
                  if (v && !session) {
                    setAwaitingFeaturedLogin(true);
                    Alert.alert('ログインが必要です', '今日のペットに参加するにはログインしてください。', [
                      { text: 'キャンセル', style: 'cancel' },
                      { text: 'ログイン', onPress: () => router.push('/login') },
                    ]);
                    return;
                  }
                  setFeatured(v);
                }}
              />
            )}
          </View>
          {!featuredSubmitted && featuredStatus === 'withdrawn' && (
            <Text style={styles.submissionStatus}>参加を取り下げました</Text>
          )}
          {featuredSubmitted && (
            <View style={styles.submissionState}>
              <Text style={styles.submissionStatus}>{participationStatus}</Text>
              {featuredStatus !== 'featured' && (
                <TouchableOpacity
                  style={styles.withdrawBtn}
                  onPress={handleWithdraw}
                  disabled={withdrawing}
                >
                  <Text style={styles.withdrawBtnText}>
                    {withdrawing ? '取り下げ中…' : '参加を取り下げる'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.85}
        >
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? '保存中…' : '保存する'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── ペット選択モーダル ── */}
      <Modal
        visible={petModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPetModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.petModalBackdrop}
          activeOpacity={1}
          onPress={() => setPetModalVisible(false)}
        />
        <View style={styles.petSheet}>
          <View style={styles.petSheetHandle} />
          <Text style={styles.petSheetTitle}>ペットを追加</Text>
          {pets.filter(p => !selectedPets.some(sp => sp.id === p.id)).map(pet => (
            <TouchableOpacity
              key={pet.id}
              style={styles.petSheetRow}
              onPress={() => {
                setSelectedPets(prev => [...prev, pet]);
                setPetModalVisible(false);
              }}
              activeOpacity={0.7}
            >
              <PetAvatar
                species={SPECIES_DB_TO_DISPLAY[pet.species]}
                iconUri={pet.icon_uri}
                size={44}
                bg={DS.colors.pawWarm}
              />
              <Text style={styles.petSheetName}>{pet.name}</Text>
              <Ionicons name="add-circle-outline" size={22} color={DS.colors.accent} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.petSheetCancel} onPress={() => setPetModalVisible(false)}>
            <Text style={styles.petSheetCancelText}>キャンセル</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },

  nav: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        4,
    paddingBottom:     10,
  },
  navSide:      { minWidth: 60 },
  navSideRight: { alignItems: 'flex-end' },
  navCenter:    { alignItems: 'center', gap: 2 },
  navTitle:     { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  navDate:      { fontSize: 11, color: DS.colors.textHint },
  cancelText:   { fontSize: 14, fontWeight: '500', color: DS.colors.accent },

  scroll: { paddingBottom: 32, gap: 10 },

  photoWrap: {
    marginHorizontal: 16,
    borderRadius:     18,
    overflow:         'hidden',
    position:         'relative',
  },
  photo: { width: '100%', height: 220, borderRadius: 0 },
  changePhotoBtn: {
    position:          'absolute',
    bottom:            12,
    right:             12,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(255,255,255,0.88)',
    borderRadius:      DS.radius.pill,
    paddingVertical:   8,
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
    backgroundColor:   DS.colors.cardCream,
    borderRadius:      10,
    borderWidth:       1,
    borderColor:       DS.colors.border,
    paddingHorizontal: 14,
    paddingVertical:   11,
    fontSize:          15,
    color:             DS.colors.text,
  },
  inputMulti:   { minHeight: 72, textAlignVertical: 'top' },
  memoHint:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  memoHintText: { fontSize: 11, color: DS.colors.textHint },

  petChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  petSelected: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   DS.colors.accentPill,
    borderRadius:      DS.radius.pill,
    paddingVertical:   6,
    paddingLeft:       6,
    paddingRight:      10,
    borderWidth:       1.5,
    borderColor:       DS.colors.accent,
  },
  petSelectedName: { fontSize: 14, fontWeight: '600', color: DS.colors.text },
  checkCircle: {
    width:           18,
    height:          18,
    borderRadius:    9,
    backgroundColor: DS.colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  addPetBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               3,
    backgroundColor:   DS.colors.accentLight,
    borderRadius:      DS.radius.pill,
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderWidth:       1,
    borderColor:       DS.colors.accentSoft,
  },
  addPetBtnText: { fontSize: 13, fontWeight: '600', color: DS.colors.accent },

  tagChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   DS.colors.cardCream,
    borderRadius:      DS.radius.pill,
    paddingVertical:   7,
    paddingHorizontal: 14,
    borderWidth:       1.5,
    borderColor:       DS.colors.border,
  },
  tagChipSelected:      { backgroundColor: DS.colors.accentPill, borderColor: DS.colors.accent },
  tagCheckCircle: {
    width:           16,
    height:          16,
    borderRadius:    8,
    backgroundColor: DS.colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  tagChipText:         { fontSize: 13, color: DS.colors.textMid },
  tagChipTextSelected: { fontSize: 13, fontWeight: '600', color: DS.colors.accent },
  addTagBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               3,
    backgroundColor:   DS.colors.cardCream,
    borderRadius:      DS.radius.pill,
    paddingVertical:   7,
    paddingHorizontal: 12,
    borderWidth:       1.5,
    borderColor:       DS.colors.border,
  },
  addTagBtnText: { fontSize: 13, color: DS.colors.textMid },

  petModalBackdrop: {
    flex:            1,
    backgroundColor: 'rgba(44,26,14,0.35)',
  },
  petSheet: {
    backgroundColor:      DS.colors.bg,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingHorizontal:    20,
    paddingTop:           12,
    paddingBottom:        40,
    gap:                  4,
  },
  petSheetHandle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: DS.colors.border,
    alignSelf:       'center',
    marginBottom:    12,
  },
  petSheetTitle: {
    fontSize:      17,
    fontWeight:    '700',
    color:         DS.colors.text,
    marginBottom:  8,
  },
  petSheetRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DS.colors.border,
  },
  petSheetName: { flex: 1, fontSize: 16, fontWeight: '600', color: DS.colors.text },
  petSheetCancel: {
    alignItems:      'center',
    paddingVertical: 14,
    marginTop:       4,
  },
  petSheetCancelText: { fontSize: 15, color: DS.colors.textMid },

  toggleRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  toggleInfo: { flex: 1, paddingRight: 12, gap: 4 },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: DS.colors.text },
  toggleSub:   { fontSize: 12, color: DS.colors.textHint, lineHeight: 19 },
  submissionState: { marginTop: 14, gap: 10 },
  submissionStatus: { fontSize: 12, color: DS.colors.accent },
  withdrawBtn: {
    alignSelf:       'flex-start',
    borderWidth:     1,
    borderColor:     DS.colors.border,
    borderRadius:    DS.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  withdrawBtnText: { fontSize: 13, fontWeight: '600', color: DS.colors.textMid },

  saveBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    marginHorizontal:  16,
    backgroundColor:   DS.colors.accent,
    borderRadius:      DS.radius.pill,
    paddingVertical:   16,
    marginBottom:      8,
    ...DS.shadow.float,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText:     { color: '#fff', fontSize: 17, fontWeight: '700' },
});
