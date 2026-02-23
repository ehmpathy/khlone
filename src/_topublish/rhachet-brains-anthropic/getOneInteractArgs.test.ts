import { BrainSeries } from 'rhachet';
import { given, then, when } from 'test-fns';

import { getOneAnthropicBrainCliConfig } from './BrainCli.config';
import { getOneInteractArgs } from './getOneInteractArgs';

const config = getOneAnthropicBrainCliConfig({
  slug: 'claude@anthropic/claude/opus/v4.5',
});

describe('getOneInteractArgs', () => {
  given('no prior series', () => {
    when('called', () => {
      then('it returns args with --model', () => {
        const args = getOneInteractArgs({ config, series: null });
        expect(args).toContain('--model');
        const modelIndex = args.indexOf('--model');
        expect(args[modelIndex + 1]).toEqual(config.model);
        expect(args).not.toContain('--resume');
      });
    });
  });

  given('a prior series with exid', () => {
    when('called', () => {
      then('it includes --resume with the series exid', () => {
        const series = new BrainSeries({
          hash: 'abc123',
          exid: 'session-uuid-here',
          episodes: [],
        });
        const args = getOneInteractArgs({ config, series });
        expect(args).toContain('--resume');
        const resumeIndex = args.indexOf('--resume');
        expect(args[resumeIndex + 1]).toEqual('session-uuid-here');
      });
    });
  });

  given('a prior series with null exid', () => {
    when('called', () => {
      then('it returns args with --model but no --resume', () => {
        const series = new BrainSeries({
          hash: 'abc123',
          exid: null,
          episodes: [],
        });
        const args = getOneInteractArgs({ config, series });
        expect(args).toContain('--model');
        expect(args).not.toContain('--resume');
      });
    });
  });
});
