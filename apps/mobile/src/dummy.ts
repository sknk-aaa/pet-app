export const DUMMY_PET = {
  id: '1',
  name: 'まる',
  species: 'ねこ',
  gender: 'メス',
  birthday: '2025-05-03',
};

export const DUMMY_ENTRY = {
  id: 'e1',
  title: '今日はいい顔してる',
  memo: '窓辺でうとうとしてた。起きた瞬間に撮れた1枚。',
  tag: 'おでかけ' as string | null,
  featured: true,
  featuredStatus: 'pending' as 'pending' | 'approved' | 'scheduled' | 'featured' | null,
  date: '2026-05-27',
};

export const DUMMY_MEMORY = {
  id: 'm1',
  title: 'ひなたでお昼寝',
  date: '2025-05-27',
};

export const DUMMY_STREAK = 13;

// 2026年5月: 1日は金曜日 (getDay() = 5)
export const DUMMY_CALENDAR = {
  year: 2026,
  month: 5,
  startDay: 5,
  totalDays: 31,
  today: 27,
  photoDays:       new Set(Array.from({ length: 27 }, (_, i) => i + 1)),
  anniversaryDays: new Set([5, 23]),
  featuredDays:    new Set([16]),
};

export const DUMMY_TODAYS_PET = {
  id: 'fp1',
  name: 'こむぎ',
  title: 'ひなたぼっこ中',
  reactions: {
    cute:      128,
    beautiful:  24,
    cool:        8,
    like:       45,
  } as Record<string, number>,
};

export const DUMMY_ANNIVERSARIES = [
  { id: 'a1', tag: '誕生日',         date: '2026-05-03', title: 'うちの子1歳!' },
  { id: 'a2', tag: 'はじめて',       date: '2025-12-24', title: '雪と初対面'    },
  { id: 'a3', tag: 'うちの子記念日', date: '2025-06-15', title: 'おうちに来た日' },
];

export const DUMMY_FEATURED_HISTORY = [
  { id: 'fh1', date: '2026-05-20', title: '日向ぼっこ中のまる', reactions: { cute: 128, beautiful: 12, cool: 4, like: 38 } },
  { id: 'fh2', date: '2026-04-03', title: 'お昼寝タイム',       reactions: { cute:  18, beautiful:  4, cool: 2, like: 10 } },
];

export const REACTION_LABELS: Record<string, string> = {
  cute:      'かわいい',
  beautiful: 'きれい',
  cool:      'かっこいい',
  like:      'いいね',
};

export const SPECIES_OPTIONS = ['ねこ', 'いぬ', 'インコ', 'うさぎ', 'ハムスター', 'その他'] as const;
export const GENDER_OPTIONS  = ['オス', 'メス', '不明'] as const;
export const TAG_OPTIONS      = ['誕生日', 'うちの子記念日', 'はじめて', 'おでかけ', 'その他'] as const;

export const REPORT_REASON_LABELS: Record<string, string> = {
  inappropriate: '不適切な内容',
  privacy:       'プライバシーの懸念',
  copyright:     '著作権の問題',
  other:         'その他',
};
