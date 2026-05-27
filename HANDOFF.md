# まいにちペット — Claude 引き継ぎメモ

このドキュメントは次の会話で Claude がすぐに作業を再開できるように書いています。

---

## 現在の状態（2026-05）

- **開発ビルド: 成功済み**（EAS development build）
- iOS 実機へのインストールが可能な状態
- 管理画面（apps/admin）は実装済みだが Vercel 未デプロイ

---

## リポジトリ構成

```
pet-app/
├── apps/
│   ├── mobile/          # Expo / React Native (iOS)
│   └── admin/           # Next.js 15 管理画面
├── supabase/
│   ├── migrations/      # DB スキーマ
│   └── functions/       # Edge Functions (5本)
└── docs/                # 仕様書 (01〜09)
```

モノレポ: pnpm workspaces

---

## 次にやること（優先順）

### 1. 実機テスト（開発ビルド）
EAS のビルドページから `.ipa` リンクを取得し、iPhone の Safari で開いてインストール。

確認すべき機能:
- Apple Sign In / Google Sign In
- ペット登録・写真撮影・カレンダー
- 今日のペット応募フロー
- Pro 購入（Sandbox アカウントで）
- Push 通知受信

### 2. App Store Connect 設定
1. [App Store Connect](https://appstoreconnect.apple.com) → 新規 App
   - Bundle ID: `com.mainichipet.app`
2. In-App Purchase を登録:
   - `com.mainichipet.app.pro_monthly`（自動更新サブスク）
   - `com.mainichipet.app.pro_lifetime`（非消耗型）
3. Sandbox テスターで IAP をテスト

### 3. 管理画面デプロイ（Vercel）
```bash
cd apps/admin
npx vercel --prod
# 環境変数: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```
デプロイ後、Supabase SQL Editor で管理者ユーザーに `is_admin = true` を付与。

### 4. 本番ビルド・申請
```bash
cd apps/mobile
eas build --platform ios --profile production
eas submit --platform ios
```

---

## 重要な設定値

| 項目 | 値 |
|---|---|
| Bundle ID | `com.mainichipet.app` |
| EAS Project ID | `c1a5e2b7-800b-48d0-8d8f-ead54e05a1d9` |
| Apple Team ID | `3H2LBDNPMU` |
| IAP (月額) | `com.mainichipet.app.pro_monthly` |
| IAP (買い切り) | `com.mainichipet.app.pro_lifetime` |

---

## ビルド時の注意点

### EAS ビルドコマンド
```bash
cd apps/mobile
EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile development
EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile production
```
`EXPO_NO_CAPABILITY_SYNC=1` は Apple ID Auth の capability sync エラーを回避するため必須。

### パッケージ追加時のルール
**必ず `expo install` を使う。`pnpm add` で直接入れない。**
```bash
cd apps/mobile
npx expo install <package-name>
```
`pnpm add` を使うと Expo SDK 52 と非互換なバージョンが入り、Xcode ビルドが壊れる。

確認コマンド:
```bash
npx expo install --check   # 非互換を表示
npx expo install --fix     # 一括修正
```

### expo-iap のバージョン固定
Expo SDK 52 で動く唯一の安全バージョンは **v2.9.7**。
絶対に `pnpm add expo-iap@latest` しない。理由は下記。

| バージョン | ビルドエラーの内容 |
|---|---|
| 1.0.4 | Swift access control error |
| 3.1.37〜 | `receiptValidationProps` not in openiap pod |
| 3.2.0〜4.x | `Constant` (Expo SDK 53+ 専用の Swift DSL) |
| **2.9.7** | ✅ 問題なし |

---

## Supabase の状態

- マイグレーション適用済み（全テーブル・RLS・pg_cron）
- Edge Functions 5 本のコード実装済み（デプロイ状況は要確認）
- Auth: Apple（native）・Google（Web application type）設定済み
- Storage バケット: `featured-photos`・`featured-archive` 作成済み（要確認）

Edge Functions のデプロイ（未実施の場合）:
```bash
supabase functions deploy select-candidate
supabase functions deploy publish-featured
supabase functions deploy cleanup-candidates
supabase functions deploy send-featured-push
supabase functions deploy withdraw-candidate
```

---

## 主要ファイルの場所

| 内容 | パス |
|---|---|
| アプリ設定 | `apps/mobile/app.config.ts` |
| EAS 設定 | `apps/mobile/eas.json` |
| IAP ロジック | `apps/mobile/src/services/iap.ts` |
| Push 通知 | `apps/mobile/src/services/notifications.ts` |
| Supabase クライアント | `apps/mobile/src/services/supabase.ts` |
| DB スキーマ | `supabase/migrations/` |
| Edge Functions | `supabase/functions/` |
| 仕様書 | `docs/01-overview.md` 〜 `docs/09-edge-cases.md` |
