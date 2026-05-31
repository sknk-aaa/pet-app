# 04. サーバーデータ設計 (Supabase)

このドキュメントは Supabase 側のデータベーススキーマ、Row Level Security(RLS)、Storage 構造を定義します。

> **正本**: 実スキーマ・RLS・トリガー・Storage ポリシーの正は `supabase/migrations/20260101000000_init.sql`。本書はその要約で、差異がある場合はマイグレーションを優先する。`featured_candidates` には `updated_at`(トリガー自動更新)があり、`featured_pets.user_id` / `reports.reporter_user_id` は退会時 SET NULL のため nullable。

---

## Supabase プロジェクト構成

| 機能 | サービス |
|---|---|
| データベース | Supabase Postgres |
| 認証 | Supabase Auth (Apple / Google / Email) |
| ファイルストレージ | Supabase Storage |
| サーバー処理 | Supabase Edge Functions (Deno) |
| 定期実行 | Supabase Cron (pg_cron) |

---

## テーブル設計

すべての時刻は `timestamptz`、すべての日付は `date` 型(Asia/Tokyo 想定の `YYYY-MM-DD`)。

### users

Supabase Auth と紐づくユーザープロファイル。

```sql
CREATE TABLE users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text,                          -- 将来用、現在は未使用
  is_admin        boolean NOT NULL DEFAULT false,
  push_token      text,                          -- Expo Push Token
  notification_featured_enabled boolean NOT NULL DEFAULT true,
  banned_at       timestamptz,                   -- BAN された場合のタイムスタンプ
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_is_admin_idx ON users(is_admin) WHERE is_admin = true;
```

新規ユーザー登録時のトリガーで `auth.users` への INSERT に対応する users レコードを自動作成すること。

### featured_candidates

「今日のペット」候補。掲載日翌日に自動削除される。

```sql
CREATE TABLE featured_candidates (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id               text,                              -- 補助情報
  entry_date              date NOT NULL,                     -- 写真の記録日(Asia/Tokyo)
  cloud_image_url         text NOT NULL,                     -- Storage の URL
  thumbnail_url           text NOT NULL,
  title                   text NOT NULL,                     -- 最大 30 文字
  pet_names_display       text NOT NULL,                     -- "ポチとタマ" のような結合済み文字列
  pet_species_primary     text,                              -- 主要ペットの種類(統計用)
  status                  text NOT NULL DEFAULT 'pending',
  featured_weight_streak  integer NOT NULL DEFAULT 1,        -- 抽選重み(クライアント送信値を min(value, 30) で丸める)
  reports_count           integer NOT NULL DEFAULT 0,        -- 通報件数
  submitted_at            timestamptz NOT NULL DEFAULT now(),
  reviewed_at             timestamptz,
  reviewed_by             uuid REFERENCES users(id),
  reject_reason           text,
  updated_at              timestamptz NOT NULL DEFAULT now(),  -- トリガーで自動更新
  CONSTRAINT featured_candidates_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'scheduled', 'featured', 'hidden')),
  UNIQUE(user_id, entry_date)
);

CREATE INDEX featured_candidates_status_idx ON featured_candidates(status);
CREATE INDEX featured_candidates_entry_date_idx ON featured_candidates(entry_date);
CREATE INDEX featured_candidates_user_id_idx ON featured_candidates(user_id);
```

メモはこのテーブルに保存しない(設計原則 10)。

### featured_pets

掲載が確定した「今日のペット」。

featured_candidates から画像 URL・タイトル・ペット名をコピーして保持する。これにより candidates が削除されても掲載履歴を表示できる。

```sql
CREATE TABLE featured_pets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id        uuid REFERENCES featured_candidates(id) ON DELETE SET NULL,  -- 削除時に NULL になる
  user_id             uuid REFERENCES users(id) ON DELETE SET NULL,  -- 退会後も掲載履歴を残すため nullable
  featured_date       date NOT NULL UNIQUE,           -- 1 日 1 枚
  -- 候補テーブルからコピー(掲載後の削除に備える)
  archive_image_url   text NOT NULL,                   -- 別バケットに長期保存した画像 URL
  archive_thumb_url   text NOT NULL,
  title               text NOT NULL,
  pet_names_display   text NOT NULL,
  status              text NOT NULL DEFAULT 'visible',  -- 'visible' | 'hidden'
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT featured_pets_status_check
    CHECK (status IN ('visible', 'hidden'))
);

CREATE INDEX featured_pets_user_id_idx ON featured_pets(user_id);
CREATE INDEX featured_pets_status_idx ON featured_pets(status);
```

