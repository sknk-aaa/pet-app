# まいにちペット — Claude 引き継ぎメモ

このドキュメントは次の会話で Claude がすぐに作業を再開できるように書いています。

---

## 現在の状態（2026-05-29）

| 項目 | 状態 |
|---|---|
| モバイルアプリ（apps/mobile） | 実装完了 |
| 管理画面（apps/admin） | 実装完了・Vercel デプロイ済み |
| Supabase Edge Functions | 6本デプロイ済み |
| pg_cron ジョブ | 4本登録済み |
| GitHub Pages | 有効化済み |
| App Store Connect | 登録済み（App ID: 6774140775） |
| RevenueCat | 設定済み・iap.ts に組み込み済み |
| 本番ビルド | Build 6 完了・TestFlight 配信済み |
| OTA アップデート | production ブランチで運用中 |
| App Store 審査申請 | **未申請（次にやること）** |

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
└── docs/OPERATIONS.md   # インフラ・証明書の長期運用手順
```

モノレポ: pnpm workspaces

---

## 次にやること

### 1. App Store 審査申請
```bash
cd /home/aaa/project/pet-app/apps/mobile
set -a && source .env && set +a
eas submit --platform ios
```

### 2. 審査結果を待つ（通常 1〜3 日）
- リジェクトされた場合: 内容を確認して修正 → 再申請
- JS のみの修正は OTA で対応可（新ビルド不要）
- ネイティブの変更が必要な場合は新ビルド必要

### 3. リリース後にやること
- App Store 審査用デモアカウント削除（`review@mainichipet.app`）
- 本番ユーザーが増えてきたら Supabase Pro プランへのアップグレードを検討
- `EXPO_ACCESS_TOKEN` が未登録の場合 Push 通知が届かない → Supabase Secrets に設定

---

## 重要な設定値

| 項目 | 値 |
|---|---|
| Bundle ID | `com.mainichipet.app` |
| App Store App ID | `6774140775` |
| EAS Project ID | `c1a5e2b7-800b-48d0-8d8f-ead54e05a1d9` |
| Apple Team ID | `3H2LBDNPMU` |
| Supabase Project Ref | `upshogdxxzwyauivmfxt` |
| IAP (月額) | `com.mainichipet.app.pro_monthly` |
| IAP (買い切り) | `com.mainichipet.app.pro_lifetime` |
| RevenueCat API Key (iOS) | `appl_lHwPpELBjlJuOpgASVhEKVliBOc` |
| 管理画面 URL | `https://admin-one-ivory-70.vercel.app` |
| GitHub Pages URL | `https://sknk-aaa.github.io/pet-app/` |

---

## ビルド・OTA の注意点

### EAS ビルドコマンド
```bash
cd apps/mobile
set -a && source .env && set +a
eas build --platform ios --profile production
```
`set -a && source .env && set +a` で環境変数を読み込んでからビルドする。

### OTA アップデート
JS のみの変更はビルド不要で即時配信できる。
```bash
cd apps/mobile
eas update --branch production --message "修正内容"
```
- `runtimeVersion: appVersion` を使用。`version: "1.0.0"` のまま変更しなければ OTA が適用される
- ネイティブモジュールの追加・変更は OTA 不可。新ビルドが必要

### パッケージ追加時のルール
**必ず `expo install` を使う。`pnpm add` で直接入れない。**
```bash
cd apps/mobile
npx expo install <package-name>
```

---

## Google ログインの実装について

`@react-native-google-signin` は raw nonce を JS に返さないため `supabase.auth.signInWithIdToken` で nonce エラーが発生する。
`expo-web-browser` + `supabase.auth.signInWithOAuth` を使ったブラウザ OAuth フローで解決済み。

- `src/services/auth.ts` の `signInWithGoogle` を参照
- ログイン後の遷移は `login.tsx` で `session` を監視して `router.dismiss()` で実行

---

## Supabase の状態

- マイグレーション適用済み（全テーブル・RLS）
- Edge Functions 6本デプロイ済み
- pg_cron ジョブ 4本登録済み
- Auth: Apple・Google（OAuth ブラウザフロー）・Email 設定済み
- Storage バケット: `featured-photos`・`featured-archive` 作成済み
- `EXPO_ACCESS_TOKEN`: Supabase Edge Functions Secrets に設定済み

---

## 管理画面

- **URL**: https://admin-one-ivory-70.vercel.app
- **認証**: `app_metadata.is_admin = true` で管理者判定
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
| 認証ロジック | `apps/mobile/src/services/auth.ts` |
| IAP / RevenueCat | `apps/mobile/src/services/iap.ts` |
| Push 通知 | `apps/mobile/src/services/notifications.ts` |
| DB スキーマ | `supabase/migrations/` |
| Edge Functions | `supabase/functions/` |
| 管理画面 Supabase クライアント | `apps/admin/src/lib/supabase/` |
| 運用手順 | `docs/OPERATIONS.md` |
