import { given, then, useThen, when } from 'test-fns';

import { genBrainCli } from '../../rhachet/genBrainCli';

const SLUG_HAIKU = 'claude@anthropic/claude/haiku';
const CWD = process.cwd();

describe('genBrainCli.dispatch.sequential.sameboot', () => {
  given('[case1] two asks on the same boot (no reboot)', () => {
    when('[t0] two asks are dispatched on the same process', () => {
      const result = useThen('both asks succeed', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

        // boot once
        await brain.executor.boot({ mode: 'dispatch' });

        // first ask
        const outputFirst = await brain.ask({
          prompt: 'respond with just the word ok',
        });

        // second ask on the same boot — no reboot
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
      });

      then('each BrainOutput has independent output', () => {
        expect(result.outputFirst.output.length).toBeGreaterThan(0);
        expect(result.outputSecond.output.length).toBeGreaterThan(0);

        // metrics are independent (not cumulative)
        expect(result.outputFirst.metrics.size.chars.output).toBeGreaterThan(0);
        expect(result.outputSecond.metrics.size.chars.output).toBeGreaterThan(
          0,
        );
      });

      // peer: genBrainCli.dispatch.withCompaction proves compaction splits into 2 episodes despite same session
      then(
        'series has exactly 1 episode — without compaction, both asks share the same context window',
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
