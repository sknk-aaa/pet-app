# 07. 技術スタックとプロジェクト構成

このドキュメントは採用する技術、ライブラリ、ディレクトリ構成を定義します。代替案の検討は不要です。

---

## モノレポ構成

```
/
├── apps/
│   ├── mobile/                  React Native / Expo
│   │   ├── app/                 (Expo Router 採用なら)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── hooks/
│   │   │   ├── services/        (Supabase, 通知, IAP, 写真処理)
│   │   │   ├── db/              (SQLite アクセスとマイグレーション)
│   │   │   ├── store/           (グローバル状態)
│   │   │   ├── utils/           (日付処理、フォーマッタ、定数)
│   │   │   └── types/
│   │   ├── assets/
│   │   ├── app.config.js
│   │   ├── eas.json
│   │   └── package.json
│   └── admin/                   Next.js 管理画面
│       ├── src/app/             App Router
│       ├── src/components/
│       ├── src/lib/             (Supabase クライアントなど)
│       └── package.json
├── supabase/
│   ├── migrations/              SQL マイグレーション
│   ├── functions/               Edge Functions（6本）
│   │   ├── publish-featured/
│   │   ├── select-candidate/
│   │   ├── cleanup-candidates/
│   │   ├── send-featured-push/
│   │   ├── withdraw-candidate/
│   │   ├── delete-my-account/
│   │   └── _shared/
│   ├── seed.sql                 開発用シードデータ
│   └── config.toml
├── docs/                        設計仕様(01〜09)・OPERATIONS・HANDOFF・GitHub Pages
├── CLAUDE.md                    AI向け入口（概要・固有厳守事項・doc索引）
├── package.json                 (pnpm workspaces)
└── README.md                    人間向け入口
```

パッケージマネージャは `pnpm` を推奨。

---

## モバイルアプリの技術

| 種類 | ライブラリ | 用途 |
|---|---|---|
| フレームワーク | Expo SDK 最新 | アプリ基盤 |
| ルーター | Expo Router(File-based) | 画面遷移 |
| 言語 | TypeScript | 型安全性 |
| UI | Native コンポーネント中心 | iOS 標準の見た目を活かす |
| スタイリング | StyleSheet または NativeWind(任意) | CSS-in-JS |
| 状態管理 | Zustand | グローバル状態(認証、Pro、設定など) |
| サーバーステート | TanStack Query(React Query) | サーバーデータの取得・キャッシュ・再取得 |
| DB | expo-sqlite | ローカル DB |
| ファイル | expo-file-system | 写真ファイル管理 |
| キーバリュー | @react-native-async-storage/async-storage | 軽量フラグ |
| 写真処理 | expo-image-manipulator | リサイズ・JPEG 化 |
| 画像表示 | expo-image | キャッシュ付き高速表示 |
| カメラ | expo-camera または expo-image-picker | 写真撮影と選択 |
| カメラロール | expo-media-library | カメラロール保存 |
| 通知 | expo-notifications | ローカル通知・プッシュ通知 |
| 認証 | @supabase/supabase-js | Supabase Auth クライアント |
| Apple Sign In | expo-apple-authentication | ネイティブ Apple ログイン |
| Google Sign In | expo-web-browser + supabase.auth.signInWithOAuth | ブラウザ OAuth ログイン(下記注参照) |
| 課金 | react-native-purchases (RevenueCat) | In-App Purchase |
| OTA | expo-updates | JS のみの修正をビルド不要で配信 |
| 日付処理 | date-fns + date-fns-tz | タイムゾーン対応の日付処理 |
| ネット状態 | @react-native-community/netinfo | オフライン検出 |
| UUID | expo-crypto | UUID 生成 |

> **Google ログイン**: `@react-native-google-signin/google-signin` は raw nonce を JS に返さず nonce mismatch になるため使用しない。`expo-web-browser` + Supabase の `signInWithOAuth`(PKCE/implicit 両対応)で実装する。詳細は `docs/05-logic.md`。
>
> **課金**: `expo-iap` は廃止。RevenueCat(`react-native-purchases`)を使用。Entitlement は `pro`。
>
> **OTA**: `expo-updates` を導入済み。`runtimeVersion: { policy: 'appVersion' }`。`version` を据え置けば `eas update --branch production` で既存ビルドに JS 更新を配信できる。
>
> **フォント**: カスタムフォントは使わず iOS システムフォントに任せる(`fontFamily` を指定しない)。
>
> **アイコン**: `react-native-svg` で自作の SVG アイコン(PawIcon / CrownIcon / SparklesIcon 等)を使用。

### Expo の運用

- Managed Workflow を基本とする
- ウィジェット実装が必要になった場合は EAS Build + Config Plugin でネイティブモジュールを追加
- 開発: Expo Go(可能な範囲で) + EAS Development Build(IAP / Apple Sign In のため必須)
- 配布: EAS Build → TestFlight → App Store

### iOS 関連の設定(app.config.js)

設定ファイルは `app.config.js`(TypeScript ではなく JS)。

- bundleIdentifier: `com.mainichipet.app`
- supportsTablet: false
- usesAppleSignIn: true
- CFBundleDevelopmentRegion: `ja`(ストア表記が英語にならないよう日本語ロケール固定)
- infoPlist:
  - NSCameraUsageDescription: 「ペットの写真を撮影します」
  - NSPhotoLibraryUsageDescription: 「アルバムからペットの写真を選びます」
  - NSPhotoLibraryAddUsageDescription: 「カメラロールに保存します」
- entitlements:
  - aps-environment: production
- 通知: APNs 設定を EAS で管理

---

## 管理画面の技術

