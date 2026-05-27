# 03. ローカルデータ設計

このドキュメントは端末ローカルに保存するデータの設計を定義します。

---

## ストレージの構成

| 種類 | 保存先 | 用途 |
|---|---|---|
| 構造化データ | SQLite (`expo-sqlite`) | 記録メタデータ、ペット情報、設定、状態 |
| 写真ファイル | FileSystem (`expo-file-system`) アプリ専用領域 | 写真本体、サムネイル、ペットアイコン |
| 軽量フラグ | AsyncStorage (`@react-native-async-storage/async-storage`) | オンボーディング完了フラグ、最後に見たデータの id など、SQLite を立ち上げる前にアクセスしたい値 |
| ログイン状態 | Supabase Auth の標準ストレージ | アクセストークン、リフレッシュトークン |
| 課金状態 | SQLite + Apple StoreKit のレシート検証 | Pro 状態、購入種別、検証日時 |

写真ファイルは `FileSystem.documentDirectory` 配下に保存。アプリアンインストール時に消える領域。

---

## SQLite スキーマ

### pets

```
pets
  id              TEXT PRIMARY KEY      -- UUID v4
  name            TEXT NOT NULL         -- 最大 20 文字
  species         TEXT NOT NULL         -- 'cat' | 'dog' | 'bird' | 'rabbit' | 'hamster' | 'other'
  species_other   TEXT                  -- species = 'other' の場合の自由入力
  birthday        TEXT                  -- 'YYYY-MM-DD' or NULL
  gender          TEXT                  -- 'male' | 'female' | 'unknown' or NULL
  icon_uri        TEXT                  -- FileSystem パス or NULL
  sort_order      INTEGER DEFAULT 0     -- ペット選択シートでの表示順
  created_at      TEXT NOT NULL         -- ISO 8601 (UTC)
  updated_at      TEXT NOT NULL
```

ルール:
- 無料ユーザーは最大 1 レコード
- Pro ユーザーは制限なし
- 削除する場合、最後の 1 レコードは削除不可

### entries

1 日 1 レコード。

```
entries
  id                       TEXT PRIMARY KEY      -- UUID v4
  date                     TEXT NOT NULL UNIQUE  -- 'YYYY-MM-DD' (Asia/Tokyo) - 同一日付に複数レコードは禁止
  title                    TEXT NOT NULL         -- 最大 30 文字
  memo                     TEXT                  -- 最大 200 文字、サーバーには絶対送らない
  image_uri                TEXT NOT NULL         -- 原画像の FileSystem パス
  thumbnail_uri            TEXT NOT NULL         -- サムネイル(長辺 400px)の FileSystem パス
  anniversary_tag_type     TEXT                  -- 'birthday' | 'memorial' | 'first' | 'outing' | 'other' or NULL
  anniversary_tag_name     TEXT                  -- 'other' の場合のカスタム名(最大 20 文字)
  featured_submitted       INTEGER DEFAULT 0     -- 0/1: 今日のペット候補に送信したか
  featured_candidate_id    TEXT                  -- サーバー側 featured_candidates.id (送信成功時)
  featured_status_cache    TEXT                  -- 'pending'|'approved'|'rejected'|'withdrawn'|'scheduled'|'featured'|'hidden'
  created_at               TEXT NOT NULL
  updated_at               TEXT NOT NULL
```

ルール:
- `date` にユニーク制約 → 1 日 1 レコード強制
- `memo` はサーバーに絶対送らない(設計原則 10)
- `featured_status_cache` は表示用キャッシュ。実体はサーバー

### entry_pets

写真に「写っているペット」を紐づける中間テーブル。

```
entry_pets
  id          TEXT PRIMARY KEY
  entry_id    TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE
  pet_id      TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE
  created_at  TEXT NOT NULL
  UNIQUE(entry_id, pet_id)
```

