import type { ContextBrainAuth } from '../rhachet/ContextBrainAuth';
import type { BrainAuthAnthropic } from './BrainAuthAnthropic';

/**
 * .what = construct the nested auth context from a BrainAuthAnthropic via shape
 * .why = shared test helper — all integration tests use the same pattern
 */
export const genContextBrainAuthAnthropic = (input: {
  via: BrainAuthAnthropic['via'];
}): ContextBrainAuth<{ anthropic: BrainAuthAnthropic }> => ({
  brain: { auth: { anthropic: { via: input.via } } },
});
