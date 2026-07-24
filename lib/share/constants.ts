export const SHARE_MAX_BYTES = 65_536;
export const SHARE_TTL_DAYS = [1, 3, 7] as const;
export type ShareTtlDays = (typeof SHARE_TTL_DAYS)[number];
export const SHARE_CODE_LENGTH = 8;
export const SHARE_CODE_PATTERN = /^[0-9a-z]{8}$/;
export const SHARE_CREATE_RATE_LIMIT = 10;
export const SHARE_CREATE_RATE_WINDOW_MS = 60 * 60 * 1000;
