# まいにちペット — 運用ランブック

インフラ・認証・証明書の長期管理用ドキュメント。

---

## インフラ全体像

```
iPhone アプリ（Expo / React Native）
  │
  ├─── Supabase（バックエンド）
  │      ├── PostgreSQL（全データ）
  │      ├── Storage（ペット写真）
  │      ├── Auth（Apple / Google）
  │      ├── Edge Functions（5本）
  │      └── pg_cron（毎日の自動処理）
  │
  ├─── Expo Push API → APNs → iPhone
  │
  └─── 管理画面（Next.js on Vercel）
```

---

## アカウント・認証情報

### Apple Developer
- **URL**: https://developer.apple.com
- **Team ID**: `3H2LBDNPMU`
- **費用**: ¥13,800/年
- **更新**: 加入日の 1 ヶ月前にメールが届く。更新しないと App Store から削除される

### Expo / EAS
- **URL**: https://expo.dev
- **アカウント**: s-knk
- **Project ID**: `c1a5e2b7-800b-48d0-8d8f-ead54e05a1d9`
- 無料枠: 月 30 ビルド

### Supabase
- **URL**: https://supabase.com/dashboard
- 無料プランは非アクティブ（7 日間アクセスなし）で一時停止。定期的にダッシュボードかアプリを使えば復帰

### Vercel（管理画面）
- **URL**: https://vercel.com/dashboard
- 無料枠で運用可能

---

## 更新・期限管理

### Apple Developer Program（毎年）
- 期限: 加入から 1 年（メールで通知あり）
- 更新しないと: App Store 掲載停止・新規ビルド不可
- 更新場所: https://developer.apple.com → アカウント → メンバーシップ

### iOS Distribution 証明書（最長 1 年）
- EAS 管理の場合は自動更新される
- 確認方法:
  ```bash
  cd apps/mobile
  eas credentials
  ```
  → iOS → 証明書の Expiry を確認

### APNs Key（有効期限なし）
- Key ID: `RPB9LP5UC7`
- 削除・再作成した場合は Supabase の Push 設定を更新する
  - Dashboard → Project Settings → Edge Functions の Secret に `EXPO_ACCESS_TOKEN` を再設定

### Google OAuth（有効期限なし）
- Google Cloud Console でプロジェクトを削除しない限り有効
- Client ID / Secret の確認: https://console.cloud.google.com → 認証情報
- **注意**: Google Cloud プロジェクトに「未確認アプリ」の警告が出る場合は OAuth 同意画面の審査が必要

### Supabase JWT Secret（更新不要）
- ローテーションした場合は全ユーザーがログアウトされる（基本触らない）

---

## Supabase 管理

### 定期確認項目（月 1 回程度）
- Dashboard → Logs → Edge Functions でエラーがないか確認
- `featured_pets` テーブルで毎日掲載されているか確認
- Storage 使用量の確認（無料枠: 1GB）

### Edge Functions（毎日の自動処理）

| 関数名 | 実行時刻 (JST) | 処理内容 |
|---|---|---|
| select-candidate | 23:00 | 翌日分の候補を重み付きランダムで選出 |
| publish-featured | 07:00 | 掲載・アーカイブ・Push 通知送信 |
| cleanup-candidates | 00:10 | 前日以前の候補画像を Storage から削除 |

pg_cron の確認（Supabase SQL Editor）:
```sql
SELECT * FROM cron.job;
```

### バックアップ
```
# 手動バックアップ
Dashboard → Settings → Database → Create a new backup
```
有料プランにすると毎日自動バックアップ。

### ストレージ管理
- `featured-photos` バケット: 候補投稿時の一時保存（cleanup-candidates で自動削除）
- `featured-archive` バケット: 掲載済み写真（永続保存・削除しない）

---

## アプリのアップデート手順

### コードのみの変更（OTA アップデート）
ネイティブコード・パッケージを変更しない場合。即時配信・審査不要。
```bash
cd apps/mobile
eas update --branch production --message "修正内容"
```

### パッケージ追加・ネイティブ変更がある場合
新ビルドが必要。App Store の審査（通常 1〜3 日）が入る。
```bash
cd apps/mobile
EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile production
eas submit --platform ios
```

### Expo SDK バージョンアップ（半年〜1 年に 1 回）
1. [expo.fyi/changelog](https://expo.fyi/changelog) でマイグレーションガイドを確認
2. `npx expo install expo@<新バージョン>`
3. `npx expo install --fix` で全パッケージを新 SDK 互換バージョンに揃える
4. `pnpm typecheck` でエラーがないか確認
5. EAS development build でテストしてから production build

---

## 障害対応

### 今日のペットが更新されない
1. Supabase → Logs → Edge Functions で `publish-featured` のエラーを確認
2. `featured_candidates` に `status='approved'` の昨日分データがあるか確認
3. pg_cron が動いているか確認: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Push 通知が届かない
1. Edge Functions → `send-featured-push` のログでエラー確認
2. Supabase の Secret に `EXPO_ACCESS_TOKEN` があるか確認
3. `users` テーブルの `push_token` が NULL になっていないか確認
4. `DeviceNotRegistered` エラーが出ている場合はトークン失効（自動で NULL に更新される）

### Apple Sign In でログインできない
1. Supabase → Authentication → Providers → Apple が有効か確認
2. Client IDs に `com.mainichipet.app` が入っているか確認
3. Secret Key は**空欄**であることを確認（JWT 形式のキーは不要）

### Google Sign In でログインできない
1. Supabase → Authentication → Providers → Google が有効か確認
2. Google Cloud Console で OAuth クライアントがアクティブか確認
3. Supabase の Callback URL が Google Console の「承認済みリダイレクト URI」に登録されているか確認

### App Store からアプリが消えた
→ Apple Developer Program の更新忘れの可能性。developer.apple.com でメンバーシップを確認。

---

## 管理画面の日常運用

毎日の流れ:
1. `select-candidate`（23:00 自動）が翌日候補を選出
2. 管理者が管理画面の「レビュー」で承認 or 差し替え
3. `publish-featured`（07:00 自動）が掲載・通知送信

通報対応:
- 管理画面 → 通報一覧 → 内容確認 → 対応済み / 写真非表示 / BAN

---

## 環境変数まとめ

### EAS Secrets（モバイルアプリ）
```
SUPABASE_URL
SUPABASE_ANON_KEY
```
確認・追加: `eas secret:list` / `eas secret:create`

### Vercel（管理画面）
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Supabase Edge Functions Secrets
```
EXPO_ACCESS_TOKEN   # Expo Push API 用（手動設定が必要）
```
設定場所: Supabase Dashboard → Project Settings → Edge Functions → Secrets
