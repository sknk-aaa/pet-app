import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { setSetting } from '@/db/settings';
import { DS } from '@/theme';

const SLIDES = [
  {
    emoji:    '📷',
    title:    '1日1枚、うちの子を残す',
    subtitle: '毎日の渾身の1枚を日記として記録しましょう',
    gradient: ['#FEF0E5', '#FAF7F2'] as [string, string],
  },
  {
    emoji:    '📅',
    title:    'カレンダーで成長を見返せる',
    subtitle: '写真がカレンダーに並び、成長の記録を振り返れます',
    gradient: ['#EBF4EA', '#FAF7F2'] as [string, string],
  },
  {
    emoji:    '⭐',
    title:    '希望した写真だけ、今日のペットに参加できる',
    subtitle: '選ばれたら、みんなからリアクションが届きます',
    gradient: ['#FDEADA', '#FAF7F2'] as [string, string],
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = async (href: string) => {
    await setSetting('onboarding_completed', 'true').catch(() => {});
    router.replace(href as '/pet-setup');
  };

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (activeIndex + 1), animated: true });
    } else {
      goTo('/pet-setup');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Skip */}
      <TouchableOpacity style={styles.skip} onPress={() => goTo('/pet-setup')}>
        <Text style={styles.skipText}>スキップ</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, idx) => (
          <LinearGradient
            key={idx}
            colors={slide.gradient}
            style={[styles.slide, { width }]}
          >
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {activeIndex < SLIDES.length - 1 ? '次へ' : 'はじめる'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: DS.colors.bg,
  },
  skip: {
    position:  'absolute',
    top:       60,
    right:     20,
    zIndex:    10,
    padding:   8,
  },
  skipText: {
    fontSize: 14,
    color:    DS.colors.textMid,
  },
  slide: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap:            24,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    fontSize:   26,
    fontWeight: '700',
    color:      DS.colors.text,
    textAlign:  'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize:   15,
    color:      DS.colors.textMid,
    textAlign:  'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            8,
    paddingVertical: 20,
  },
  dot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: DS.colors.border,
  },
  dotActive: {
    backgroundColor: DS.colors.accent,
    width:           20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom:     24,
  },
  button: {
    backgroundColor: DS.colors.accent,
    borderRadius:    DS.radius.pill,
    paddingVertical: 16,
    alignItems:      'center',
    ...DS.shadow.float,
  },
  buttonText: {
    color:      '#fff',
    fontSize:   17,
    fontWeight: '700',
  },
});
