# 05. 主要ロジック仕様

このドキュメントは主要なロジックの「振る舞い」を自然言語で定義します。実装の詳細(関数名、コード構造)は Claude Code の判断に委ねます。

---

## 共通: タイムゾーンと日付の扱い

- すべての日付判定は `Asia/Tokyo` 固定
- アプリ内で「今日」「昨日」を判定する場面はすべて Asia/Tokyo 基準で 0:00 で切り替え
- 端末のタイムゾーン設定は無視する
- 日付の文字列形式は ISO 8601 の `YYYY-MM-DD` 形式

「今日」の終わりは Asia/Tokyo の翌日 0:00 ちょうど。グレースピリオド(夜型ユーザー配慮)などは設けない。

---

## 1. 連続記録日数(streak)の更新

### 状態

ローカルの `streak_state` テーブルに 1 レコード:

- `display_streak`: ユーザー画面に表示する連続日数
- `featured_weight_streak`: 今日のペット抽選に使う重み
- `last_entry_date`: 最後に記録した日(`YYYY-MM-DD`)

### 写真記録の保存時

入力: 保存しようとしている記録の日付(常に「今日 in Asia/Tokyo」)

判定ルール:

1. 既に同じ日付の記録がある場合(= 編集による再保存)、何もしない
2. `last_entry_date` が「昨日」と一致する: `display_streak` と `featured_weight_streak` をそれぞれ +1
3. `last_entry_date` がそれ以外(空、または昨日以前): `display_streak` と `featured_weight_streak` を 1 にリセット

`last_entry_date` を「今日」に更新。

### 自分が「今日のペット」に選ばれた時

サーバーから通知 or アプリ起動時のサーバー問い合わせで「自分が掲載された」ことが判明したら:

- `featured_weight_streak = 0` に設定
- `display_streak` は変更しない

同じ掲載に対して 2 回以上リセットしないよう、`settings.last_streak_sync_date` に最後にリセットした掲載日を記録し、同日分は無視する。

### 注意事項

- 端末時計を意図的に変更して連続日数を稼ぐ抜け道があるが、v1.0 では許容
- サーバー側に送信する `featured_weight_streak` の値は、サーバーで `min(value, 30)` に丸めるので、悪意ある改ざんがあっても抽選に大きな影響は出ない

---

## 2. 通知リマインダー(ローカル通知)

### スケジュール

- ライブラリ: `expo-notifications`
- トリガー種別: DAILY(毎日同時刻)
- 設定が変更されたら既存スケジュールをすべてキャンセル後に再スケジュール

### 通知内容

タイトルと本文は固定文言ではなく、複数候補からローテーション or ランダムにすると味が出る。例:

- 「うちの子の今日を残しましょう」
- 「今日の 1 枚はもう撮りましたか?」
- 「今日のうちの子、忘れずに」

文面のルール:
- ユーザーがまだ今日記録していなくても、すでに記録していても、どちらも違和感がない中立的な文面にする(発火時に記録有無をチェックする手段がないため)
- ポジティブすぎる(「今日もありがとう」など)文面は避ける

### 設定変更時

通知時刻を変更したとき:
1. 既存の `daily-reminder` 識別子の通知をキャンセル
2. 新しい時刻で再スケジュール

通知 OFF にしたとき:
1. 既存通知をキャンセル
2. `notification_enabled = false` を保存

通知 ON に戻したとき:
1. `notification_time` の値で再スケジュール

### 当日に記録した時

写真記録保存時に当日分のローカル通知(未配信のもの)を `Notifications.dismissNotificationAsync()` でクリアする。次の発火は翌日の設定時刻。

---

## 3. プッシュ通知(今日のペット選出通知)

### Push Token の取得

- アプリ起動時にログイン状態を確認
- ログイン済かつ通知許可済の場合、Expo Push Token を取得
- `users.push_token` に upsert
- ログアウト時はサーバーの push_token を NULL に戻す

### 配信フロー

1. 毎朝 07:00 (JST) の Cron が `publish_today_featured_pet` を実行
2. featured 確定したユーザーの push_token を取得
3. Expo Push API (`https://exp.host/--/api/v2/push/send`) にリクエスト
4. ペイロード:
   - title: 「うちの子が今日のペットに選ばれました」
   - body: 「タップして見に行く」
   - data: `{ type: 'featured', featured_pet_id: <uuid> }`
5. 通知タップ時はアプリを起動し、「今日のペット」タブを開く

### 失敗時の再試行

- Expo API のレスポンスを確認
- DeviceNotRegistered などの恒久的失敗 → users.push_token を NULL に
- ネットワークエラーなど一時的失敗 → 別ジョブ `retry_pending_pushes` で再試行(5 分おき、最大 1 時間)

