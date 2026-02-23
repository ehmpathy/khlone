import { UnexpectedCodePathError } from 'helpful-errors';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { genBrainCli } from '../rhachet/genBrainCli';
import { genContextBrainAuthAnthropic } from './genContextBrainAuthAnthropic';

const SLUG_HAIKU = 'claude@anthropic/claude/haiku';

describe('genBrainCli.dispatch.act', () => {
  // use a temp dir as cwd — avoids repo hooks and provides a clean writable directory
  const scene = useBeforeAll(async () => {
    const cwd = genTempDir({ slug: 'braincli-act' });
    return {
      cwd,
      context: {
        cwd,
        ...genContextBrainAuthAnthropic({
          via: {
            apiKey:
              process.env.ANTHROPIC_API_KEY ??
              UnexpectedCodePathError.throw(
                'ANTHROPIC_API_KEY must be set via use.apikeys.sh',
              ),
          },
        }),
      },
    };
  });

  given('[case1] act on a booted dispatch handle', () => {
    when('[t0] act is called with a cheap prompt', () => {
      const result = useThen('act succeeds', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);

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

  given(
    '[case2] act mode permits mutation tools while ask mode restricts them',
    () => {
      when('[t0] act is asked to write a file', () => {
        const result = useThen('act writes the file', async () => {
          const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);

          // boot dispatch mode
          await brain.executor.boot({ mode: 'dispatch' });

          // act: ask the brain to write a file — act mode has Write tool
          const targetFile = join(scene.cwd, 'act-proof.txt');
          const output = await brain.act({
            prompt: `write a file at the absolute path ${targetFile} with the content "act-was-here". use the Write tool. do not respond with any other text besides a confirmation that you wrote the file.`,
          });

          // check if the file was written
          const fileExists = existsSync(targetFile);

          // cleanup
          brain.executor.kill();

          return { output, fileExists, targetFile };
        });

        then('the file was written by the brain', () => {
          expect(result.fileExists).toEqual(true);
        });

        then('BrainOutput is non-empty', () => {
          expect(result.output.output.length).toBeGreaterThan(0);
        });
      });

      when('[t1] ask is asked to write a file', () => {
        const result = useThen(
          'ask cannot write the file (tools restricted)',
          async () => {
            const brain = await genBrainCli(
              { slug: SLUG_HAIKU },
              scene.context,
            );

            // boot dispatch mode
            await brain.executor.boot({ mode: 'dispatch' });

            // ask: ask the brain to write a file — ask mode does NOT have Write tool
            const targetFile = join(scene.cwd, 'ask-proof.txt');
            const output = await brain.ask({
              prompt: `write a file at the absolute path ${targetFile} with the content "ask-was-here". use the Write tool. do not respond with any other text besides a confirmation that you wrote the file.`,
            });

            // check if the file was written (it should NOT be)
            const fileExists = existsSync(targetFile);

            // cleanup
            brain.executor.kill();

            return { output, fileExists, targetFile };
          },
        );

        then(
          'the file was NOT written by the brain (ask mode has no Write tool)',
          () => {
            expect(result.fileExists).toEqual(false);
          },
        );

        then(
          'BrainOutput is defined (brain completed the task, even without Write tool)',
          () => {
            expect(result.output).toBeDefined();
            expect(result.output.output).toBeDefined();
          },
        );
      });
    },
  );
});
