import type { PetSpecies, PetGender, AnniversaryTagType } from '@/types';

// species: DB英語値 ↔ UI日本語値
export const SPECIES_DB_TO_DISPLAY: Record<PetSpecies, string> = {
  cat:     'ねこ',
  dog:     'いぬ',
  bird:    'インコ',
  rabbit:  'うさぎ',
  hamster: 'ハムスター',
  other:   'その他',
};

export const SPECIES_DISPLAY_TO_DB: Record<string, PetSpecies> = {
  ねこ:       'cat',
  いぬ:       'dog',
  インコ:     'bird',
  うさぎ:     'rabbit',
  ハムスター: 'hamster',
  その他:     'other',
};

// gender: DB英語値 ↔ UI日本語値
export const GENDER_DB_TO_DISPLAY: Record<PetGender, string> = {
  male:    'オス',
  female:  'メス',
  unknown: '不明',
};

export const GENDER_DISPLAY_TO_DB: Record<string, PetGender> = {
  オス: 'male',
  メス: 'female',
  不明: 'unknown',
};

// anniversary_tag_type: DB英語値 ↔ UI日本語値
export const ANNIVERSARY_TAG_DB_TO_DISPLAY: Record<AnniversaryTagType, string> = {
  birthday: '誕生日',
  memorial: 'うちの子記念日',
  first:    'はじめて',
  outing:   'おでかけ',
  other:    'その他',
};

export const ANNIVERSARY_TAG_DISPLAY_TO_DB: Record<string, AnniversaryTagType> = {
  誕生日:           'birthday',
  うちの子記念日:   'memorial',
  はじめて:         'first',
  おでかけ:         'outing',
  その他:           'other',
};

// species に対応する絵文字
export const SPECIES_EMOJI: Record<PetSpecies, string> = {
  cat:     '🐱',
  dog:     '🐶',
  bird:    '🦜',
  rabbit:  '🐰',
  hamster: '🐹',
  other:   '🐾',
};

export function speciesEmoji(species: PetSpecies | string): string {
  return SPECIES_EMOJI[species as PetSpecies] ?? '🐾';
}