| 種類 | ライブラリ | 用途 |
|---|---|---|
| フレームワーク | Next.js 最新(App Router) | Web アプリ基盤 |
| 言語 | TypeScript | 型安全性 |
| UI | shadcn/ui | コンポーネント |
| スタイリング | Tailwind CSS | CSS |
| データアクセス | @supabase/supabase-js + @supabase/ssr | Supabase SSR 対応 |
| サーバーステート | TanStack Query | データ取得 |
| フォーム | react-hook-form + zod | バリデーション |
| 日付 | date-fns + date-fns-tz | タイムゾーン対応 |
| アイコン | lucide-react | UI アイコン |
| 通知トースト | sonner | 操作フィードバック |

ホスティング: Vercel

---

## バックエンドの技術

### Supabase 構成

- データベース: Postgres 15
- 認証: Supabase Auth(Apple / Google / Email プロバイダ有効化)
- ストレージ: Supabase Storage(2 バケット)
- Edge Functions: Deno ランタイム
- Cron: pg_cron 拡張

### Edge Functions 一覧（6本・デプロイ済み）

関数名は左列。pg_cron のジョブ名は別名(`select-tomorrow-candidate` 等)で、ジョブから関数 URL を `net.http_post` で叩く。

| 関数名 | トリガー | 用途 |
|---|---|---|
| `select-candidate` | Cron(毎日 23:00 JST) | 翌日掲載候補の抽選 → status=scheduled |
| `publish-featured` | Cron(毎日 07:00 JST) | 掲載確定 + アーカイブコピー + プッシュ通知 |
| `cleanup-candidates` | Cron(毎日 00:10 JST) | 前日以前の候補と Storage の削除 |
| `send-featured-push` | publish-featured から HTTP 呼び出し | Expo Push 送信 |
| `withdraw-candidate` | クライアントから呼び出し | pending の取り下げ時に Storage 削除も実施 |
| `delete-my-account` | クライアントから呼び出し | アカウント削除フル処理 |

### 環境変数

| 変数 | 配置先 | 説明 |
|---|---|---|
| `SUPABASE_URL` | mobile, admin, edge functions | プロジェクト URL |
| `SUPABASE_ANON_KEY` | mobile, admin | クライアント用 |
| `SUPABASE_SERVICE_ROLE_KEY` | edge functions のみ | バックエンド用 |
| `EXPO_ACCESS_TOKEN` | edge functions | Expo Push API 用 |

| `GOOGLE_IOS_CLIENT_ID` | mobile(EAS 環境変数) | Google OAuth iOS クライアント ID |

mobile アプリは `app.config.js` の `extra` 経由で環境変数を取得。EAS ビルドでは EAS の環境変数(Secret)から読む。
管理画面は `.env.local` で開発、Vercel の Environment Variables で本番(`SUPABASE_SERVICE_ROLE_KEY` を含む)。

---

## 開発環境

開発環境は Windows を前提とする。

### 必要なツール

| ツール | バージョン | 用途 |
|---|---|---|
| Node.js | 20 LTS 以上 | JavaScript ランタイム |
| pnpm | 9 以上 | パッケージマネージャ |
| EAS CLI | 最新 | Expo ビルド |
| Supabase CLI | 最新 | Supabase 操作・マイグレーション |
| Git | 最新 | バージョン管理 |
| Xcode | macOS 環境必須 | iOS ビルド(Windows ローカルでは EAS Build 経由でクラウドビルド) |

Windows でローカル iOS ビルドはできないため、開発時は EAS Build のクラウドビルドを使う。

### 開発フロー

1. ローカル Supabase をスタート: `pnpm supabase start`
2. マイグレーション適用: `pnpm supabase db reset`
3. シードデータ投入: `pnpm supabase db seed`
4. モバイル開発: `pnpm --filter mobile start`
5. iOS シミュレータでは限られた機能のみ動作。実機テストは EAS Build → TestFlight 経由
6. 管理画面: `pnpm --filter admin dev`

### ビルド

- モバイル: `eas build --platform ios --profile production`
- 管理画面: Vercel への push で自動デプロイ
- Supabase: `pnpm supabase db push` でリモートマイグレーション、`pnpm supabase functions deploy` で Edge Function

---

## バージョン管理

### Git

- メインブランチ: `main`(運用は main 直コミット)
- リリースタグ: `v1.0.0` 形式

### マイグレーション

- Supabase のマイグレーションファイルはタイムスタンプ付きで管理:
  ```
  supabase/migrations/
  ├── 20260101000000_init.sql
  ├── 20260102000000_add_pro_columns.sql
  └── ...
  ```
- SQLite マイグレーションも同様の番号管理:
  ```
  apps/mobile/src/db/migrations/
  ├── 001_init.ts
  ├── 002_add_pro_columns.ts
  └── ...
  ```

---

## App Store 提出

### 必要なリソース

- アプリアイコン(1024x1024)
- スクリーンショット(iPhone 6.5 / 6.7 / 5.5 インチ)
- アプリプレビュー動画(任意)
- アプリの説明文(日本語)
- キーワード
- カテゴリ: ライフスタイル
- 年齢制限: 4+
- プライバシー情報(App Privacy)

### 申請時の説明

審査向けに以下を明記:

- 「今日のペット」機能はユーザー投稿コンテンツを扱う
- 投稿は手動レビューを経て掲載される
- 通報・非表示・BAN 機能を実装している
- 利用規約・プライバシーポリシーへのリンクを App Store Connect に登録

### EULA(End User License Agreement)

App Store の標準 EULA に追加して、UGC 関連の特約を別途プライバシーポリシー / 利用規約として用意。
