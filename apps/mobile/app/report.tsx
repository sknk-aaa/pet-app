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
import { REPORT_REASON_LABELS } from '@/dummy';

export default function Report() {
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.handle} />
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.doneTitle}>通報を受け付けました</Text>
          <Text style={styles.doneSub}>内容を確認いたします。ご協力ありがとうございます。</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.handle} />
      <View style={styles.nav}>
        <View style={{ width: 32 }} />
        <Text style={styles.navTitle}>通報する</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={DS.colors.textMid} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>通報理由</Text>
        {Object.entries(REPORT_REASON_LABELS).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.reasonRow, reason === key && styles.reasonRowActive]}
            onPress={() => setReason(key)}
          >
            <Text style={[styles.reasonText, reason === key && styles.reasonTextActive]}>
              {label}
            </Text>
            {reason === key && (
              <Ionicons name="checkmark-circle" size={20} color={DS.colors.accent} />
            )}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>詳細（任意）</Text>
        <TextInput
          style={styles.input}
          value={detail}
          onChangeText={setDetail}
          placeholder="詳しい状況を教えてください"
          placeholderTextColor={DS.colors.textHint}
          multiline
          maxLength={300}
        />

        <TouchableOpacity
          style={[styles.button, !reason && styles.buttonDisabled]}
          disabled={!reason}
          onPress={() => setSubmitted(true)}
        >
          <Text style={styles.buttonText}>通報する</Text>
        </TouchableOpacity>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom:     32,
  },
  sectionLabel: {
    fontSize:     13,
    fontWeight:   '600',
    color:        DS.colors.textHint,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.md,
    padding:         16,
    marginBottom:     8,
    borderWidth:      1.5,
    borderColor:      DS.colors.border,
  },
  reasonRowActive: {
    borderColor:     DS.colors.accent,
    backgroundColor: DS.colors.accentLight,
  },
  reasonText: {
    fontSize: 15,
    color:    DS.colors.text,
  },
  reasonTextActive: {
    color:      DS.colors.accent,
    fontWeight: '600',
  },
  input: {
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.md,
    borderWidth:     1,
    borderColor:     DS.colors.border,
    paddingHorizontal: 16,
    paddingVertical:   14,
    fontSize:          15,
    color:             DS.colors.text,
    minHeight:         100,
    textAlignVertical: 'top',
    marginBottom:      20,
  },
  button: {
    backgroundColor: DS.colors.red,
    borderRadius:    DS.radius.pill,
    paddingVertical: 16,
    alignItems:      'center',
    ...DS.shadow.float,
  },
  buttonDisabled: {
    backgroundColor: DS.colors.border,
    shadowOpacity:   0,
    elevation:       0,
  },
  buttonText: {
    color:      '#fff',
    fontSize:   17,
    fontWeight: '700',
  },
  center: {
    flex:        1,
    alignItems:  'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap:         16,
  },
  doneEmoji: { fontSize: 56 },
  doneTitle: {
    fontSize:   22,
    fontWeight: '700',
    color:      DS.colors.text,
    textAlign:  'center',
  },
  doneSub: {
    fontSize:   14,
    color:      DS.colors.textMid,
    textAlign:  'center',
    lineHeight: 22,
  },
  closeBtn: {
    backgroundColor: DS.colors.accent,
    borderRadius:    DS.radius.pill,
    paddingHorizontal: 32,
    paddingVertical:   14,
    marginTop:         8,
    ...DS.shadow.float,
  },
  closeBtnText: {
    color:      '#fff',
    fontSize:   16,
    fontWeight: '700',
  },
});
