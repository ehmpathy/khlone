import type { PickOne } from 'type-fns';

/**
 * .what = auth shape for the anthropic brain CLI supplier
 * .why = explicit auth — callers declare api key or oauth intent
 */
export type BrainAuthAnthropic = {
  via: PickOne<{
    oauth: true;
    apiKey: string;
  }>;
};

/**
 * .what = type guard for BrainAuthAnthropic
 * .why = suppliers validate auth at runtime — no unsafe `as` cast
 */
export const isBrainAuthAnthropic = (
  input: unknown,
): input is BrainAuthAnthropic => {
  if (!input || typeof input !== 'object') return false;
  const candidate = input as Record<string, unknown>;
  if (!candidate.via || typeof candidate.via !== 'object') return false;
  const via = candidate.via as Record<string, unknown>;
  return via.oauth === true || typeof via.apiKey === 'string';
};
