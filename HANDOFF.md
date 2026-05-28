# まいにちペット — Claude 引き継ぎメモ

このドキュメントは次の会話で Claude がすぐに作業を再開できるように書いています。

---

## 現在の状態（2026-05-28）

| 項目 | 状態 |
|---|---|
| モバイルアプリ（apps/mobile） | 実装完了。EAS 開発ビルド済み |
| 管理画面（apps/admin） | 実装完了・Vercel デプロイ済み |
| Supabase Edge Functions | 6本デプロイ済み |
| pg_cron ジョブ | 4本登録済み |
| GitHub Pages | docs/ 作成済み。GitHub 側で Pages 有効化が必要 |
| App Store Connect | 未登録 |
| RevenueCat | 未設定 |
| 本番ビルド | 未実施 |

---

## リポジトリ構成

```
pet-app/
├── apps/
│   ├── mobile/          # Expo / React Native (iOS)
│   └── admin/           # Next.js 15 管理画面
├── supabase/
│   ├── migrations/      # DB スキーマ
│   └── functions/       # Edge Functions (6本)
├── docs/                # 仕様書 (01〜09) + GitHub Pages (index.html, privacy/)
└── RUNBOOK.md           # インフラ・証明書の長期運用手順
```

モノレポ: pnpm workspaces

---

## 次にやること（優先順）

### 1. EAS Secret の更新（ビルド前に必須）
```bash
cd apps/mobile
eas env:update --name GOOGLE_IOS_CLIENT_ID --value "94094269194-m2ok6ukjulc9ke9nofnoe7t62a8bh2lo.apps.googleusercontent.com"
```
→ visibility を聞かれたら **Secret** を選ぶ（Plain text では失敗する）

### 2. GitHub Pages の有効化
https://github.com/sknk-aaa/pet-app → Settings → Pages → Source: `main` branch / `/docs` フォルダ

### 3. EAS 開発ビルドで実機テスト
```bash
cd apps/mobile
set -a && source .env && set +a
eas build --profile development --platform ios
```

確認すべき機能:
- Apple Sign In / Google Sign In / メール認証
- ペット登録・写真撮影・カレンダー
- ペット別記録（複数ペット切り替え）
- 今日のペット画面（表示・リアクション）
- 設定画面（ログイン状態・各リンク）
- Push 通知受信

### 4. App Store Connect 設定
1. [App Store Connect](https://appstoreconnect.apple.com) → 新規 App
   - Bundle ID: `com.mainichipet.app`
2. In-App Purchase を登録:
   - `com.mainichipet.app.pro_monthly`（自動更新サブスク・¥400/月）
   - `com.mainichipet.app.pro_lifetime`（非消耗型・¥1,500）
3. 登録後に `apps/mobile/app/settings/index.tsx` の `__APP_ID__` を実際の App ID に置き換える

### 5. RevenueCat 設定
App Store Connect で IAP 登録後:
- `react-native-purchases` を追加
- `apps/mobile/src/services/iap.ts` を RevenueCat SDK に切り替える

### 6. 本番ビルド・申請
```bash
cd apps/mobile
set -a && source .env && set +a
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
| Supabase Project Ref | `upshogdxxzwyauivmfxt` |
| IAP (月額) | `com.mainichipet.app.pro_monthly` |
| IAP (買い切り) | `com.mainichipet.app.pro_lifetime` |
| 管理画面 URL | `https://admin-one-ivory-70.vercel.app` |
| GitHub Pages URL | `https://sknk-aaa.github.io/pet-app/` |

---

## ビルド時の注意点

### EAS ビルドコマンド
```bash
cd apps/mobile
set -a && source .env && set +a
eas build --platform ios --profile development
eas build --platform ios --profile production
```
`set -a && source .env && set +a` で環境変数を読み込んでからビルドする。
`EXPO_NO_DOTENV=1` の影響で env を手動ロードが必要。

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
絶対に `pnpm add expo-iap@latest` しない。

| バージョン | ビルドエラーの内容 |
|---|---|
| 1.0.4 | Swift access control error |
| 3.1.37〜 | `receiptValidationProps` not in openiap pod |
| 3.2.0〜4.x | `Constant` (Expo SDK 53+ 専用の Swift DSL) |
| **2.9.7** | ✅ 問題なし |

---

## Supabase の状態

- マイグレーション適用済み（全テーブル・RLS）
- Edge Functions 6本デプロイ済み
- pg_cron ジョブ 4本登録済み（`cron.job` テーブルで確認可）
- Auth: Apple・Google・Email 設定済み
- Storage バケット: `featured-photos`・`featured-archive` 作成済み
- `EXPO_ACCESS_TOKEN` は Supabase Edge Functions Secrets に**未設定**（Push 通知に必要）

---

## 管理画面

- **URL**: https://admin-one-ivory-70.vercel.app
- **認証**: `app_metadata.is_admin = true` で管理者判定（DB の `users.is_admin` ではない）
- **データ取得**: `SUPABASE_SERVICE_ROLE_KEY` を使う `createAdminClient` で RLS バイパス

管理者権限の付与方法:
```bash
curl -X PUT https://upshogdxxzwyauivmfxt.supabase.co/auth/v1/admin/users/<USER_ID> \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"app_metadata":{"is_admin":true}}'
```

---

## 主要ファイルの場所

| 内容 | パス |
|---|---|
| アプリ設定 | `apps/mobile/app.config.js` |
| EAS 設定 | `apps/mobile/eas.json` |
| IAP ロジック | `apps/mobile/src/services/iap.ts` |
| Push 通知 | `apps/mobile/src/services/notifications.ts` |
| Supabase クライアント | `apps/mobile/src/services/supabase.ts` |
| DB スキーマ | `supabase/migrations/` |
| Edge Functions | `supabase/functions/` |
| 管理画面 Supabase クライアント | `apps/admin/src/lib/supabase/` |
| 仕様書 | `docs/01-overview.md` 〜 `docs/09-edge-cases.md` |
| 運用手順 | `RUNBOOK.md` |
