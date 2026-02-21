import { given, then, useThen, when } from 'test-fns';

import { genBrainCli } from '../../rhachet/genBrainCli';

const SLUG_HAIKU = 'claude@anthropic/claude/haiku';
const CWD = process.cwd();

describe('genBrainCli.dispatch.sequential.reboot', () => {
  given('[case1] sequential asks across reboots (with --resume)', () => {
    when('[t0] two asks are dispatched', () => {
      const result = useThen('both asks succeed', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

        // boot and first ask
        await brain.executor.boot({ mode: 'dispatch' });
        const outputFirst = await brain.ask({
          prompt: 'respond with just the word ok',
        });

        // reboot and second ask (process may exit after each dispatch completion)
        await brain.executor.boot({ mode: 'dispatch' });
        const outputSecond = await brain.ask({
          prompt: 'respond with just the word yes',
        });

        // capture series after both asks
        const seriesAfter = brain.memory.series;

        // cleanup
        brain.executor.kill();

        return { outputFirst, outputSecond, seriesAfter };
      });

      then('first BrainOutput has non-zero tokens', () => {
        expect(result.outputFirst.metrics.size.tokens.input).toBeGreaterThan(0);
        expect(result.outputFirst.metrics.size.tokens.output).toBeGreaterThan(
          0,
        );
      });

      then('second BrainOutput has non-empty output text', () => {
        expect(result.outputSecond.output).toBeDefined();
        expect(result.outputSecond.output.length).toBeGreaterThan(0);
        // note: token counts may be 0 on --resume (CLI does not report them on resumed sessions)
      });

      then('each BrainOutput has independent output', () => {
        // both should have non-empty output text — proves independent results
        expect(result.outputFirst.output.length).toBeGreaterThan(0);
        expect(result.outputSecond.output.length).toBeGreaterThan(0);

        // metrics are independent (not cumulative) — both have their own size.chars
        expect(result.outputFirst.metrics.size.chars.output).toBeGreaterThan(0);
        expect(result.outputSecond.metrics.size.chars.output).toBeGreaterThan(
          0,
        );
      });

      then(
        'series has exactly 1 episode (same context window via --resume)',
        () => {
          expect(result.seriesAfter).not.toBeNull();
          expect(result.seriesAfter!.episodes.length).toEqual(1);
        },
      );

      then('that episode has 2 exchanges (one per ask)', () => {
        const episode = result.seriesAfter!.episodes[0]!;
        expect(episode.exchanges.length).toEqual(2);
      });

      then('each exchange has its own input and output', () => {
        const episode = result.seriesAfter!.episodes[0]!;
        const [first, second] = episode.exchanges;

        // first exchange
        expect(first!.input).toContain('ok');
        expect(first!.output.length).toBeGreaterThan(0);

        // second exchange
        expect(second!.input).toContain('yes');
        expect(second!.output.length).toBeGreaterThan(0);
      });
    });
  });
});
