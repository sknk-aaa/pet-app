import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { DUMMY_ENTRY, TAG_OPTIONS } from '@/dummy';
import { Photo } from '@/components/Photo';
import { Chip } from '@/components/Chip';
import { Toggle } from '@/components/Toggle';

export default function PhotoForm() {
  const [title,    setTitle]    = useState(DUMMY_ENTRY.title);
  const [memo,     setMemo]     = useState(DUMMY_ENTRY.memo);
  const [tag,      setTag]      = useState<string | null>(DUMMY_ENTRY.tag);
  const [showTags, setShowTags] = useState(false);
  const [featured, setFeatured] = useState(DUMMY_ENTRY.featured);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ドラッグハンドル */}
      <View style={styles.handle} />

      {/* ナビゲーションバー */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={DS.colors.textMid} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>今日の1枚</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.saveText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* 写真 */}
        <TouchableOpacity>
          <Photo style={styles.photo} />
          <View style={styles.photoOverlay}>
            <Ionicons name="camera-outline" size={24} color="#fff" />
            <Text style={styles.photoOverlayText}>写真を選ぶ</Text>
          </View>
        </TouchableOpacity>

        {/* タイトル */}
        <Text style={styles.label}>タイトル</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="今日はどんな顔をしてた？"
          placeholderTextColor={DS.colors.textHint}
          maxLength={50}
        />

        {/* メモ */}
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

        {/* タグ */}
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

        {/* 今日のペット参加 */}
        <View style={styles.toggleSection}>
          <Toggle
            label="今日のペットに参加する"
            sublabel="選ばれたらみんなにリアクションが届きます"
            value={featured}
            onValueChange={setFeatured}
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
  safe: {
    flex:            1,
    backgroundColor: DS.colors.bg,
  },
  handle: {
    width:           40,
    height:           4,
    borderRadius:     2,
    backgroundColor:  DS.colors.border,
    alignSelf:        'center',
    marginTop:         8,
  },
  nav: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical:   14,
  },
  navTitle: {
    fontSize:   17,
    fontWeight: '600',
    color:      DS.colors.text,
  },
  saveText: {
    fontSize:   16,
    fontWeight: '700',
    color:      DS.colors.accent,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom:     32,
    gap:               16,
  },
  photo: {
    borderRadius: DS.radius.card,
    aspectRatio:  1,
  },
  photoOverlay: {
    position:       'absolute',
    bottom:          12,
    right:           12,
    flexDirection:   'row',
    alignItems:      'center',
    gap:              6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius:    DS.radius.pill,
    paddingHorizontal: 12,
    paddingVertical:    6,
  },
  photoOverlayText: {
    color:      '#fff',
    fontSize:   13,
    fontWeight: '600',
  },
  label: {
    fontSize:     14,
    fontWeight:   '600',
    color:        DS.colors.text,
    marginBottom: -8,
  },
  input: {
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.md,
    borderWidth:     1,
    borderColor:     DS.colors.border,
    paddingHorizontal: 16,
    paddingVertical:   14,
    fontSize:          16,
    color:             DS.colors.text,
  },
  inputMulti: {
    minHeight:   100,
    textAlignVertical: 'top',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            8,
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            6,
  },
  addTagText: {
    fontSize:   14,
    color:      DS.colors.accent,
    fontWeight: '600',
  },
  toggleSection: {
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.md,
    padding:         16,
    gap:              12,
    ...DS.shadow.card,
  },
  featuredNote: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:            6,
  },
  featuredNoteText: {
    flex:       1,
    fontSize:   12,
    color:      DS.colors.textHint,
    lineHeight: 18,
  },
});
