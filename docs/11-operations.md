# 運用ガイド — まいにちペット

長期運用（数か月〜数年）に向けた作業リスト・更新スケジュール・インフラ情報。

---

## リリースまでの残タスク

### 実機テスト（開発ビルド）
- [ ] Apple Sign In でログイン確認
- [ ] Google Sign In でログイン確認
- [ ] ペット登録・写真撮影・カレンダー確認
- [ ] 今日のペット応募（候補投稿フロー）
- [ ] Pro 購入フロー（Sandbox アカウントで）
- [ ] Push 通知の受信確認
- [ ] 管理画面へのアクセス確認

### App Store Connect 設定
1. [App Store Connect](https://appstoreconnect.apple.com) → マイ App → 新規 App
   - Bundle ID: `com.mainichipet.app`
   - SKU: 任意（例: `mainichipet-001`）
2. アプリ情報・スクリーンショット・プライバシーポリシー URL を入力
3. In-App Purchase 登録:
   - `com.mainichipet.app.pro_monthly`（自動更新サブスク・¥480/月）
   - `com.mainichipet.app.pro_lifetime`（消耗しない・任意価格）
4. Sandbox テスターアカウントを作成して IAP をテスト

### 本番ビルド・申請
```bash
cd apps/mobile

# 本番ビルド
eas build --platform ios --profile production

# App Store 申請
eas submit --platform ios
```

### 管理画面（Vercel）デプロイ
```bash
# Vercel CLI でデプロイ
cd apps/admin
npx vercel --prod
```
- 環境変数（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）を Vercel に設定
- 管理者ユーザーに `is_admin = true` を付与（Supabase SQL Editor）

---

## インフラ構成

```
[iOS App]
  ↓ Supabase JS SDK
[Supabase]
  ├── PostgreSQL（ユーザー・ペット・写真・通報データ）
  ├── Storage（featured-photos, featured-archive バケット）
  ├── Auth（Apple / Google OAuth）
  ├── Edge Functions（select-candidate, publish-featured など）
  └── pg_cron（毎日の定期実行）
      ├── 23:00 JST → select-candidate（候補選出）
      ├── 07:00 JST → publish-featured（掲載）
      └── 00:10 JST → cleanup-candidates（古い画像削除）

[Admin Panel] → Vercel → Supabase

[Push 通知] → Expo Push API → APNs → iPhone
```

---

## 定期更新・更新期限

### Apple Developer Program（毎年更新）
- **期限**: 加入日から 1 年
- **更新しないと**: App Store から削除、ビルドが失敗
- **更新手順**: [developer.apple.com](https://developer.apple.com) → アカウント → メンバーシップ
- **費用**: ¥13,800/年（2025年時点）

### Apple Distribution 証明書（最長 1 年）
- EAS が管理する場合は EAS が自動更新する（`eas credentials` で確認可）
- 手動管理の場合: Apple Developer Console → Certificates, Identifiers & Profiles
- **期限切れ前に**: `eas credentials` → iOS → 証明書の状態を確認

### Apple Push Notification（APNs）Key
- **有効期限なし**（Key を削除しない限り有効）
- Key ID: `RPB9LP5UC7`
- 削除した場合は Supabase の Push 設定を更新が必要

### Google OAuth クライアント
- **有効期限なし**（削除・無効化しない限り有効）
- Client ID は [Google Cloud Console](https://console.cloud.google.com) で確認可能
- プロジェクト削除に注意

### Supabase（無料プランの場合）
- **非アクティブ判定**: 7 日間アクセスなし → プロジェクトが一時停止
- 対処: Dashboard にログインするかアプリを使えば復帰
- 有料プランにするとポーズなし（$25/月〜）
- データバックアップ: Dashboard → Settings → Database → Backups

### EAS Build クレジット
- 無料枠: 月 30 ビルド（2025年時点）
- 開発中に多く消費した場合は有料プランへ

---

## 障害対応チェックリスト

### アプリが起動しない
1. Supabase プロジェクトが停止していないか確認（Dashboard）
2. `SUPABASE_URL` / `SUPABASE_ANON_KEY` が正しいか確認
3. EAS ダッシュボードで最新ビルドのステータス確認

### 今日のペットが更新されない
1. Supabase → Edge Functions → ログで `select-candidate` / `publish-featured` の実行を確認
2. pg_cron の設定確認: Dashboard → Extensions → pg_cron
3. `featured_candidates` テーブルに `status='pending'` のデータがあるか確認

### Push 通知が届かない
1. `send-featured-push` の Edge Function ログを確認
2. `EXPO_ACCESS_TOKEN` が Edge Functions の Secrets に設定されているか確認
3. `users.push_token` が NULL になっていないか確認
4. Expo Push API のレスポンスで `DeviceNotRegistered` が返っている場合はトークンが失効

### IAP（課金）が機能しない
1. App Store Connect で IAP プロダクトの審査状況を確認
2. Sandbox アカウントでテスト
3. `expo-iap` のバージョンが v2.9.7 であることを確認（それ以外はビルドエラーのリスクあり）

---

## アップデート手順

### アプリのアップデート（OTA: コードのみ変更）
ネイティブコードやパッケージを変更しない場合は EAS Update で即時配信可能。
```bash
cd apps/mobile
eas update --branch production --message "バグ修正"
```

### アプリのアップデート（ネイティブ変更あり）
新ビルドが必要。
```bash
eas build --platform ios --profile production
eas submit --platform ios
```
その後 App Store Connect で審査提出（通常 1〜3 日）。

### Expo SDK バージョンアップ
必ず公式マイグレーションガイドに従う。
- [expo.fyi/changelog](https://expo.fyi/changelog)
- **パッケージ更新時は必ず `npx expo install --fix` で互換バージョンに揃える**
- `pnpm add <pkg>` を直接使うと非互換バージョンが入る場合があるので注意

---

## 管理画面の使い方

URL: Vercel のデプロイ URL（例: `https://mainichi-pet-admin.vercel.app`）

| 画面 | 用途 |
|---|---|
| ダッシュボード | 統計確認（ユーザー数・投稿数など） |
| レビュー | 翌日掲載候補の承認・却下 |
| 候補一覧 | 投稿された候補の管理 |
| 掲載履歴 | 過去の「今日のペット」一覧 |
| 通報一覧 | 通報対応（対応済み・非表示・BAN） |
| ユーザー管理 | ユーザー BAN・管理者権限付与 |

### 毎日の運用フロー
1. 23:00 JST: `select-candidate` が自動実行 → 翌日候補を選出
2. 管理者が「レビュー」画面で承認または差し替え
3. 07:00 JST: `publish-featured` が自動実行 → 掲載・Push 通知送信

---

## データバックアップ

### Supabase（自動）
- 有料プランは毎日自動バックアップ
- 無料プランは手動: Dashboard → Settings → Database → Create backup

### ストレージ（Storage）
- Supabase Storage は現時点では自動バックアップなし
- 必要に応じて手動で `featured-archive` バケットをダウンロード

---

## 重要なファイル・設定の場所

| 内容 | 場所 |
|---|---|
| アプリ設定 | `apps/mobile/app.config.ts` |
| EAS 設定 | `apps/mobile/eas.json` |
| DB スキーマ | `supabase/migrations/` |
| Edge Functions | `supabase/functions/` |
| 管理画面 | `apps/admin/src/` |
| IAP サービス | `apps/mobile/src/services/iap.ts` |
| Push 通知 | `apps/mobile/src/services/notifications.ts` |

---

## 連絡先・アカウント

| サービス | URL |
|---|---|
| Apple Developer | https://developer.apple.com |
| App Store Connect | https://appstoreconnect.apple.com |
| Google Cloud Console | https://console.cloud.google.com |
| Supabase Dashboard | https://supabase.com/dashboard |
| Expo Dashboard | https://expo.dev |
| Vercel Dashboard | https://vercel.com/dashboard |
