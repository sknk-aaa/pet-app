import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';

// ─────────────────────────────────────────────────────────────
// TRACE_MODE: true のとき元画像を背面に表示
// 再現完了後は false にして元画像を非表示にする
// ─────────────────────────────────────────────────────────────
const TRACE_MODE = true;

// 基準サイズ（元画像の解像度）
const IMG_W = 853;
const IMG_H = 1844;

const { width: SW, height: SH } = Dimensions.get('window');
const SCALE = SW / IMG_W;

// 画像座標 → 実デバイス座標
const s = (v: number) => v * SCALE;

export default function HomeRecordedTraceScreen() {
  return (
    <View style={styles.root}>
      <RNStatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* ── 背景トレース画像 (opacity 0.35) ── */}
      {TRACE_MODE && (
        <Image
          source={require('../assets/trace-home.png')}
          style={styles.traceImage}
          resizeMode="stretch"
        />
      )}

      {/* ═══ ヘッダー ═══ */}

      {/* 日付テキスト（左） */}
      <Text style={[styles.headerDate, { top: s(120), left: s(35), fontSize: s(26) }]}>
        5月26日 火曜日
      </Text>

      {/* タイトル「今日の1枚」（中央） */}
      <Text style={[styles.headerTitle, { top: s(107), width: SW, fontSize: s(62) }]}>
        今日の1枚
      </Text>

      {/* 設定アイコン（右） */}
      <TouchableOpacity style={[styles.settingsBtn, { top: s(119), right: s(35) }]}>
        <Ionicons name="settings-outline" size={s(46)} color={DS.home.text} />
      </TouchableOpacity>

      {/* ═══ ストリークバッジ ═══ */}
      <View style={[styles.streakPill, {
        top:    s(193),
        left:   (SW - s(235)) / 2,
        width:  s(235),
        height: s(56),
      }]}>
        <Text style={[styles.streakFire, { fontSize: s(38) }]}>🔥</Text>
        <Text style={[styles.streakLabel, { fontSize: s(34) }]}>連続</Text>
        <Text style={[styles.streakCount, { fontSize: s(44) }]}>13日</Text>
      </View>

      {/* ═══ メインカード ═══ */}
      <View style={[styles.cardOuter, {
        top:          s(261),
        left:         s(28),
        width:        s(797),
        borderRadius: s(40),
      }]}>
        <View style={[styles.cardInner, { borderRadius: s(40) }]}>

          {/* 写真（仮プレースホルダー） */}
          <View style={[styles.photoPlaceholder, { height: s(352) }]}>
            <Ionicons name="image-outline" size={s(80)} color="#BBA898" />
            <Text style={{ color: '#BBA898', fontSize: s(28), marginTop: s(8) }}>
              ここに写真が入ります
            </Text>
          </View>

          {/* 情報エリア */}
          <View style={[styles.infoSection, {
            paddingHorizontal: s(35),
            paddingTop:        s(26),
            paddingBottom:     s(28),
            gap:               s(18),
          }]}>
            {/* カードタイトル */}
            <Text style={[styles.infoTitle, { fontSize: s(52) }]}>
              今日はいい顔してる
            </Text>

            {/* メモ */}
            <Text style={[styles.infoMemo, { fontSize: s(30), lineHeight: s(47) }]}>
              {'窓辺でうとうとしてた。\n起きた瞬間に撮れた1枚。'}
            </Text>

            {/* タグチップ行 */}
            <View style={styles.chipsRow}>
              <View style={[styles.chip, {
                height:          s(56),
                paddingHorizontal: s(28),
                gap:             s(14),
                borderRadius:    s(100),
              }]}>
                <Ionicons name="paw" size={s(28)} color={DS.home.text} />
                <Text style={[styles.chipText, { fontSize: s(30) }]}>まる</Text>
              </View>
              <View style={[styles.chip, {
                height:          s(56),
                paddingHorizontal: s(28),
                gap:             s(14),
                borderRadius:    s(100),
              }]}>
                <Ionicons name="pricetag-outline" size={s(28)} color={DS.home.text} />
                <Text style={[styles.chipText, { fontSize: s(30) }]}>おでかけ</Text>
              </View>
            </View>

            {/* 今日のペット参加中 */}
            <View style={[styles.featuredBtn, {
              height:       s(58),
              borderRadius: s(100),
              gap:          s(16),
            }]}>
              <Ionicons name="paw" size={s(32)} color={DS.home.accent} />
              <Text style={[styles.featuredText, { fontSize: s(30) }]}>
                今日のペット 参加中
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ═══ アクション行 ═══ */}

      {/* 編集ボタン */}
      <TouchableOpacity style={[styles.editBtn, {
        top:             s(876),
        left:            s(35),
        height:          s(63),
        paddingHorizontal: s(38),
        borderRadius:    s(100),
        gap:             s(14),
      }]}>
        <Ionicons name="create-outline" size={s(32)} color={DS.home.accent} />
        <Text style={[styles.editText, { fontSize: s(32) }]}>編集</Text>
      </TouchableOpacity>

      {/* カレンダーで見返すリンク */}
      <TouchableOpacity style={[styles.calLink, {
        top:   s(883),
        right: s(35),
        gap:   s(8),
      }]}>
        <Text style={[styles.calLinkText, { fontSize: s(32) }]}>カレンダーで見返す</Text>
        <Ionicons name="chevron-forward" size={s(32)} color={DS.home.accent} />
      </TouchableOpacity>

      {/* ═══ タブバー ═══ */}
      <View style={[styles.tabBar, { height: s(96) }]}>
        {/* カレンダータブ */}
        <View style={styles.tabItem}>
          <Ionicons name="calendar-outline" size={s(48)} color={DS.colors.textHint} />
          <Text style={[styles.tabLabel, { fontSize: s(22) }]}>カレンダー</Text>
        </View>

        {/* ホームタブ（アクティブ・中央） */}
        <View style={styles.tabItemCenter}>
          <View style={[styles.tabActiveCircle, {
            width:        s(112),
            height:       s(112),
            borderRadius: s(56),
            marginTop:    s(-36),
          }]}>
            <Ionicons name="paw" size={s(52)} color="#fff" />
          </View>
          <Text style={[styles.tabLabelActive, { fontSize: s(22) }]}>ホーム</Text>
        </View>

        {/* 今日のペットタブ */}
        <View style={styles.tabItem}>
          <Ionicons name="paw-outline" size={s(48)} color={DS.colors.textHint} />
          <Text style={[styles.tabLabel, { fontSize: s(22) }]}>今日のペット</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: DS.home.background,
  },

  // トレース画像
  traceImage: {
    position: 'absolute',
    top:      0,
    left:     0,
    width:    SW,
    height:   SH,
    opacity:  0.35,
  },

  // ── ヘッダー ──
  headerDate: {
    position: 'absolute',
    color:    DS.colors.textHint,
  },
  headerTitle: {
    position:  'absolute',
    fontWeight: 'bold',
    color:     DS.home.text,
    textAlign: 'center',
  },
  settingsBtn: {
    position: 'absolute',
  },

  // ── ストリーク ──
  streakPill: {
    position:       'absolute',
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            s(12),
    backgroundColor: DS.home.pill,
    borderRadius:   s(100),
    borderWidth:    1,
    borderColor:    DS.home.outline,
  },
  streakFire: {
    lineHeight: s(46),
  },
  streakLabel: {
    fontWeight: '500',
    color:      DS.home.text,
  },
  streakCount: {
    fontWeight: 'bold',
    color:      DS.home.accent,
  },

  // ── カード ──
  cardOuter: {
    position:        'absolute',
    backgroundColor: '#FFFFFF',
    shadowColor:     '#6B3A1F',
    shadowOffset:    { width: 0, height: s(8) },
    shadowOpacity:   0.09,
    shadowRadius:    s(28),
    elevation:       4,
  },
  cardInner: {
    overflow: 'hidden',
  },
  photoPlaceholder: {
    width:           '100%',
    backgroundColor: '#F0E8E0',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             s(10),
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
  },
  infoTitle: {
    fontWeight: 'bold',
    color:      DS.home.text,
  },
  infoMemo: {
    color: DS.home.textSoft,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           s(18),
  },
  chip: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: DS.home.pill,
    borderWidth:     1,
    borderColor:     DS.home.outline,
  },
  chipText: {
    fontWeight: '500',
    color:      DS.home.text,
  },
  featuredBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    DS.home.accent,
  },
  featuredText: {
    fontWeight: '500',
    color:      DS.home.accent,
  },

  // ── アクション行 ──
  editBtn: {
    position:      'absolute',
    flexDirection: 'row',
    alignItems:    'center',
    borderWidth:   1,
    borderColor:   DS.home.accent,
  },
  editText: {
    fontWeight: 'bold',
    color:      DS.home.accent,
  },
  calLink: {
    position:      'absolute',
    flexDirection: 'row',
    alignItems:    'center',
  },
  calLinkText: {
    fontWeight: 'bold',
    color:      DS.home.accent,
  },

  // ── タブバー ──
  tabBar: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    flexDirection:   'row',
    alignItems:      'flex-end',
    backgroundColor: '#FFFAF4',
    borderTopWidth:  StyleSheet.hairlineWidth,
    borderTopColor:  DS.colors.border,
    paddingBottom:   s(14),
  },
  tabItem: {
    flex:       1,
    alignItems: 'center',
    gap:        s(6),
  },
  tabLabel: {
    color: DS.colors.textHint,
  },
  tabItemCenter: {
    flex:       1,
    alignItems: 'center',
    gap:        s(4),
  },
  tabActiveCircle: {
    backgroundColor: DS.colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#D0601A',
    shadowOffset:    { width: 0, height: s(4) },
    shadowOpacity:   0.28,
    shadowRadius:    s(12),
    elevation:       6,
  },
  tabLabelActive: {
    fontWeight: 'bold',
    color:      DS.colors.accent,
  },
});
