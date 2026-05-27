# セットアップ記録 — まいにちペット

開発ビルド成功まで（2026-05）の作業記録。同じ環境を再構築するときの参照用。

---

## 環境・アカウント情報

| 項目 | 値 |
|---|---|
| アプリ名 | まいにちペット |
| Bundle ID | `com.mainichipet.app` |
| Expo Slug | `mainichi-pet` |
| URL Scheme | `mainichipet` |
| EAS Project ID | `c1a5e2b7-800b-48d0-8d8f-ead54e05a1d9` |
| Apple Team ID | `3H2LBDNPMU` |
| Apple Key ID | `RPB9LP5UC7` |
| Expo アカウント | s-knk |

---

## Phase 1: Supabase セットアップ

### 1-1. CLI インストール
```bash
# Homebrew が使えない環境（WSL）では直接バイナリを取得
cd /home/aaa/project/pet-app
curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz
sudo mv supabase /usr/local/bin/
```

### 1-2. ログインとリンク
```bash
supabase login
supabase link --project-ref <PROJECT_REF>
```

### 1-3. pg_cron 有効化（必須・先に実行）
`supabase db push` の前に必ず Supabase Dashboard で有効化する。

- Dashboard → Database → Extensions → `pg_cron` を ON
- `pg_net` も同様に ON

有効化せずに push するとエラー：`schema "cron" does not exist`

### 1-4. マイグレーション適用
```bash
supabase db push
```

### 1-5. Edge Functions デプロイ
```bash
supabase functions deploy select-candidate
supabase functions deploy publish-featured
supabase functions deploy cleanup-candidates
supabase functions deploy send-featured-push
supabase functions deploy withdraw-candidate
```

### 1-6. Apple Sign In（Supabase 設定）

**重要**: iOS ネイティブアプリで Sign In with Apple を使う場合、Secret Key は不要。

- Dashboard → Authentication → Providers → Apple
- `Client IDs` に `com.mainichipet.app` を入力
- `Secret Key` は**空欄のまま**保存（JWT 形式の Key ではない）
- Services ID（web 向け）は今回未使用

### 1-7. Google Sign In（Supabase 設定）

- Google Cloud Console → API & サービス → 認証情報
- `+ 認証情報を作成` → OAuth 2.0 クライアント ID
- アプリの種類: **「ウェブ アプリケーション」**（iOS ではなく）
- 作成後の Client ID と Client Secret を Supabase に入力
- Dashboard → Authentication → Providers → Google → 有効化

---

## Phase 2: EAS Build セットアップ

### 2-1. EAS CLI インストール
```bash
npm install -g eas-cli
cd apps/mobile
eas login
```

### 2-2. プロジェクト設定
```bash
eas build:configure
```
- `app.config.ts` の `extra.eas.projectId` が設定されていることを確認

### 2-3. 証明書・プロビジョニング
```bash
eas credentials
```
- Profile: `development`
- Apple Developer にログイン → 自動生成を選択
- Push Notifications は Apple Developer Console → Identifiers で手動有効化が必要な場合あり

```bash
# capability sync エラーが出たときの回避フラグ
EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile development
```

### 2-4. expo-dev-client インストール
```bash
# ルートではなく apps/mobile で実行
cd apps/mobile
pnpm add expo-dev-client
```

### 2-5. 実機インストール（Mac なし）
1. EAS ダッシュボード → ビルド一覧 → 該当ビルドの `.ipa` リンクをコピー
2. iPhone の Safari でリンクを開く → インストール

---

## Phase 3: パッケージバージョン問題と解決

`expo install --fix` を使わずに `^` 指定でインストールした結果、複数パッケージが Expo SDK 52 と非互換なバージョンに上がってしまい、ビルドが 4 回失敗した。

### 失敗一覧と原因

| # | エラー | 原因パッケージ | 解決策 |
|---|---|---|---|
| 1 | Swift access control error | expo-iap@1.0.4 | v2.9.7 にダウングレード |
| 2 | `cannot find 'Constant' in scope` | expo-iap@4.3.1, v3.2+ | ExpoModulesCore の新 DSL は SDK 53+ 専用 |
| 3 | `receiptValidationProps` not found | expo-iap@3.1.36 | openiap pod との不整合。v2.9.7 が安全 |
| 4 | `ExpoAppDelegateSubscriberRepository` not found | expo-file-system@18.1.11 | ~18.0.12 に固定 |
| 5 | `Constant` in expo-device | expo-device@56.0.4 | SDK 53 向け。~7.0.3 に戻す |

### 根本的な解決方法
```bash
cd apps/mobile
npx expo install --check   # 非互換パッケージを表示
npx expo install --fix     # 一括修正
```

**新規パッケージ追加時は必ず `expo install <pkg>` を使う**（`pnpm add` 直接は避ける）。

### expo-iap の安全バージョン

Expo SDK 52 で動作確認済み: **v2.9.7**

| バージョン | 問題 |
|---|---|
| 1.0.4 | Swift access control error |
| 3.1.37〜3.4.x | `receiptValidationProps` not in openiap pod |
| 3.2.0〜4.x | `Constant` (Expo SDK 53+ 専用 DSL) |
| **2.9.7** | ✅ 正常動作 |

---

## Phase 4: 管理画面（Admin）

### 技術スタック
- Next.js 15 App Router + shadcn/ui
- Supabase SSR (`@supabase/ssr`)
- Vercel にデプロイ

### ローカル開発
```bash
cd apps/admin
pnpm dev
```

### Vercel デプロイ
1. Vercel → New Project → Import from Git
2. Root Directory: `apps/admin`
3. 環境変数を設定（下記参照）

### 管理者権限付与
```sql
-- Supabase Dashboard → SQL Editor で実行
UPDATE users SET is_admin = true WHERE id = '<user_id>';
```

---

## 環境変数一覧

### apps/mobile（EAS Secrets に登録）
```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
```

EAS に登録:
```bash
eas secret:create --scope project --name SUPABASE_URL --value <value>
eas secret:create --scope project --name SUPABASE_ANON_KEY --value <value>
```

### apps/admin（Vercel 環境変数）
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Supabase Edge Functions
```
SUPABASE_URL=           # 自動注入
SUPABASE_SERVICE_ROLE_KEY=   # 自動注入
EXPO_ACCESS_TOKEN=<expo-access-token>  # 手動設定（Push通知用）
```

EXPO_ACCESS_TOKEN の設定:
- Dashboard → Settings → Secrets → 追加

---

## IAP プロダクト ID

| プラン | Product ID |
|---|---|
| 月額 | `com.mainichipet.app.pro_monthly` |
| 買い切り | `com.mainichipet.app.pro_lifetime` |

App Store Connect でのプロダクト登録が必要（本番ビルド前）。
