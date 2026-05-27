-- ============================================================
-- 開発用シードデータ
-- supabase db reset 時に自動投入される
-- ============================================================

-- ---- テストユーザー (auth.users) ----
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@example.com',
    crypt('password123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'user1@example.com',
    crypt('password123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'user2@example.com',
    crypt('password123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  )
ON CONFLICT (id) DO NOTHING;

-- ---- public.users (トリガーで自動作成されるが、is_admin を手動で設定) ----
INSERT INTO public.users (id, is_admin, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', true,  now(), now()),
  ('00000000-0000-0000-0000-000000000002', false, now(), now()),
  ('00000000-0000-0000-0000-000000000003', false, now(), now())
ON CONFLICT (id) DO UPDATE SET is_admin = EXCLUDED.is_admin;

-- ---- featured_candidates ----
INSERT INTO public.featured_candidates (
  id, user_id, entry_date,
  cloud_image_url, thumbnail_url,
  title, pet_names_display, pet_species_primary,
  status, featured_weight_streak
) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_DATE,
    'https://placedog.net/1600/1200',
    'https://placedog.net/400/400',
    '窓辺でひなたぼっこ中のポチ',
    'ポチ', 'dog',
    'pending', 5
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    CURRENT_DATE,
    'https://placekitten.com/1600/1200',
    'https://placekitten.com/400/400',
    'おやつをねだるタマ',
    'タマ', 'cat',
    'scheduled', 12
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_DATE - 1,
    'https://placedog.net/1600/900',
    'https://placedog.net/400/300',
    '昨日の散歩帰りのポチ',
    'ポチ', 'dog',
    'featured', 4
  )
ON CONFLICT (user_id, entry_date) DO NOTHING;

-- ---- featured_pets ----
INSERT INTO public.featured_pets (
  id, candidate_id, user_id, featured_date,
  archive_image_url, archive_thumb_url,
  title, pet_names_display, status
) VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_DATE - 1,
    'https://placedog.net/1600/900',
    'https://placedog.net/400/300',
    '昨日の散歩帰りのポチ',
    'ポチ',
    'visible'
  )
ON CONFLICT (featured_date) DO NOTHING;

-- ---- featured_reactions ----
INSERT INTO public.featured_reactions (featured_pet_id, user_id, reaction_type)
VALUES
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'cute'),
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'cute'),
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'like')
ON CONFLICT DO NOTHING;

-- ---- reports ----
INSERT INTO public.reports (featured_pet_id, reporter_user_id, reason, status)
VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'other',
    'open'
  )
ON CONFLICT DO NOTHING;
