import { BrainEpisode, BrainExchange, BrainSeries } from 'rhachet';
import { given, then, when } from 'test-fns';

import {
  type AnthropicBrainCliConfig,
  CONFIG_BY_CLI_SLUG,
} from '../BrainCli.config';
import { getOneDispatchArgs } from '../getOneDispatchArgs';

const config: AnthropicBrainCliConfig =
  CONFIG_BY_CLI_SLUG['claude@anthropic/claude/opus/v4.5'];

describe('getOneDispatchArgs', () => {
  given('ask mode with no prior series', () => {
    when('called', () => {
      then('it returns headless args with ask tools', () => {
        const args = getOneDispatchArgs({
          config,
          taskMode: 'ask',
          series: null,
        });
        expect(args).toContain('-p');
        expect(args).toContain('--model');
        const modelIndex = args.indexOf('--model');
        expect(args[modelIndex + 1]).toEqual(config.model);
        expect(args).toContain('--output-format');
        expect(args).toContain('stream-json');
        expect(args).toContain('--input-format');
        expect(args).toContain('--verbose');
        expect(args).toContain('--allowedTools');

        // ask tools should not include mutation tools
        const toolsIndex = args.indexOf('--allowedTools');
        const toolsValue = args[toolsIndex + 1]!;
        expect(toolsValue).toContain('Read');
        expect(toolsValue).toContain('Grep');
        expect(toolsValue).not.toContain('Edit');
        expect(toolsValue).not.toContain('Write');
        expect(toolsValue).not.toContain('Bash');

        // no --resume
        expect(args).not.toContain('--resume');
      });
    });
  });

  given('act mode with no prior series', () => {
    when('called', () => {
      then('it returns headless args with act tools', () => {
        const args = getOneDispatchArgs({
          config,
          taskMode: 'act',
          series: null,
        });
        const toolsIndex = args.indexOf('--allowedTools');
        const toolsValue = args[toolsIndex + 1]!;
        expect(toolsValue).toContain('Edit');
        expect(toolsValue).toContain('Write');
        expect(toolsValue).toContain('Bash');
      });
    });
  });

  given('ask mode with a prior series', () => {
    when('called', () => {
      then('it includes --resume with the series exid', () => {
        const series = new BrainSeries({
          hash: 'abc123',
          exid: 'session-uuid-here',
          episodes: [
            new BrainEpisode({
              hash: 'ep1',
              exid: null,
              exchanges: [
                new BrainExchange({
                  hash: 'ex1',
                  input: 'hi',
                  output: 'hello',
                  exid: null,
                }),
              ],
            }),
          ],
        });
        const args = getOneDispatchArgs({
          config,
          taskMode: 'ask',
          series,
        });
        expect(args).toContain('--resume');
        const resumeIndex = args.indexOf('--resume');
        expect(args[resumeIndex + 1]).toEqual('session-uuid-here');
      });
    });
  });

  given('a series with null exid', () => {
    when('called', () => {
      then('it does not include --resume', () => {
        const series = new BrainSeries({
          hash: 'abc123',
          exid: null,
          episodes: [],
        });
        const args = getOneDispatchArgs({
          config,
          taskMode: 'ask',
          series,
        });
        expect(args).not.toContain('--resume');
      });
    });
  });
});
