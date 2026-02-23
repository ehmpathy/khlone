/**
 * .what = generic auth context for brain CLI processes
 * .why = each supplier defines its own auth shape keyed by supplier name;
 *        callers can narrow the generic for compile-time safety
 *
 * .note = nested key context.brain.auth.<supplier> (e.g., .anthropic, .openai)
 *         namespaces auth per supplier — can disambiguate later if needed
 */
export type ContextBrainAuth<
  TBrainAuthSupply extends Record<string, any> = Record<string, unknown>,
> = {
  brain?: {
    auth?: TBrainAuthSupply;
  };
};
