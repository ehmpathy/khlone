import type { BrainSeries } from 'rhachet';

import type { AnthropicBrainCliConfig } from './BrainCli.config';

/**
 * .what = compute CLI args for dispatch mode boot
 * .why = deterministic arg assembly — pure function, tested in isolation
 */
export const getOneDispatchArgs = (input: {
  config: AnthropicBrainCliConfig;
  taskMode: 'ask' | 'act';
  series: BrainSeries | null;
}): string[] => {
  // base dispatch args — headless structured i/o
  const args: string[] = [
    '-p',
    '--model',
    input.config.model,
    '--output-format',
    'stream-json',
    '--input-format',
    'stream-json',
    '--verbose',
  ];

  // enforce tool set per task mode
  const tools = input.config.tools[input.taskMode];
  args.push('--allowedTools', tools.join(','));

  // resume prior series if extant
  if (input.series?.exid) {
    args.push('--resume', input.series.exid);
  }

  return args;
};
