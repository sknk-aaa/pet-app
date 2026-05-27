import { Platform } from 'react-native';

export const DS = {
  colors: {
    bg:           '#FAF7F2',
    card:         '#FFFFFF',
    cardCream:    '#FFF8F3',
    accent:       '#E8824A',
    accentSoft:   '#EFA87A',
    accentLight:  '#FEF0E5',
    accentPill:   '#FDEADA',
    peach:        '#FBEEE4',
    text:         '#3B2314',
    textMid:      '#8B6347',
    textHint:     '#BBA898',
    sage:         '#6E9E68',
    sagePill:     '#EBF4EA',
    border:       '#EDE5DC',
    white:        '#FFFFFF',
    red:          '#E05040',
  },
  radius: {
    card: 20,
    pill: 100,
    md:   12,
    sm:   8,
  },
  // Noto Sans JP は expo-font で読み込む想定。未ロード時は system フォントにフォールバック
  font: Platform.select({ ios: 'System', default: 'System' }),
  shadow: {
    card: {
      shadowColor: '#50280A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 3,
    },
    float: {
      shadowColor: '#50280A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 8,
    },
  },
} as const;

export type DSColors = keyof typeof DS.colors;
