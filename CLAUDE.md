# まいにちペット

ペットの写真を1日1枚記録する iOS 日記アプリ。カレンダーで振り返り、連続記録で習慣化する。希望者の写真は審査を経て「今日のペット」として毎日1枚アプリ内に掲載される。健康管理アプリでも SNS でもない。v1.0 実装完了・App Store 審査中。

構成: モノレポ（pnpm workspaces）。`apps/mobile`（Expo SDK 52 / React Native, iOS のみ）、`apps/admin`（Next.js 15 管理画面・Vercel）、`supabase`（Auth / PostgreSQL / Storage / Edge Functions 6本 / pg_cron 4本）。

## このアプリ固有の厳守事項

- **iOS のみ**。Android 対応なし。タイムゾーンは Asia/Tokyo 固定（「今日」の判定は JST）。
- **パッケージ追加は `npx expo install`**。`pnpm add` 直接は Expo SDK 52 と非互換になりビルドが壊れる。
- **課金は RevenueCat（`react-native-purchases`）**。`expo-iap` は削除済み。
- **Google ログインは `expo-web-browser` + `supabase.auth.signInWithOAuth`**。`@react-native-google-signin` は nonce 問題で `signInWithIdToken` が使えない。
- **OTA**: `expo-updates` 導入済み。`runtimeVersion: appVersion`（1.0.0）。JS のみの修正は `eas update --branch production` で配信（新ビルド不要）。ネイティブ変更時のみ再ビルド。
- **EAS ビルド前**: `set -a && source .env && set +a` で環境変数を手動ロードする。
- **フォント**: カスタムフォント不使用。`fontFamily` を指定せず iOS システムフォントに任せる。
- 管理画面の認証は `app_metadata.is_admin = true` で判定（DB の `users.is_admin` ではない）。

## doc 索引

- `docs/01-overview.md`〜`docs/09-edge-cases.md` … 設計仕様の正（全体像・画面・データ・ロジック・管理画面・技術・非対象・例外）
- `docs/OPERATIONS.md` … 運用の正（環境・bundle id・環境変数・課金/Secrets・ビルド/配信・障害対応）
- `docs/HANDOFF.md` … 現状・残タスク・既知の問題
- `README.md` … 人間向け入口