ルール:
- 1 つの entry に最低 1 つの entry_pets レコード
- ペット削除時は ON DELETE CASCADE で関連レコードも消える(写真記録自体は残る)

### streak_state

連続記録日数の状態。常に 1 レコードのみ。

```
streak_state
  id                       INTEGER PRIMARY KEY CHECK (id = 1)  -- 必ず 1
  display_streak           INTEGER NOT NULL DEFAULT 0          -- 表示用連続日数
  featured_weight_streak   INTEGER NOT NULL DEFAULT 0          -- 抽選用連続日数
  last_entry_date          TEXT                                -- 最後に記録した日 'YYYY-MM-DD'
  updated_at               TEXT NOT NULL
```

ルール:
- アプリ初回起動時に id=1 のレコードを作成
- 詳細な更新ルールは `docs/05-logic.md` 参照

### settings

キー / バリュー形式の汎用設定。

```
settings
  key    TEXT PRIMARY KEY
  value  TEXT NOT NULL
```

設定するキー:

| key | value | デフォルト |
|---|---|---|
| `selected_pet_id` | 選択中ペットの id | 初回ペット作成時に自動設定 |
| `pet_filter` | 'all' or `pet_id` | 'all' |
| `notification_enabled` | 'true' / 'false' | 'true' |
| `notification_time` | 'HH:MM' | '20:00' |
| `notification_featured_enabled` | 'true' / 'false' | 'true' |
| `save_to_camera_roll` | 'true' / 'false' | 'true' |
| `device_id` | UUID v4 | アプリ初回起動時に生成 |
| `onboarding_completed` | 'true' / 'false' | 'false' (完了後 'true') |
| `last_seen_featured_date` | 'YYYY-MM-DD' | NULL |
| `last_streak_sync_date` | 'YYYY-MM-DD' | NULL |

`device_id` は未ログインユーザーの識別に使用する重要な値。アプリ再インストールで失われるので「機種変更で連続性が失われる」のは受け入れる。

### pro_state

課金状態を管理。

```
pro_state
  id                    INTEGER PRIMARY KEY CHECK (id = 1)  -- 必ず 1
  purchased             INTEGER NOT NULL DEFAULT 0          -- 0/1
  plan                  TEXT                                -- 'lifetime' | 'monthly' | NULL
  product_id            TEXT                                -- Apple の product ID
  original_transaction_id TEXT                              -- レシート検証用
  purchased_at          TEXT
  expires_at            TEXT                                -- monthly の場合のみ
  last_verified_at      TEXT
  receipt_data          TEXT                                -- レシートデータ(暗号化推奨)
```

ルール:
- 起動時に `purchased = 1` なら StoreKit でレシート再検証
- 月額プランの場合、`expires_at` を超過していたら Pro 機能を無効化
- 検証失敗(オフライン等)時は前回の状態を維持(grace period 7 日まで信用)

### pending_uploads

オフライン時の送信キュー。

```
pending_uploads
  id              TEXT PRIMARY KEY              -- UUID
  type            TEXT NOT NULL                 -- 'featured_candidate' | 'reaction_add' | 'reaction_delete' | 'report'
  payload         TEXT NOT NULL                 -- JSON シリアライズ
  attempt_count   INTEGER NOT NULL DEFAULT 0
  last_attempt_at TEXT
  last_error      TEXT
  created_at      TEXT NOT NULL
```

ルール:
- 起動時 / フォアグラウンド復帰時 / ネット復帰時に自動フラッシュ
- 指数バックオフ(30 秒・2 分・10 分)、最大 3 回試行
- `featured_candidate` は翌日 0:00 を過ぎたら自動キャンセル(意味がなくなるため)
- `reaction_add` / `reaction_delete` / `report` は無期限リトライ

### マイグレーション

スキーマ変更時は `expo-sqlite` のマイグレーション機構を使う。`schema_version` テーブルで管理:

