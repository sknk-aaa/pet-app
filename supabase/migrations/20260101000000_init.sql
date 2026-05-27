-- ============================================================
-- 拡張
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE public.users (
  id                              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name                    text,
  is_admin                        boolean NOT NULL DEFAULT false,
  push_token                      text,
  notification_featured_enabled   boolean NOT NULL DEFAULT true,
  banned_at                       timestamptz,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_is_admin_idx ON public.users(is_admin) WHERE is_admin = true;

-- ------------------------------------------------------------

CREATE TABLE public.featured_candidates (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id               text,
  entry_date              date NOT NULL,
  cloud_image_url         text NOT NULL,
  thumbnail_url           text NOT NULL,
  title                   text NOT NULL,
  pet_names_display       text NOT NULL,
  pet_species_primary     text,
  status                  text NOT NULL DEFAULT 'pending',
  featured_weight_streak  integer NOT NULL DEFAULT 1,
  reports_count           integer NOT NULL DEFAULT 0,
  submitted_at            timestamptz NOT NULL DEFAULT now(),
  reviewed_at             timestamptz,
  reviewed_by             uuid REFERENCES public.users(id),
  reject_reason           text,
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT featured_candidates_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'scheduled', 'featured', 'hidden')),
  UNIQUE(user_id, entry_date)
);

CREATE INDEX featured_candidates_status_idx    ON public.featured_candidates(status);
CREATE INDEX featured_candidates_entry_date_idx ON public.featured_candidates(entry_date);
CREATE INDEX featured_candidates_user_id_idx   ON public.featured_candidates(user_id);

-- ------------------------------------------------------------

-- user_id は ON DELETE SET NULL: アカウント削除後も掲載履歴は残す
CREATE TABLE public.featured_pets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id        uuid REFERENCES public.featured_candidates(id) ON DELETE SET NULL,
  user_id             uuid REFERENCES public.users(id) ON DELETE SET NULL,
  featured_date       date NOT NULL UNIQUE,
  archive_image_url   text NOT NULL,
  archive_thumb_url   text NOT NULL,
  title               text NOT NULL,
  pet_names_display   text NOT NULL,
  status              text NOT NULL DEFAULT 'visible',
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT featured_pets_status_check
    CHECK (status IN ('visible', 'hidden'))
);

CREATE INDEX featured_pets_user_id_idx ON public.featured_pets(user_id);
CREATE INDEX featured_pets_status_idx  ON public.featured_pets(status);

-- ------------------------------------------------------------

CREATE TABLE public.featured_reactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_pet_id   uuid NOT NULL REFERENCES public.featured_pets(id) ON DELETE CASCADE,
  user_id           uuid REFERENCES public.users(id) ON DELETE CASCADE,
  device_id         text,
  reaction_type     text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT featured_reactions_type_check
    CHECK (reaction_type IN ('cute', 'beautiful', 'cool', 'like')),
  CONSTRAINT featured_reactions_identifier_check
    CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)
);

CREATE UNIQUE INDEX featured_reactions_user_unique
  ON public.featured_reactions(featured_pet_id, reaction_type, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX featured_reactions_device_unique
  ON public.featured_reactions(featured_pet_id, reaction_type, device_id)
  WHERE user_id IS NULL;

CREATE INDEX featured_reactions_featured_pet_id_idx ON public.featured_reactions(featured_pet_id);

-- ------------------------------------------------------------

-- reporter_user_id: ON DELETE SET NULL でアカウント削除後も通報記録を保持
CREATE TABLE public.reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_pet_id     uuid NOT NULL REFERENCES public.featured_pets(id) ON DELETE CASCADE,
  reporter_user_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reason              text NOT NULL,
  detail              text,
  status              text NOT NULL DEFAULT 'open',
  reviewed_at         timestamptz,
  reviewed_by         uuid REFERENCES public.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_reason_check
    CHECK (reason IN ('inappropriate', 'privacy', 'copyright', 'other')),
  CONSTRAINT reports_status_check
    CHECK (status IN ('open', 'reviewed', 'resolved')),
  UNIQUE(featured_pet_id, reporter_user_id)
);

CREATE INDEX reports_status_idx         ON public.reports(status);
CREATE INDEX reports_featured_pet_id_idx ON public.reports(featured_pet_id);

-- ============================================================
-- updated_at 自動更新
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER featured_candidates_set_updated_at
  BEFORE UPDATE ON public.featured_candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- VIEWS
-- ============================================================

CREATE VIEW public.public_featured_pet_today AS
SELECT
  fp.id,
  fp.featured_date,
  fp.archive_image_url                              AS image_url,
  fp.archive_thumb_url                              AS thumb_url,
  fp.title,
  fp.pet_names_display,
  COALESCE(r.cute_count,      0)                   AS cute_count,
  COALESCE(r.beautiful_count, 0)                   AS beautiful_count,
  COALESCE(r.cool_count,      0)                   AS cool_count,
  COALESCE(r.like_count,      0)                   AS like_count
FROM public.featured_pets fp
LEFT JOIN (
  SELECT
    featured_pet_id,
    SUM(CASE WHEN reaction_type = 'cute'      THEN 1 ELSE 0 END) AS cute_count,
    SUM(CASE WHEN reaction_type = 'beautiful' THEN 1 ELSE 0 END) AS beautiful_count,
    SUM(CASE WHEN reaction_type = 'cool'      THEN 1 ELSE 0 END) AS cool_count,
    SUM(CASE WHEN reaction_type = 'like'      THEN 1 ELSE 0 END) AS like_count
  FROM public.featured_reactions
  GROUP BY featured_pet_id
) r ON r.featured_pet_id = fp.id
WHERE fp.status = 'visible'
  AND fp.featured_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo')::date;

