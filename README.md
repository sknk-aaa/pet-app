# まいにちペット

ペットの写真を1日1枚記録する iOS 日記アプリ。カレンダーで振り返り、連続記録で習慣化。希望者の写真は審査を経て「今日のペット」としてアプリ内に毎日1枚掲載される。

モノレポ構成（pnpm workspaces）:
- `apps/mobile` — Expo / React Native（iOS）
- `apps/admin` — Next.js 15 管理画面（Vercel）
- `supabase` — Auth / PostgreSQL / Storage / Edge Functions / pg_cron

## ドキュメント

- [設計仕様 docs/01〜09](docs/) — 全体像・画面・データ・ロジック・管理画面・技術・非対象・例外
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — インフラ・環境変数・課金・ビルド/配信・障害対応
- [docs/HANDOFF.md](docs/HANDOFF.md) — 現状・残タスク・既知の問題
- [CLAUDE.md](CLAUDE.md) — AI 向け入口（固有の厳守事項）

公開ページ: https://sknk-aaa.github.io/pet-app/
