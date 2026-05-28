# AGENTS.md

このリポジトリは iPhone 向けペット写真日記アプリ「**まいにちペット**」の実装プロジェクトです。
v1.0 の実装は完了しています。新しい会話を始めるときはこのファイルと `HANDOFF.md` を最初に読んでください。

---

## プロジェクトの目的

ペットの写真を 1 日 1 枚記録し、カレンダーで見返し、希望者だけが「今日のペット」としてアプリ内に掲載される体験を提供します。

「1 日 1 枚、今日の渾身の一枚を残す」「カレンダーで成長や思い出を見返す」「連続記録で毎日の習慣にする」「希望した写真だけ今日のペットとして掲載候補にできる」の 4 点に集中します。健康管理アプリでも SNS でもありません。

---

## リポジトリ構成

```
pet-app/
├── apps/
│   ├── mobile/        Expo / React Native (iOS)
│   └── admin/         Next.js 15 管理画面（Vercel デプロイ済み）
├── supabase/
│   ├── migrations/    DB スキーマ・RLS・pg_cron
│   └── functions/     Edge Functions（6本、デプロイ済み）
├── docs/              設計仕様書（01〜09）
├── HANDOFF.md         現状・次にやること（短期引き継ぎ）
└── RUNBOOK.md         インフラ・証明書の長期運用手順
```

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| モバイル | Expo SDK 52 / React Native 0.76.9 / iOS Only |
| ルーティング | expo-router v4（ファイルベース） |
| 状態管理 | Zustand（appStore・authStore） |
| サーバーキャッシュ | TanStack Query v5 |
| ローカル DB | expo-sqlite（バージョン管理済みマイグレーション） |
| バックエンド | Supabase（Auth / PostgreSQL / Storage / Edge Functions） |
| SVG アイコン | react-native-svg（PawIcon・CrownIcon・SparklesIcon 等） |
| フォント | iOS システムフォント（カスタムフォントなし） |
| 管理画面 | Next.js 15 App Router / shadcn/ui / Tailwind |

---

## 画面構成

### タブ（常時表示）

| タブ | ファイル | 概要 |
|---|---|---|
| ホーム | `app/(tabs)/index.tsx` | 今日の記録カード・ストリーク（2日以上で表示） |
| カレンダー | `app/(tabs)/calendar.tsx` | 月別グリッド・月ナビ・stats バー |
| 今日のペット | `app/(tabs)/today-pet.tsx` | 今日選ばれたペット写真・リアクション |

ネイティブタブヘッダー（高さ 110px）にホーム・カレンダーは歯車ボタン（左）を配置。ホームはペットピル（右）、カレンダーはタイトル「カレンダー」を表示。今日のペットは `headerShown: false`。

### モーダル・スタック

| 画面 | ファイル | 概要 |
|---|---|---|
| 写真記録フォーム | `app/photo-form.tsx` | 撮影/選択・ペット選択・タグ・保存 |
| 日付詳細 | `app/day-detail.tsx` | 選択日の記録表示・編集 |
| 写真グリッド | `app/photo-grid.tsx` | 全記録を年月別グリッドで一覧 |
| 記念日一覧 | `app/anniversaries.tsx` | ペット別記念日タグ一覧 |
| ペット選択 | `app/pet-select.tsx` | ペット切り替え（Pro ゲート付き） |
| Pro 画面 | `app/pro.tsx` | Pro 機能紹介・購入・復元 |
| ログイン | `app/login.tsx` | Apple / Google / Email 認証 |
| ログイン促進 | `app/login-prompt.tsx` | 初回記録後のログイン誘導 |
| オンボーディング | `app/onboarding.tsx` | 初回起動・ペット登録フロー |
| ペット設定 | `app/pet-setup.tsx` | ペット情報入力 |
| 通報 | `app/report.tsx` | 今日のペット写真を通報 |
| 設定 | `app/settings/index.tsx` | ログイン状態・ペット・通知・Pro |
| ペット管理 | `app/settings/pets.tsx` | ペット一覧・追加・編集 |

---

## 機能一覧

