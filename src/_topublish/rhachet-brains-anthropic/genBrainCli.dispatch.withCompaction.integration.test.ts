import { UnexpectedCodePathError } from 'helpful-errors';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { genBrainCli } from '../rhachet/genBrainCli';
import { genContextBrainAuthAnthropic } from './genContextBrainAuthAnthropic';

const SLUG_HAIKU = 'claude@anthropic/claude/haiku';

// use a temp dir as cwd — avoids repo hooks that inject massive context and cause infinite compaction loops
const CWD = genTempDir({ slug: 'braincli-compact' });
const CONTEXT = {
  cwd: CWD,
  ...genContextBrainAuthAnthropic({
    via: {
      apiKey:
        process.env.ANTHROPIC_API_KEY ??
        UnexpectedCodePathError.throw(
          'ANTHROPIC_API_KEY must be set via use.apikeys.sh',
        ),
    },
  }),
};

// compaction adds an extra summarization API call — allow generous timeout
jest.setTimeout(300_000);

/**
 * .what = race an async operation against a timeout
 * .why = prevent indefinite hangs if the CLI stalls mid-compaction
 */
const withTimeout = async <T>(input: {
  promise: Promise<T>;
  ms: number;
  label: string;
}): Promise<T> => {
  const timer = new Promise<never>((_onDone, onFail) =>
    setTimeout(
      () => onFail(new Error(`timeout after ${input.ms}ms: ${input.label}`)),
      input.ms,
    ),
  );
  return Promise.race([input.promise, timer]);
};

describe('genBrainCli.dispatch.withCompaction', () => {
  given(
    '[case1] two asks with CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=1 to force compaction',
    () => {
      when('[t0] compaction fires between the two asks', () => {
        const result = useThen('both asks succeed', async () => {
          // force auto-compact at 1% of context window (~2K tokens)
          const envBefore = process.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE;
          process.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE = '1';

          try {
            const brain = await genBrainCli({ slug: SLUG_HAIKU }, CONTEXT);

            // boot once — both asks on the same process
            await brain.executor.boot({ mode: 'dispatch' });

            // first ask — populates the context window past the 1% threshold
            const outputFirst = await withTimeout({
              promise: brain.ask({
                prompt: 'respond with just the word ok',
              }),
              ms: 180_000,
              label: 'first ask',
            });

            // second ask on the same boot — triggers auto-compact (context > 1%)
            const outputSecond = await withTimeout({
              promise: brain.ask({
                prompt: 'respond with just the word yes',
              }),
              ms: 180_000,
              label: 'second ask (with compaction)',
            });

            // capture series
            const seriesAfter = brain.memory.series;

            // cleanup
            brain.executor.kill();

            return { outputFirst, outputSecond, seriesAfter };
          } finally {
            // restore env
            if (envBefore === undefined) {
              delete process.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE;
            } else {
              process.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE = envBefore;
            }
          }
        });

        then('both outputs have non-empty text', () => {
          expect(result.outputFirst.output.length).toBeGreaterThan(0);
          expect(result.outputSecond.output.length).toBeGreaterThan(0);
        });

        // peer: genBrainCli.dispatch.sequential.sameboot proves without compaction both asks stay in 1 episode
        then(
          'series has 2 episodes — compaction starts a new context window despite same session',
          () => {
            expect(result.seriesAfter).not.toBeNull();
            expect(result.seriesAfter!.episodes.length).toEqual(2);
          },
        );

        then('first episode has 1 exchange (before compaction)', () => {
          const episode = result.seriesAfter!.episodes[0]!;
          expect(episode.exchanges.length).toEqual(1);
        });

        then('second episode has 1 exchange (after compaction)', () => {
          const episode = result.seriesAfter!.episodes[1]!;
          expect(episode.exchanges.length).toEqual(1);
        });

        then(
          'both episode exids are suffixed to distinguish compaction-split episodes',
          () => {
            const first = result.seriesAfter!.episodes[0]!;
            const second = result.seriesAfter!.episodes[1]!;
            // both share the same session — suffixed with /0 and /1
            expect(first.exid).toMatch(/\/0$/);
            expect(second.exid).toMatch(/\/1$/);
            // same session prefix
            const sessionPrefix = first.exid!.replace(/\/0$/, '');
            expect(second.exid).toEqual(`${sessionPrefix}/1`);
          },
        );
      });
    },
  );
});
