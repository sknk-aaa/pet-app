export const REACTION_TYPES = ['cute', 'beautiful', 'cool', 'like'] as const
export type ReactionType = typeof REACTION_TYPES[number]

export const CANDIDATE_STATUSES = [
  'pending', 'approved', 'rejected', 'withdrawn', 'scheduled', 'featured', 'hidden',
] as const
export type CandidateStatus = typeof CANDIDATE_STATUSES[number]

export const REPORT_REASONS = ['inappropriate', 'privacy', 'copyright', 'other'] as const
export type ReportReason = typeof REPORT_REASONS[number]

export const TIMEZONE = 'Asia/Tokyo'

export const FEATURED_WEIGHT_MAX = 30