掲載確定時 (`publishTodaysFeaturedPet` 処理) で:
1. candidates から画像・タイトル・ペット名をコピー
2. 画像は `featured-photos` バケットから `featured-archive` バケットへコピー(コピー先 URL を archive_image_url に保存)
3. featured_pets レコードを INSERT

### featured_reactions

掲載写真へのリアクション。

```sql
CREATE TABLE featured_reactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_pet_id   uuid NOT NULL REFERENCES featured_pets(id) ON DELETE CASCADE,
  user_id           uuid REFERENCES users(id) ON DELETE CASCADE,
  device_id         text,
  reaction_type     text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT featured_reactions_type_check
    CHECK (reaction_type IN ('cute', 'beautiful', 'cool', 'like')),
  CONSTRAINT featured_reactions_identifier_check
    CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)
);

-- 部分ユニーク制約: ログイン時とログイン外で別管理
CREATE UNIQUE INDEX featured_reactions_user_unique
  ON featured_reactions(featured_pet_id, reaction_type, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX featured_reactions_device_unique
  ON featured_reactions(featured_pet_id, reaction_type, device_id)
  WHERE user_id IS NULL;

CREATE INDEX featured_reactions_featured_pet_id_idx ON featured_reactions(featured_pet_id);
```

集計はクエリ時に COUNT GROUP BY で実施。事前集計用カラムは持たない(リアルタイム性重視)。

### reports

掲載写真への通報。

```sql
CREATE TABLE reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_pet_id       uuid NOT NULL REFERENCES featured_pets(id) ON DELETE CASCADE,
  reporter_user_id      uuid REFERENCES users(id) ON DELETE SET NULL,  -- 通報はログイン必須だが制約上は nullable
  reason                text NOT NULL,
  detail                text,
  status                text NOT NULL DEFAULT 'open',
  reviewed_at           timestamptz,
  reviewed_by           uuid REFERENCES users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_reason_check
    CHECK (reason IN ('inappropriate', 'privacy', 'copyright', 'other')),
  CONSTRAINT reports_status_check
    CHECK (status IN ('open', 'reviewed', 'resolved')),
  UNIQUE(featured_pet_id, reporter_user_id)
);

CREATE INDEX reports_status_idx ON reports(status);
CREATE INDEX reports_featured_pet_id_idx ON reports(featured_pet_id);
```

通報はログイン必須(`reporter_user_id` は NOT NULL)。

---

## ビュー

クライアントが効率的にデータを取得するためのビューを用意。

### public_featured_pet_today

「今日のペット」表示用。リアクション数を含む集計。

```sql
CREATE VIEW public_featured_pet_today AS
SELECT
  fp.id,
  fp.featured_date,
  fp.archive_image_url AS image_url,
  fp.archive_thumb_url AS thumb_url,
  fp.title,
  fp.pet_names_display,
  COALESCE(reactions.cute_count, 0) AS cute_count,
  COALESCE(reactions.beautiful_count, 0) AS beautiful_count,
  COALESCE(reactions.cool_count, 0) AS cool_count,
  COALESCE(reactions.like_count, 0) AS like_count
FROM featured_pets fp
LEFT JOIN (
  SELECT
    featured_pet_id,
    SUM(CASE WHEN reaction_type = 'cute' THEN 1 ELSE 0 END) AS cute_count,
    SUM(CASE WHEN reaction_type = 'beautiful' THEN 1 ELSE 0 END) AS beautiful_count,
    SUM(CASE WHEN reaction_type = 'cool' THEN 1 ELSE 0 END) AS cool_count,
    SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END) AS like_count
  FROM featured_reactions
  GROUP BY featured_pet_id
) reactions ON reactions.featured_pet_id = fp.id
WHERE fp.status = 'visible'
  AND fp.featured_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo')::date;
```

`anon` と `authenticated` ロールに SELECT 権限を付与。

### my_featured_history

掲載履歴用。自分の featured 一覧。

```sql
CREATE VIEW my_featured_history AS
SELECT
  fp.id,
  fp.featured_date,
  fp.archive_image_url AS image_url,
  fp.archive_thumb_url AS thumb_url,
  fp.title,
  fp.pet_names_display,
  fp.user_id,
  COALESCE(reactions.cute_count, 0) AS cute_count,
  COALESCE(reactions.beautiful_count, 0) AS beautiful_count,
  COALESCE(reactions.cool_count, 0) AS cool_count,
  COALESCE(reactions.like_count, 0) AS like_count
FROM featured_pets fp
LEFT JOIN (
  -- 上と同じ集計
) reactions ON reactions.featured_pet_id = fp.id
WHERE fp.status = 'visible';
```

