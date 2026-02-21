import { given, then, useThen, when } from 'test-fns';

import { genBrainCli } from '../../rhachet/genBrainCli';

const SLUG_HAIKU = 'claude@anthropic/claude/haiku';
const CWD = process.cwd();

describe('genBrainCli.dispatch.act', () => {
  given('[case1] act on a booted dispatch handle', () => {
    when('[t0] act is called with a cheap prompt', () => {
      const result = useThen('act succeeds', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

        // boot dispatch mode
        await brain.executor.boot({ mode: 'dispatch' });

        // act with a cheap prompt
        const output = await brain.act({
          prompt: 'respond with just the word ok',
        });

        // cleanup
        brain.executor.kill();

        return { output };
      });

      then('BrainOutput has non-empty text', () => {
        expect(result.output.output).toBeDefined();
        expect(result.output.output.length).toBeGreaterThan(0);
      });

      then('BrainOutput.metrics.size.tokens.input > 0', () => {
        expect(result.output.metrics.size.tokens.input).toBeGreaterThan(0);
      });

      then('BrainOutput.metrics.size.tokens.output > 0', () => {
        expect(result.output.metrics.size.tokens.output).toBeGreaterThan(0);
      });

      then('BrainOutput.episode is defined', () => {
        expect(result.output.episode).toBeDefined();
        expect(result.output.episode.hash).toBeDefined();
      });

      then('BrainOutput.series is defined', () => {
        expect(result.output.series).toBeDefined();
        expect(result.output.series!.hash).toBeDefined();
      });
    });
  });
});