### 記録
- 1日1枚の写真記録（撮影 or アルバム選択）
- **ペット別記録**: `entries.primary_pet_id` で管理。ペットを切り替えると別の日記として独立
- タイトル・メモ・タグ（プリセット + 自由入力記念日タグ）
- カメラロール自動保存（設定で ON/OFF）

### カレンダー
- 月別グリッド（グリッド線あり、右端=土曜は線なし）
- ペット別フィルター（selectedPetId で絞り込み）
- 月ナビ・月選択ピッカー・「今日へ」ボタン
- stats バー（連続記録日数・今月の記録数）

### 今日のペット
- `public_featured_pet_today` ビュー（Supabase）から取得
- リアクション 4種（かわいい・きれい・かっこいい・いいね）
- 通報機能

### Pro 機能（月額 ¥400 / 買い切り ¥1,500）
- 2匹目以降のペット登録（無料: 1匹、Pro: 無制限）
- ペット別カレンダー
- ペット別記念日一覧

### 認証
- Apple Sign In / Google Sign In / メール認証
- ゲストモード（未ログインで全機能利用可、バックアップなし）
- 初回記録後にログイン促進画面

---

## データ設計

### ローカル（SQLite）
- `pets` テーブル: ペット情報
- `entries` テーブル: 日記記録。`primary_pet_id` でペット別管理。`UNIQUE(date, primary_pet_id)`
- `entry_pets` テーブル: 写真に写っているペット（複数可）
- マイグレーション: `src/db/migrations/` にバージョン管理

### サーバー（Supabase）
- `users`: ユーザープロフィール・`is_admin`・`push_token`
- `pets`: サーバー側ペット情報
- `featured_candidates`: 今日のペット投稿候補（`status`: pending → scheduled → approved → featured）
- `featured_pets`: 掲載済み記録（`public_featured_pet_today` ビューで公開）
- Storage: `featured-photos`（一時）・`featured-archive`（永続）

---

## デザイントークン（`src/theme.ts`）

| 変数 | 値 | 用途 |
|---|---|---|
| `DS.colors.accent` | `#F07040` | メインオレンジ |
| `DS.colors.bg` | `#FAF6F0` | 背景 |
| `DS.colors.card` | `#FFFFFF` | カード背景 |
| `DS.colors.pawWarm` | `#FFD4B8` | PetAvatar 背景色 |
| `DS.colors.text` | `#3B2314` | 本文 |
| `DS.colors.textMid` | `#8B6347` | サブテキスト |
| `DS.colors.peach` | ― | Pro カード・info カード背景 |

---

## Edge Functions（Supabase、6本）

| 関数名 | トリガー | 処理 |
|---|---|---|
| `select-candidate` | Cron 23:00 JST | 翌日掲載候補を重み付き抽選 |
| `publish-featured` | Cron 07:00 JST | 掲載・Storage アーカイブ・Push 通知 |
| `cleanup-candidates` | Cron 00:10 JST | 前日候補の Storage 削除 |
| `send-featured-push` | `publish-featured` から呼び出し | Push 通知送信 |
| `withdraw-candidate` | アプリから呼び出し | 投稿取り下げ |
| `delete-my-account` | アプリから呼び出し | アカウント・全データ削除 |

---

## 重要な制約・注意事項

- **iOS のみ**。Android 対応なし
- **タイムゾーン**: Asia/Tokyo 固定。「今日」の判定は JST
- **フォント**: カスタムフォント不使用。iOS システムフォントに任せる。`fontFamily` を指定しない
- **パッケージ追加**: `npx expo install` を使う。`pnpm add` 直接は Expo SDK 互換性が壊れる
- **expo-iap**: バージョン `2.9.7` 固定（それ以外はビルドエラー）
- **EAS ビルド**: `set -a && source .env && set +a` で環境変数を手動ロードしてから実行
- **コメント**: 原則不要。意図がコードだけでは伝わらない場合のみ書く
- **`any` 禁止**。TypeScript の型安全性を優先する

---

## 前提環境

- 開発環境: WSL (Ubuntu on Windows)
- 配布先: App Store (iPhone のみ)
- 想定ユーザー: 日本のユーザー（UI 文言は日本語）
- 課金: Apple In-App Purchase（月額 ¥400 / 買い切り ¥1,500）