RLS 経由で `user_id = auth.uid()` のレコードだけ見えるようにする。

---

## Row Level Security (RLS)

すべてのテーブルで RLS を有効化。

### users

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 自分のレコードを読み書きできる
CREATE POLICY "own user readable"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "own user updatable"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = false);  -- is_admin は自己昇格不可

-- 管理者は全ユーザーを読み書きできる
CREATE POLICY "admin can manage users"
  ON users FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
```

### featured_candidates

```sql
ALTER TABLE featured_candidates ENABLE ROW LEVEL SECURITY;

-- 自分の候補のみ読める
CREATE POLICY "own candidates readable"
  ON featured_candidates FOR SELECT
  USING (auth.uid() = user_id);

-- 自分の候補を pending として作成可
CREATE POLICY "own candidate insertable"
  ON featured_candidates FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- UPDATE / DELETE はクライアントから直接行わない(RPC 経由)

-- 管理者は全候補を全権操作
CREATE POLICY "admin can manage candidates"
  ON featured_candidates FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
```

クライアントから取り下げる場合は RPC 関数 `withdraw_my_candidate(candidate_id)` を呼ぶ。

### featured_pets

```sql
ALTER TABLE featured_pets ENABLE ROW LEVEL SECURITY;

-- visible なものは誰でも(匿名含む)読める
CREATE POLICY "visible featured pets public"
  ON featured_pets FOR SELECT
  TO anon, authenticated
  USING (status = 'visible');

-- 管理者は全権
CREATE POLICY "admin can manage featured pets"
  ON featured_pets FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
```

### featured_reactions

```sql
ALTER TABLE featured_reactions ENABLE ROW LEVEL SECURITY;

-- 集計のためすべての行を匿名でも読める(個別ユーザー情報は不要なので OK)
CREATE POLICY "reactions readable for aggregation"
  ON featured_reactions FOR SELECT
  TO anon, authenticated
  USING (true);

-- ログイン済みは自分の user_id でリアクション作成可能
CREATE POLICY "logged in can react"
  ON featured_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- ログイン済みは自分の user_id のリアクションを削除可能
CREATE POLICY "logged in can unreact"
  ON featured_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 未ログイン(device_id ベース)のリアクション追加・削除は RPC 関数経由(後述)
