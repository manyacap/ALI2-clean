// constants.ts
export const TIMEOUTS = {
  HISTORY_LIMIT:        10,
  STT_LISTENING_MS:  10_000,
  STT_PROCESSING_MS:  8_000,
  RETRY_BASE_DELAY_MS: 1_000,
  RETRY_MAX_DELAY_MS: 30_000,
  MAX_RETRIES:            3,
} as const;