GRANT SELECT ON public.public_featured_pet_today TO anon, authenticated;

-- ------------------------------------------------------------

CREATE VIEW public.my_featured_history AS
SELECT
  fp.id,
  fp.featured_date,
  fp.archive_image_url                              AS image_url,
  fp.archive_thumb_url                              AS thumb_url,
  fp.title,
  fp.pet_names_display,
  fp.user_id,
  COALESCE(r.cute_count,      0)                   AS cute_count,
  COALESCE(r.beautiful_count, 0)                   AS beautiful_count,
  COALESCE(r.cool_count,      0)                   AS cool_count,
  COALESCE(r.like_count,      0)                   AS like_count
FROM public.featured_pets fp
LEFT JOIN (
  SELECT
    featured_pet_id,
    SUM(CASE WHEN reaction_type = 'cute'      THEN 1 ELSE 0 END) AS cute_count,
    SUM(CASE WHEN reaction_type = 'beautiful' THEN 1 ELSE 0 END) AS beautiful_count,
    SUM(CASE WHEN reaction_type = 'cool'      THEN 1 ELSE 0 END) AS cool_count,
    SUM(CASE WHEN reaction_type = 'like'      THEN 1 ELSE 0 END) AS like_count
  FROM public.featured_reactions
  GROUP BY featured_pet_id
) r ON r.featured_pet_id = fp.id
WHERE fp.status = 'visible'
  AND fp.user_id = auth.uid();

GRANT SELECT ON public.my_featured_history TO authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ---- users ----
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own user readable"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "own user updatable"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = false);

CREATE POLICY "admin can manage users"
  ON public.users FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- ---- featured_candidates ----
ALTER TABLE public.featured_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own candidates readable"
  ON public.featured_candidates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "non-banned can insert candidate"
  ON public.featured_candidates FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND banned_at IS NOT NULL
    )
  );

CREATE POLICY "admin can manage candidates"
  ON public.featured_candidates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- ---- featured_pets ----
ALTER TABLE public.featured_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visible featured pets public"
  ON public.featured_pets FOR SELECT
  TO anon, authenticated
  USING (status = 'visible');

CREATE POLICY "admin can manage featured pets"
  ON public.featured_pets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- ---- featured_reactions ----
ALTER TABLE public.featured_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions readable for aggregation"
  ON public.featured_reactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "logged in can react"
  ON public.featured_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "logged in can unreact"
  ON public.featured_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---- reports ----
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own reports readable"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_user_id);

CREATE POLICY "logged in can report"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "admin can manage reports"
  ON public.reports FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- RPC 関数
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_anon_reaction(
  p_featured_pet_id  uuid,
  p_reaction_type    text,
  p_device_id        text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.featured_reactions (featured_pet_id, reaction_type, device_id)
  VALUES (p_featured_pet_id, p_reaction_type, p_device_id)
  ON CONFLICT DO NOTHING;
END $$;

GRANT EXECUTE ON FUNCTION public.add_anon_reaction TO anon;

-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.delete_anon_reaction(
  p_featured_pet_id  uuid,
  p_reaction_type    text,
  p_device_id        text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.featured_reactions
  WHERE featured_pet_id = p_featured_pet_id
    AND reaction_type   = p_reaction_type
    AND device_id       = p_device_id
    AND user_id IS NULL;
END $$;

GRANT EXECUTE ON FUNCTION public.delete_anon_reaction TO anon;

-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.withdraw_my_candidate(p_candidate_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
  FROM public.featured_candidates
  WHERE id = p_candidate_id AND user_id = auth.uid();

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Candidate not found or not owned by user';
  END IF;

  IF v_status = 'pending' THEN
    -- Storage 削除は withdraw-candidate Edge Function が担当
    DELETE FROM public.featured_candidates WHERE id = p_candidate_id;
  ELSIF v_status IN ('approved', 'scheduled') THEN
    UPDATE public.featured_candidates
    SET status = 'withdrawn', updated_at = now()
    WHERE id = p_candidate_id;
  ELSE
    RAISE EXCEPTION 'Cannot withdraw candidate in status %', v_status;
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.withdraw_my_candidate TO authenticated;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- auth.users INSERT → public.users 自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (NEW.id, now(), now())
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------

-- reports INSERT → featured_candidates.reports_count +1
CREATE OR REPLACE FUNCTION public.increment_reports_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.featured_candidates
  SET reports_count = reports_count + 1
  WHERE id = (
    SELECT candidate_id FROM public.featured_pets WHERE id = NEW.featured_pet_id
  );
  RETURN NEW;
END $$;

CREATE TRIGGER on_report_created
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.increment_reports_count();

-- ============================================================
-- STORAGE バケット
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('featured-photos',  'featured-photos',  true, 5242880, ARRAY['image/jpeg']),
  ('featured-archive', 'featured-archive', true, 5242880, ARRAY['image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- featured-photos ポリシー
CREATE POLICY "own candidate upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'featured-photos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "public read featured photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'featured-photos');

CREATE POLICY "own candidate delete from photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'featured-photos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- featured-archive ポリシー
CREATE POLICY "public read archive"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'featured-archive');

CREATE POLICY "admin write archive"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'featured-archive'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
