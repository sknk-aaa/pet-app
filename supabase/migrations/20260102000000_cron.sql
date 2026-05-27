-- ============================================================
-- pg_cron によるバッチ処理スケジュール
-- Edge Function の URL は環境変数 SUPABASE_URL から解決
-- JST 表記: UTC に -9h 換算済み
-- ============================================================

-- 翌日掲載候補の抽選 (23:00 JST = 14:00 UTC)
SELECT cron.schedule(
  'select-tomorrow-candidate',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.settings.supabase_url') || '/functions/v1/select-candidate',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- 今日のペット公開 + アーカイブコピー + プッシュ通知 (07:00 JST = 22:00 UTC 前日)
SELECT cron.schedule(
  'publish-today-featured-pet',
  '0 22 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.settings.supabase_url') || '/functions/v1/publish-featured',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- 前日の候補 + Storage クリーンアップ (00:10 JST = 15:10 UTC)
SELECT cron.schedule(
  'cleanup-yesterday-candidates',
  '10 15 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.settings.supabase_url') || '/functions/v1/cleanup-candidates',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- プッシュ通知再試行 (5 分おき)
SELECT cron.schedule(
  'retry-pending-pushes',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.settings.supabase_url') || '/functions/v1/send-featured-push',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := '{"mode":"retry"}'::jsonb
  );
  $$
);
