import * as FileSystem from 'expo-file-system';
import { decode as base64Decode } from 'base64-arraybuffer';
import { supabase } from '@/services/supabase';
import {
  getPendingUploads,
  updateAttempt,
  deletePendingUpload,
  cleanExpiredFeaturedCandidates,
} from '@/db/pendingUploads';
import { updateEntryFeaturedState } from '@/db/entries';
import { getStreakState } from '@/db/streak';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { getTodayJST, getYesterdayJST } from '@/utils/date';
import type {
  PendingUpload,
  FeaturedCandidatePayload,
  ReactionPayload,
  ReportPayload,
} from '@/types';

const BACKOFF_SECONDS = [30, 120, 600]; // attempt 1→2→3

function shouldRetry(upload: PendingUpload): boolean {
  if (upload.attempt_count >= 3) return false;
  if (!upload.last_attempt_at) return true;
  const elapsed =
    (Date.now() - new Date(upload.last_attempt_at).getTime()) / 1000;
  return elapsed >= (BACKOFF_SECONDS[upload.attempt_count - 1] ?? 0);
}

function isDuplicateError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return e?.code === '23505' || (e?.message ?? '').includes('duplicate');
}

// =====================
// Main flush function
// =====================

let _flushing = false;

export async function flushPendingUploads(): Promise<void> {
  if (_flushing) return;
  _flushing = true;
  try {
    await cleanExpiredFeaturedCandidates();
    const uploads = await getPendingUploads();
    for (const upload of uploads) {
      if (!shouldRetry(upload)) continue;
      try {
        await processUpload(upload);
        await deletePendingUpload(upload.id);
      } catch (err) {
        if (isDuplicateError(err)) {
          await deletePendingUpload(upload.id);
        } else {
          await updateAttempt(upload.id, String(err));
        }
      }
    }
  } finally {
    _flushing = false;
  }
}

async function processUpload(upload: PendingUpload): Promise<void> {
  switch (upload.type) {
    case 'featured_candidate':
      return processFeaturedCandidate(upload);
    case 'reaction_add':
      return processReactionAdd(upload);
    case 'reaction_delete':
      return processReactionDelete(upload);
    case 'report':
      return processReport(upload);
  }
}

// =====================
// featured_candidate
// =====================

async function processFeaturedCandidate(upload: PendingUpload): Promise<void> {
  const payload = JSON.parse(upload.payload) as FeaturedCandidatePayload;
  const today = getTodayJST();
  const yesterday = getYesterdayJST();

  // 翌日以降なら自動キャンセル
  if (payload.entry_date < today && payload.entry_date <= yesterday) {
    return; // caller で deletePendingUpload される
  }

  const session = useAuthStore.getState().session;
  if (!session) throw new Error('not authenticated');

  const userId = session.user.id;
  const dateStr = payload.entry_date; // 'YYYY-MM-DD'

  // 画像を読み込んで Storage にアップロード
  const [imageData, thumbData] = await Promise.all([
    readFileAsBase64(payload.image_uri),
    readFileAsBase64(payload.thumbnail_uri),
  ]);

  const imagePath = `candidates/${userId}/${dateStr}.jpg`;
  const thumbPath = `candidates/${userId}/${dateStr}_thumb.jpg`;

  await uploadToStorage(imagePath, imageData);
  await uploadToStorage(thumbPath, thumbData);

  const { data: urlData } = supabase.storage.from('featured-photos').getPublicUrl(imagePath);
  const { data: thumbUrlData } = supabase.storage.from('featured-photos').getPublicUrl(thumbPath);

  const streakState = await getStreakState();

  // featured_candidates INSERT
  const { data: candidate, error } = await supabase
    .from('featured_candidates')
    .insert({
      user_id:               userId,
      entry_date:            dateStr,
      cloud_image_url:       urlData.publicUrl,
      thumbnail_url:         thumbUrlData.publicUrl,
      title:                 payload.title,
      pet_names_display:     payload.pet_names_display,
      pet_species_primary:   payload.pet_species_primary,
      featured_weight_streak: Math.min(streakState.featured_weight_streak, 30),
      status:                'pending',
    })
    .select('id')
    .single();
  if (error) throw error;

  // entries の featured_* カラム更新
  await updateEntryFeaturedState(
    payload.entry_id, 1, candidate.id, 'pending'
  );
}

async function readFileAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function uploadToStorage(path: string, base64Data: string): Promise<void> {
  const { error } = await supabase.storage
    .from('featured-photos')
    .upload(path, base64Decode(base64Data), {
      contentType: 'image/jpeg',
      upsert: true,
    });
  if (error) throw error;
}

// =====================
// reaction_add
// =====================

async function processReactionAdd(upload: PendingUpload): Promise<void> {
  const payload = JSON.parse(upload.payload) as ReactionPayload;
  const session = useAuthStore.getState().session;

  if (session) {
    const { error } = await supabase.from('featured_reactions').insert({
      featured_pet_id: payload.featured_pet_id,
      reaction_type:   payload.reaction_type,
      user_id:         session.user.id,
    });
    if (error) throw error;
  } else {
    const { error } = await supabase.rpc('add_anon_reaction', {
      p_featured_pet_id: payload.featured_pet_id,
      p_reaction_type:   payload.reaction_type,
      p_device_id:       payload.device_id,
    });
    if (error) throw error;
  }
}

// =====================
// reaction_delete
// =====================

async function processReactionDelete(upload: PendingUpload): Promise<void> {
  const payload = JSON.parse(upload.payload) as ReactionPayload;
  const session = useAuthStore.getState().session;

  if (session) {
    const { error } = await supabase
      .from('featured_reactions')
      .delete()
      .eq('featured_pet_id', payload.featured_pet_id)
      .eq('reaction_type', payload.reaction_type)
      .eq('user_id', session.user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.rpc('delete_anon_reaction', {
      p_featured_pet_id: payload.featured_pet_id,
      p_reaction_type:   payload.reaction_type,
      p_device_id:       payload.device_id,
    });
    if (error) throw error;
  }
}

// =====================
// report
// =====================

async function processReport(upload: PendingUpload): Promise<void> {
  const payload = JSON.parse(upload.payload) as ReportPayload;
  const session = useAuthStore.getState().session;
  if (!session) throw new Error('not authenticated');

  const { error } = await supabase.from('reports').insert({
    featured_pet_id:    payload.featured_pet_id,
    reporter_user_id:   session.user.id,
    reason:             payload.reason,
    detail:             payload.detail || null,
    status:             'open',
  });
  if (error) throw error;
}
