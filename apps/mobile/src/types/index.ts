// =====================
// Union types
// =====================

export type FeaturedStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'scheduled'
  | 'featured'
  | 'hidden';

export type PendingUploadType =
  | 'featured_candidate'
  | 'reaction_add'
  | 'reaction_delete'
  | 'report';

export type ReactionType = 'cute' | 'beautiful' | 'cool' | 'like';

export type PetSpecies = 'cat' | 'dog' | 'bird' | 'rabbit' | 'hamster' | 'other';

export type PetGender = 'male' | 'female' | 'unknown';

export type AnniversaryTagType =
  | 'birthday'
  | 'memorial'
  | 'first'
  | 'outing'
  | 'other';

export type PetFilter = 'all' | string; // 'all' or pet_id

export type SettingKey =
  | 'selected_pet_id'
  | 'pet_filter'
  | 'notification_enabled'
  | 'notification_time'
  | 'notification_featured_enabled'
  | 'save_to_camera_roll'
  | 'device_id'
  | 'onboarding_completed'
  | 'last_seen_featured_date'
  | 'last_streak_sync_date';

// =====================
// SQLite row types
// =====================

export type Pet = {
  id: string;
  name: string;
  species: PetSpecies;
  species_other: string | null;
  birthday: string | null;       // 'YYYY-MM-DD'
  gender: PetGender | null;
  icon_uri: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Entry = {
  id: string;
  date: string;                   // 'YYYY-MM-DD' UNIQUE
  title: string;
  memo: string | null;
  image_uri: string;
  thumbnail_uri: string;
  anniversary_tag_type: AnniversaryTagType | null;
  anniversary_tag_name: string | null;
  featured_submitted: 0 | 1;
  featured_candidate_id: string | null;
  featured_status_cache: FeaturedStatus | null;
  created_at: string;
  updated_at: string;
};

export type EntryPet = {
  id: string;
  entry_id: string;
  pet_id: string;
  created_at: string;
};

export type StreakState = {
  id: 1;
  display_streak: number;
  featured_weight_streak: number;
  last_entry_date: string | null;
  updated_at: string;
};

export type Setting = {
  key: SettingKey;
  value: string;
};

export type ProState = {
  id: 1;
  purchased: 0 | 1;
  plan: 'lifetime' | 'monthly' | null;
  product_id: string | null;
  original_transaction_id: string | null;
  purchased_at: string | null;
  expires_at: string | null;
  last_verified_at: string | null;
  receipt_data: string | null;
};

export type PendingUpload = {
  id: string;
  type: PendingUploadType;
  payload: string;               // JSON string
  attempt_count: number;
  last_attempt_at: string | null;
  last_error: string | null;
  created_at: string;
};

// =====================
// App-layer types (JOIN results)
// =====================

export type EntryWithPets = Entry & { pets: Pet[] };

export type CalendarEntryInfo = {
  date: string;
  thumbnail_uri: string;
  anniversary_tag_type: AnniversaryTagType | null;
  featured_status_cache: FeaturedStatus | null;
};

// =====================
// Supabase view types
// =====================

export type FeaturedPetToday = {
  id: string;
  featured_date: string;
  image_url: string;
  thumb_url: string;
  title: string;
  pet_names_display: string;
  cute_count: number;
  beautiful_count: number;
  cool_count: number;
  like_count: number;
};

export type MyFeaturedHistory = {
  id: string;
  featured_date: string;
  image_url: string;
  thumb_url: string;
  title: string;
  pet_names_display: string;
  user_id: string;
  cute_count: number;
  beautiful_count: number;
  cool_count: number;
  like_count: number;
};

// =====================
// Payload types for pending_uploads
// =====================

export type FeaturedCandidatePayload = {
  entry_id: string;
  entry_date: string;
  title: string;
  pet_names_display: string;
  pet_species_primary: string;
  featured_weight_streak: number;
  image_uri: string;
  thumbnail_uri: string;
};

export type ReactionPayload = {
  featured_pet_id: string;
  reaction_type: ReactionType;
  user_id: string | null;
  device_id: string;
};

export type ReportPayload = {
  featured_pet_id: string;
  reason: string;
  detail: string;
};

// =====================
// Auth types
// =====================

export type AppUser = {
  id: string;
  push_token: string | null;
  notification_featured_enabled: boolean;
};

// =====================
// Input types for DB operations
// =====================

export type CreatePetInput = {
  name: string;
  species: PetSpecies;
  species_other?: string | null;
  birthday?: string | null;
  gender?: PetGender | null;
  icon_uri?: string | null;
  sort_order?: number;
};

export type UpdatePetInput = Partial<Omit<Pet, 'id' | 'created_at'>>;

export type CreateEntryInput = {
  date: string;
  title: string;
  memo?: string | null;
  image_uri: string;
  thumbnail_uri: string;
  anniversary_tag_type?: AnniversaryTagType | null;
  anniversary_tag_name?: string | null;
};

export type UpdateEntryInput = Partial<Omit<Entry, 'id' | 'date' | 'created_at'>>;
