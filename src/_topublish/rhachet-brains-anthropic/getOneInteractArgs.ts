import type { BrainSeries } from 'rhachet';

import type { AnthropicBrainCliConfig } from './BrainCli.config';

/**
 * .what = compute CLI args for interact mode boot
 * .why = deterministic arg assembly — pure function, tested in isolation
 */
export const getOneInteractArgs = (input: {
  config: AnthropicBrainCliConfig;
  series: BrainSeries | null;
}): string[] => {
  const args: string[] = ['--model', input.config.model];

  // resume prior series if extant
  if (input.series?.exid) {
    args.push('--resume', input.series.exid);
  }

  return args;
};