### ユーザー設定との連動

`users.notification_featured_enabled = false` の場合は送信しない。クライアント側からこのフラグを設定可能にする。

---

## 4. 今日のペット候補の送信フロー

### 写真記録保存時

「今日のペット参加」トグルが ON の場合:

1. ローカル保存(SQLite + FileSystem)を完了させる
2. `pending_uploads` テーブルに `type = 'featured_candidate'` のレコードを追加
3. ペイロードに以下を含める:
   - entry_id
   - title
   - pet_names_display(「ポチとタマ」形式)
   - pet_species_primary(主要ペットの種類)
   - featured_weight_streak(現在の値)
   - image_uri / thumbnail_uri(ローカルパス)
4. ローカル保存完了をユーザーに通知(写真記録フォームを閉じる)
5. バックグラウンドで送信処理を開始

メモは絶対に送らない(payload に含めない)。

### バックグラウンド送信処理

1. ネットワーク接続を確認
2. Supabase Storage に画像 2 つをアップロード(`featured-photos/candidates/{user_id}/{date}.jpg` と `_thumb.jpg`)
3. 成功したら Storage URL を取得
4. `featured_candidates` テーブルに INSERT (`status = 'pending'`)
5. 成功したら entries テーブルを更新:
   - `featured_submitted = 1`
   - `featured_candidate_id = <返却された id>`
   - `featured_status_cache = 'pending'`
6. `pending_uploads` レコードを削除
7. 失敗した場合:
   - `attempt_count` を増やして再試行スケジュール
   - 指数バックオフ: 30 秒・2 分・10 分(`Math.pow(5, attempt_count) * 30 seconds` のような)
   - 3 回失敗で UI に「送信失敗、タップで再送」を表示

### 翌日 0:00 を過ぎた場合

`pending_uploads` の `featured_candidate` 種別は、対象 entry の date が「昨日以前」になった時点で削除する(意味がなくなる)。
ローカルの entry には「送信失敗、もう送れません」と表示。

### 取り下げ操作

写真記録フォーム(編集モード)に「参加を取り下げる」ボタンが表示される条件と挙動:

| 現在のステータス | ボタン表示 | 取り下げ時の挙動 |
|---|---|---|
| 送信前(`pending_uploads` 内) | はい | ローカルキューから削除 |
| `pending` | はい | RPC `withdraw_my_candidate` 経由で DB レコード削除 + Storage 削除(Edge Function 経由) |
| `approved` | はい | RPC で `status = withdrawn` に更新 |
| `scheduled` | はい | RPC で `status = withdrawn` に更新 |
| `featured` | いいえ | ボタン非表示(ユーザー取り下げ不可) |
| `withdrawn` / `rejected` | いいえ | 既に取り下げ済 |
| `hidden` | いいえ | 管理者が非表示にしている |

ボタンタップ後、確認ダイアログを必ず出す。

---

## 5. 今日のペット抽選(サーバー側 Cron)

### 抽選バッチ(23:00 JST 実行)

対象期間: 「明日 = JST で 0:00 から 23:59 まで掲載される日」
プール: 抽選バッチ実行時点で `entry_date = 今日(JST 基準)`、`status = 'pending'`、`reports_count = 0` の候補

処理手順:

1. プールを取得
2. 直近 14 日間に featured になったユーザー (`featured_pets.user_id`) のリストを取得
3. プールからその 14 日リストに含まれるユーザーを除外
4. 除外後の件数が 0 件なら、除外せずに全プールを使う(初期はユーザー数が少ないため)
5. 各候補の重みを計算: `weight = max(1, min(featured_weight_streak, 30))`
6. 重み付きランダム抽選で 1 件を選出
7. 選出した候補の `status` を `'scheduled'` に変更
8. 管理者にメール通知(任意。Edge Function から SMTP 経由)

該当 0 件の場合は何もしない。翌朝の publish 時に「掲載なし」となる。

### 管理者承認

管理画面で `scheduled` 状態の候補を確認:
- 承認 → `status = 'approved'`(これが翌朝の publish 対象)
- 却下 → `status = 'rejected'`
- 別の候補に差し替え → 別の pending 候補を承認に変更(元の scheduled は rejected に)

管理者は朝 07:00 (JST) までに対応する。期限を過ぎたら自動 publish は scheduled のままでは行わない(approved 必須)。

### 公開バッチ(07:00 JST 実行)

対象: `entry_date = 昨日(JST 基準)`、`status = 'approved'` の候補

処理手順:

1. 該当候補を 1 件取得(複数あれば最新の reviewed_at で 1 件)
2. featured-photos バケットから featured-archive バケットへ画像をコピー(原画像とサムネイル両方)
3. `featured_pets` に INSERT:
   - candidate_id, user_id, featured_date(今日 in JST)
   - archive_image_url, archive_thumb_url(コピー先)
   - title, pet_names_display(候補からコピー)
   - status = 'visible'
4. 候補の `status` を `'featured'` に更新
5. 投稿ユーザーにプッシュ通知送信

該当 0 件の場合は何もしない。「今日のペット」画面では「準備中です」表示になる。

### クリーンアップバッチ(00:10 JST 実行)

対象: `entry_date` が「昨日以前」のすべての featured_candidates

処理手順:

1. 該当レコードを取得
2. 各レコードに対応する Storage 上の画像(`featured-photos/candidates/{user_id}/{date}.jpg` と `_thumb.jpg`)を削除
3. featured_candidates レコードを削除

featured_pets はこのバッチでは触らない(archive バケットに別途コピー済み)。
ON DELETE SET NULL により featured_pets.candidate_id は NULL になる。

---

## 6. 今日のペット表示の取得

### 画面オープン時

1. AsyncStorage から `featured_pet_today_cache` を読む
2. キャッシュの日付が「今日 in JST」と一致する → 即座に表示
3. 一致しない or キャッシュなし → 「読み込み中」表示
4. サーバーに `public_featured_pet_today` view をクエリ
5. 結果を表示 + キャッシュを更新

### リアクション数のリフレッシュ

- 画面表示後、5 秒に 1 回程度の頻度で再取得(画面アクティブ時のみ)
- v1.0 では Supabase Realtime 購読まで実装しなくてよい(ポーリングで十分)

### 画像の取得

`expo-image` のディスクキャッシュを使う。同じ URL は自動でキャッシュされ、2 回目以降の表示は即時。

---

## 7. リアクションの送信

### ボタンタップ時

入力: 押されたリアクション種別(cute / beautiful / cool / like)

1. ローカルキャッシュ(AsyncStorage `reactions:{featured_pet_id}`)から押下済リアクションリストを取得
2. 既に同種別が含まれる場合 → 取り消し処理
3. 含まれない場合 → 追加処理

### 追加処理

1. UI のリアクション数を即座に +1(楽観的更新)
2. リアクション種別を「押下済」としてハイライト
3. ローカルキャッシュに追加
4. `pending_uploads` に `type = 'reaction_add'` を追加
5. バックグラウンド送信処理を起動
   - ログイン済: `INSERT INTO featured_reactions(featured_pet_id, reaction_type, user_id)` を実行
   - 未ログイン: RPC `add_anon_reaction(featured_pet_id, reaction_type, device_id)` を実行
6. 成功: pending_uploads から削除
7. 失敗: 指数バックオフでリトライ
   - 重複エラー(unique violation): 既に成功したものとして pending_uploads から削除

### 取り消し処理

1. UI のリアクション数を即座に -1(下限は 0)
2. 「押下済」ハイライトを解除
3. ローカルキャッシュから削除
4. `pending_uploads` に `type = 'reaction_delete'` を追加
5. バックグラウンド送信処理:
   - ログイン済: `DELETE FROM featured_reactions WHERE ...` を実行
   - 未ログイン: RPC `delete_anon_reaction(...)` を実行

### 同一画面内での連打対策

楽観的更新中(送信前)に同じボタンを連打されても、ローカルキャッシュの状態を真として扱う。実際のサーバー送信は最終状態のみ送るよう、送信前に重複キューを統合(デバウンス)する。

---

## 8. 当日中の編集判定

### 「今日」の境界

- ユーザーが写真記録フォーム(編集モード)を開こうとした時、その記録の date を Asia/Tokyo の今日と比較
- 一致する場合のみ編集モードで開く
- 一致しない場合は閲覧モード(日別詳細画面と同じ表示)で開く

### 編集可能な項目

当日中の記録に対して編集可能なのは:

- 写真の差し替え
- タイトル
- メモ
- 写っているペット(Pro)
- 記念日タグ
- 今日のペット参加トグル

連続日数や featured_weight_streak は編集では変化しない。

---

## 9. 写真リサイズ・サムネイル生成

### 処理タイミング

写真記録フォームで「保存」がタップされた時、ローカル保存前に実施。

### 仕様

| 種別 | 長辺 | 形式 | quality |
|---|---|---|---|
| 原画像 | 1600 px | JPEG | 0.85 |
| サムネイル | 400 px | JPEG | 0.7 |

