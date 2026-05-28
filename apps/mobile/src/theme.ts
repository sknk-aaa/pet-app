export const DS = {
  colors: {
    bg:           '#F4F1ED',
    card:         '#FFFFFF',
    cardCream:    '#FAF8F5',
    accent:       '#CC4E1E',
    accentSoft:   '#E07040',
    accentLight:  '#F5ECE7',
    accentPill:   '#EDE0D8',
    peach:        '#F0E8E2',
    text:         '#18160F',
    textMid:      '#564E44',
    textHint:     '#9A9088',
    sage:         '#4A7A46',
    sagePill:     '#E6F0E4',
    border:       '#E4DDD6',
    white:        '#FFFFFF',
    red:          '#C03828',
  },
  radius: {
    card: 16,
    pill: 100,
    md:   10,
    sm:   6,
  },
  font: {
    regular:  'NotoSansJP_400Regular',
    medium:   'NotoSansJP_500Medium',
    bold:     'NotoSansJP_700Bold',
    heavy:    'NotoSansJP_900Black',
    // aliasesで旧コードが壊れないよう
    semibold: 'NotoSansJP_700Bold',
  },
  home: {
    background: '#F4F1ED',
    card:       '#FFFFFF',
    pill:       '#EDE0D8',
    outline:    '#E4DDD6',
    accent:     '#CC4E1E',
    text:       '#18160F',
    textSoft:   '#564E44',
    activeTab:  '#E4DDD6',
    radius: {
      photo: 0,
      panel: 16,
      pill:  100,
    },
    shadow: {
      shadowColor:   '#18160F',
      shadowOffset:  { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius:  10,
      elevation:     3,
    },
  },
  shadow: {
    card: {
      shadowColor:   '#18160F',
      shadowOffset:  { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius:  10,
      elevation:     2,
    },
    float: {
      shadowColor:   '#18160F',
      shadowOffset:  { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius:  16,
      elevation:     8,
    },
  },
} as const;

export type DSColors = keyof typeof DS.colors;