```

未ログインのリアクション操作には RPC を用意する:

```sql
CREATE FUNCTION add_anon_reaction(p_featured_pet_id uuid, p_reaction_type text, p_device_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO featured_reactions (featured_pet_id, reaction_type, device_id)
  VALUES (p_featured_pet_id, p_reaction_type, p_device_id)
  ON CONFLICT DO NOTHING;
END $$;

CREATE FUNCTION delete_anon_reaction(p_featured_pet_id uuid, p_reaction_type text, p_device_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM featured_reactions
  WHERE featured_pet_id = p_featured_pet_id
    AND reaction_type = p_reaction_type
    AND device_id = p_device_id
    AND user_id IS NULL;
END $$;

-- anon ロールに EXECUTE 権限を付与
GRANT EXECUTE ON FUNCTION add_anon_reaction TO anon;
GRANT EXECUTE ON FUNCTION delete_anon_reaction TO anon;
```

### reports

```sql
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 自分の通報のみ読める
CREATE POLICY "own reports readable"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_user_id);

-- 通報作成はログイン必須
CREATE POLICY "logged in can report"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

-- 管理者は全権
CREATE POLICY "admin can manage reports"
  ON reports FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
```

---

## RPC 関数(クライアント / 管理画面用)

### withdraw_my_candidate(candidate_id uuid)

ユーザーが自分の候補を取り下げる。pending なら物理削除、approved / scheduled なら status = withdrawn。

```sql
CREATE FUNCTION withdraw_my_candidate(p_candidate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
  FROM featured_candidates
  WHERE id = p_candidate_id AND user_id = auth.uid();

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Candidate not found or not owned by user';
  END IF;

  IF v_status = 'pending' THEN
    -- Storage 削除は Edge Function でやる方が安全。ここでは DB レコードのみ削除
    DELETE FROM featured_candidates WHERE id = p_candidate_id;
  ELSIF v_status IN ('approved', 'scheduled') THEN
    UPDATE featured_candidates
    SET status = 'withdrawn', updated_at = now()
    WHERE id = p_candidate_id;
  ELSE
    RAISE EXCEPTION 'Cannot withdraw candidate in status %', v_status;
  END IF;
END $$;
```

物理削除の場合は Storage 上の画像も削除すべきなので、実装は Edge Function 経由を推奨。

---

## Storage 構造

### バケット: featured-photos(候補保管用)

```
featured-photos/
└── candidates/{user_id}/{YYYY-MM-DD}.jpg          原画像
└── candidates/{user_id}/{YYYY-MM-DD}_thumb.jpg    サムネイル
```

ルール:
- バケット種別: Public(URL を知っていれば閲覧可)
- ただし RLS 相当の Storage Policy で「writer は本人のみ」「reader は anon でも可」
- 掲載日翌日に削除バッチで全削除される

Storage Policy:

```sql
-- 書き込み: 認証ユーザーが自分の user_id ディレクトリに対してのみ
CREATE POLICY "own candidate upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'featured-photos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 読み取り: 誰でも可
CREATE POLICY "public read featured photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'featured-photos');
```

### バケット: featured-archive(掲載済み長期保存用)

```
featured-archive/
└── {YYYY}/{MM}/{featured_pet_id}.jpg       原画像のアーカイブ
└── {YYYY}/{MM}/{featured_pet_id}_thumb.jpg サムネイル
```

ルール:
- バケット種別: Public
- 書き込みは管理者と Edge Function のみ
- 読み取りは誰でも
- 削除されない(掲載履歴のため永続)

Storage Policy:

```sql
CREATE POLICY "public read archive"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'featured-archive');

-- 書き込みは管理者のみ(Edge Function は service_role でアクセスする)
CREATE POLICY "admin write archive"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'featured-archive'
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
```

---

## トリガーと自動処理

### auth.users INSERT トリガー

新規ユーザー作成時に users テーブルに自動で行を追加:

```sql
CREATE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (NEW.id, now(), now())
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### reports INSERT 時に reports_count を増やす

```sql
CREATE FUNCTION increment_reports_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE featured_candidates
  SET reports_count = reports_count + 1
  WHERE id = (
    SELECT candidate_id FROM featured_pets WHERE id = NEW.featured_pet_id
  );
  RETURN NEW;
END $$;

CREATE TRIGGER on_report_created
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION increment_reports_count();
```

---

## Cron(定期処理)

Supabase の pg_cron 拡張を使用。Edge Function を呼び出すか SQL を直接実行する。

| ジョブ | 実行時刻 | 概要 |
|---|---|---|
| `select_tomorrow_candidate` | 毎日 23:00 (JST) | 翌日の掲載候補を重み付き抽選し scheduled に設定 |
| `publish_today_featured_pet` | 毎日 07:00 (JST) | scheduled かつ管理者承認済 (approved) のものから 1 枚を featured 化、画像を archive バケットにコピー、ユーザーにプッシュ通知送信 |
| `cleanup_yesterday_candidates` | 毎日 00:10 (JST) | 前日に featured_date がある候補をすべて削除(featured 化されたものは archive バケットにコピー済みなので OK) |
| `retry_pending_pushes` | 5 分おき | 送信失敗したプッシュ通知の再試行 |

詳細なロジックは `docs/05-logic.md` 参照。

---

## Supabase Auth 設定

### プロバイダ

- Apple: 有効化、Service ID / Team ID / Key ID / Private Key を Apple Developer Console から取得して Supabase に設定
- Google: 有効化、Client ID / Client Secret を Google Cloud Console から取得
- Email: 有効化、確認メール送信あり

### Redirect URLs

iOS アプリ用のディープリンク URL スキームを登録(例: `petdiary://auth/callback`)。

### ユーザー削除

App Store ガイドライン 5.1.1(v) 対応のため、ユーザーが「アカウント削除」を選んだ場合は `auth.users` から物理削除する。
RLS の ON DELETE CASCADE / SET NULL ルールが連動して関連データも整理される。

---

## 環境変数

| 変数名 | 用途 | 配置 |
|---|---|---|
| `SUPABASE_URL` | プロジェクト URL | 全コンポーネント |
| `SUPABASE_ANON_KEY` | クライアントから RLS 経由でアクセスするためのキー | モバイルアプリ、管理画面 |
| `SUPABASE_SERVICE_ROLE_KEY` | バックエンド処理用、絶対に漏らさない | Edge Functions のみ |
| `EXPO_ACCESS_TOKEN` | Expo Push API 呼び出し用 | Edge Functions |

サービスロールキーは Edge Functions の環境変数にのみ設定。管理画面の Next.js には絶対に置かない(管理者は通常の Supabase Auth ログイン経由)。