```
schema_version
  version  INTEGER PRIMARY KEY
  applied_at TEXT
```

v1.0 リリース時の初期バージョンは 1。

---

## FileSystem 構造

```
FileSystem.documentDirectory/
├── photos/
│   ├── {entry_id}.jpg          原画像(長辺 1600px, quality 0.85)
│   └── {entry_id}_thumb.jpg    サムネイル(長辺 400px, quality 0.7)
├── pet_icons/
│   └── {pet_id}.jpg            ペットアイコン(正方形 400px, quality 0.85)
└── tmp/                        作業領域(写真リサイズ前など、保存時に削除)
```

ルール:
- ファイル名はランダム UUID ではなく `entry_id` / `pet_id` ベース → エンティティ削除時にファイルパスが特定しやすい
- レコード削除時は対応するファイルも `FileSystem.deleteAsync()` で削除
- 起動時に「DB レコードはないがファイルだけ残っている」ものを検出してクリーンアップする整合性チェックを実施

---

## カメラロール連携

`expo-media-library` を使用。

ルール:
- 設定の「カメラロールにも保存」が ON の場合のみ動作
- 写真記録保存時に、原画像(リサイズ前のオリジナル)をカメラロールにも保存
- アルバム「(アプリ名)」を作成し、その中に保存
- パーミッション拒否時はアプリ内のみ保存し、設定画面に「カメラロール連携にはアクセス許可が必要です」を表示

---

## 写真の前処理

写真記録フォームで「保存」がタップされた時の処理:

1. 撮影またはアルバム選択で取得した元データ(任意サイズ)を一時領域に保存
2. 原画像生成: 長辺 1600px にリサイズ、JPEG quality 0.85
3. サムネイル生成: 長辺 400px にリサイズ、JPEG quality 0.7
4. 両方を `photos/` に配置
5. 「カメラロールにも保存」が ON なら元データを MediaLibrary に保存
6. 一時領域をクリア

ライブラリ: `expo-image-manipulator`

---

## データの寿命と削除

| データ | 削除タイミング |
|---|---|
| entries / entry_pets / 写真ファイル | ユーザーがアプリをアンインストールするまで保持 |
| pets / pet icon ファイル | ユーザーが明示的に削除するまで(最後の 1 ペットは削除不可) |
| pending_uploads (featured_candidate) | 翌日 0:00 を過ぎたら自動削除 |
| pending_uploads (reaction_add / delete / report) | 送信成功 or 3 回失敗後の手動再試行待ち |
| streak_state | アンインストールまで保持 |
| pro_state | アンインストールまで保持(StoreKit が真のソース) |
| settings | アンインストールまで保持 |

v1.0 では「データのエクスポート」「クラウドバックアップ」は実装しない。アンインストールでデータが消えることを利用規約で明示する。

---

## 整合性の確保

起動時に以下のチェックを実施:

1. `pets` が 0 件 → オンボーディング画面に強制リダイレクト
2. `settings.selected_pet_id` が現存しない pet を指していたら → 最初の pet に修正
3. `entries.image_uri` のファイルが存在しない → そのエントリを「壊れた状態」として表示(写真なしのプレースホルダー)。削除はしない(ユーザーの判断を待つ)
4. `pets.icon_uri` のファイルが存在しない → icon_uri を NULL に書き換え(既定アイコンを使う)
5. `streak_state` が存在しない → 初期レコード作成
6. `pro_state` が存在しない → 初期レコード作成

---

## SQLite 利用上の注意

- すべてのクエリはパラメータ化クエリで実行(SQL インジェクション防止)
- 書き込みはトランザクションで囲む(連続日数更新と entries 作成は同一トランザクション内)
- 大量データの一覧取得(カレンダー、記念日一覧)はインデックスを設定:
  - `entries(date)`
  - `entries(anniversary_tag_type)`
  - `entry_pets(entry_id)`
  - `entry_pets(pet_id)`