正方形クロップなどは行わず、アスペクト比は保持。`expo-image-manipulator` の `resize` オプションで実現。

### カメラロール連動

設定の「カメラロールにも保存」が ON の場合、リサイズ前の元データを `expo-media-library` で別途保存。アプリ専用アルバムを作成する(例:アプリ名と同名のアルバム)。

---

## 10. Pro 状態の検証

### 起動時

1. SQLite の `pro_state` を読む
2. `purchased = 1` なら StoreKit でレシート再検証
   - ライブラリ: `expo-iap` または `react-native-iap`
   - サーバーに送らずローカル検証で十分(v1.0)
3. 月額プランかつ `expires_at` を超過していたら `purchased = 0` に戻す
4. オフライン時:
   - `last_verified_at` から 7 日以内なら前回状態を信用
   - 7 日超過なら一時的に Pro 機能を無効化、警告メッセージ表示

### 購入時

1. Apple In-App Purchase の購入フロー実行
2. 成功 → トランザクションをファイナライズ
3. SQLite の `pro_state` を更新(plan, product_id, original_transaction_id, purchased_at, expires_at)
4. UI を Pro モードに切り替え

### 復元購入

1. ユーザーが「購入を復元する」をタップ
2. StoreKit に問い合わせて過去の購入を取得
3. 有効な購入があれば `pro_state` を更新
4. なければ「復元できる購入が見つかりませんでした」を表示

### プラン切り替え

買い切りと月額の両方を同時購入することは想定しない。
- 月額契約中に買い切りを購入 → 月額は次回更新時にユーザー自身が解約する案内を表示
- 買い切り済みで月額を購入しようとすると → 「既に Pro が有効です」エラー

---

## 11. ペット選択の永続化

### 選択中ペットの状態

`settings.selected_pet_id` に保存。

ルール:
- 起動時に読み込んでメモリに保持
- ペットフィルター切り替え時に更新
- ペット削除時に削除対象が selected_pet_id だったら、別のペットに切り替え

### ペットフィルター

ホームとカレンダーで共有(別々の設定にしない)。`settings.pet_filter` に保存:
- `'all'`: 全ペット
- `pet_id`: 特定のペット

無料ユーザーは常に `'all'` 相当(フィルタしない)。

---

## 12. 起動時の整合性チェック

アプリ起動時に以下の順で実行:

1. SQLite テーブルのマイグレーション実行
2. `pets` が 0 件 → オンボーディングへ強制リダイレクト
3. `streak_state` / `pro_state` レコードがなければ初期作成
4. `settings.device_id` がなければ新規 UUID 生成して保存
5. `settings.selected_pet_id` が現存しない pet_id を指していたら、最初の pet に修正
6. FileSystem 整合性チェック:
   - entries の image_uri / thumbnail_uri が存在しない → entries は残すが「壊れた状態」フラグを立てる(または別カラムで管理。Claude Code の実装判断)
   - pets の icon_uri が存在しない → NULL に書き換え
7. pending_uploads のフラッシュをバックグラウンドで開始
8. Pro 状態の検証をバックグラウンドで開始
9. ログイン済かつ通知許可済なら Push Token 取得・更新

---

## 13. ログアウト時の挙動

1. Supabase Auth のサインアウト
2. `users.push_token` を NULL に更新(成功時)
3. ローカルの認証情報を削除
4. アプリは引き続きログイン不要機能で動作

ログアウトしても以下は消えない:

- 端末ローカルの写真記録
- 端末ローカルのペット情報
- Pro 状態(Apple アカウント単位の購入なのでログアウトと無関係)

---

## 14. アカウント削除時の挙動

1. 確認ダイアログ表示
2. 同意した場合 Supabase Edge Function `delete_my_account` を呼ぶ
3. Edge Function 内で:
   - 自身が投稿した featured_candidates を削除(Storage 含む)
   - 自身の reactions を削除
   - 自身の reports を削除
   - `auth.users` から物理削除 (CASCADE で users と関連全削除)
4. クライアント側でログアウト処理
5. ホームに戻る

featured_pets レコードは user_id が NULL になるが、写真と「掲載された事実」自体は残る(他のユーザーが掲載写真を閲覧した記憶を尊重)。
端末ローカルデータは消さない。

---

## 15. ペット選択シートのカレンダー連動

ペットフィルターを変更したとき:

- ホーム: 過去の思い出 1 枚を選び直す(選択中ペットの記録の中から)
- カレンダー: グリッドを再描画(選択中ペットの記録のサムネイルだけ表示)
- 記念日一覧: 選択中ペットの記録だけ表示

無料ユーザー: フィルター = `'all'` 固定なので絞り込みは発生しない。
