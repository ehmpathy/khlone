import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

import { genBrainCli } from '../rhachet/genBrainCli';
import { genContextBrainAuthAnthropic } from './genContextBrainAuthAnthropic';

const SLUG_HAIKU = 'claude@anthropic/claude/haiku';

/**
 * .what = await until accumulated onData output matches a predicate
 * .why = replace arbitrary timers with precise promise-based waits
 */
const awaitOutput = (input: {
  brain: Awaited<ReturnType<typeof genBrainCli>>;
  predicate: (accumulated: string) => boolean;
  timeoutMs: number;
}): Promise<string> =>
  new Promise((onDone, onFail) => {
    let accumulated = '';
    const timeout = setTimeout(
      () =>
        onFail(
          new Error(
            `awaitOutput timed out after ${input.timeoutMs}ms. accumulated: ${accumulated}`,
          ),
        ),
      input.timeoutMs,
    );
    input.brain.terminal.onData((chunk) => {
      accumulated += chunk;

      if (input.predicate(accumulated)) {
        clearTimeout(timeout);
        onDone(accumulated);
      }
    });
  });

/**
 * .what = create an isolated claude config dir with onboard pre-completed
 * .why = prevents first-run dialogs (theme, login method, trust) from appear
 *        in interact mode — the TUI boots straight to the prompt
 *
 * .note = claude code reads `~/.claude.json` (tied to HOME) for onboard state.
 *         by set HOME to a temp dir with a pre-written `.claude.json`, each
 *         brain instance gets isolated config and skips first-run entirely.
 */
const genClaudeHomeDir = (input: { apiKey: string }): string => {
  const homeDir = genTempDir({ slug: 'braincli-home' });

  // pre-write global user config — skip all first-run dialogs
  const keySuffix = input.apiKey.slice(-20);
  fs.writeFileSync(
    path.join(homeDir, '.claude.json'),
    JSON.stringify({
      hasCompletedOnboarding: true,
      numStartups: 10,
      customApiKeyResponses: {
        approved: [keySuffix],
      },
    }),
  );

  // pre-write config dir with api key approval
  const claudeDir = path.join(homeDir, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(
    path.join(claudeDir, 'config.json'),
    JSON.stringify({
      primaryApiKey: input.apiKey,
      customApiKeyResponses: {
        approved: [keySuffix],
      },
    }),
  );

  return homeDir;
};

/**
 * .what = await TUI ready state, auto-dismiss any dialogs that appear first
 * .why = interact mode may show per-workspace trust dialog and/or API key
 *        confirm dialog before the main TUI loads. this helper registers ONE
 *        listener that watches for and dismisses all known dialogs, then
 *        completes when the main TUI renders (detected via `shortcuts` token).
 *
 * .note = single listener avoids the race condition where a dialog is dismissed
 *         but the `shortcuts` listener is attached too late to capture the TUI render.
 */
const awaitTuiReady = (input: {
  brain: Awaited<ReturnType<typeof genBrainCli>>;
  timeoutMs: number;
}): Promise<string> =>
  new Promise((onDone, onFail) => {
    let accumulated = '';
    let trustDismissed = false;
    let apiKeyDismissed = false;
    const timeout = setTimeout(
      () =>
        onFail(
          new Error(
            `awaitTuiReady timed out after ${input.timeoutMs}ms. accumulated: ${accumulated}`,
          ),
        ),
      input.timeoutMs,
    );
    input.brain.terminal.onData((chunk) => {
      accumulated += chunk;

      // auto-dismiss per-workspace trust dialog — "Yes, I trust" is pre-selected
      if (!trustDismissed && accumulated.includes('trust')) {
        trustDismissed = true;
        input.brain.terminal.write('\r');
      }

      // auto-dismiss API key confirm dialog — "No" is pre-selected, press up then enter for "Yes"
      if (
        !apiKeyDismissed &&
        accumulated.includes('API') &&
        accumulated.includes('key')
      ) {
        apiKeyDismissed = true;
        // select "Yes" (option 1) — up arrow then enter
        input.brain.terminal.write('\x1B[A\r');
      }

      // done when main TUI is ready
      if (accumulated.includes('shortcuts')) {
        clearTimeout(timeout);
        onDone(accumulated);
      }
    });
  });

describe('genBrainCli.interact', () => {
  const scene = useBeforeAll(async () => {
    const cwd = genTempDir({ slug: 'braincli-interact' });
    const apiKey =
      process.env.ANTHROPIC_API_KEY ??
      UnexpectedCodePathError.throw(
        'ANTHROPIC_API_KEY must be set via use.apikeys.sh',
      );

    // isolated claude config per test suite — skips first-run dialogs
    const homeDir = genClaudeHomeDir({ apiKey });

    return {
      cwd,
      context: {
        cwd,
        env: { HOME: homeDir },
        ...genContextBrainAuthAnthropic({
          via: { apiKey },
        }),
      },
    };
  });

  given('[case1] a handle booted in interact mode', () => {
    when('[t0] boot interact mode', () => {
      const result = useThen('interact boot succeeds', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);

        // boot interact mode — first-run pre-completed via isolated HOME config
        await brain.executor.boot({ mode: 'interact' });

        const instanceMode = brain.executor.instance?.mode ?? null;
        const instancePid = brain.executor.instance?.pid ?? null;

        // await initial PTY output via promise (not timer)
        const initialOutput = await awaitOutput({
          brain,
          predicate: (acc) => acc.length > 0,
          timeoutMs: 15_000,
        });

        // cleanup
        brain.executor.kill();

        return { instanceMode, instancePid, initialOutput };
      });

      then('instance mode is interact', () => {
        expect(result.instanceMode).toEqual('interact');
      });

      then('instance has a valid pid', () => {
        expect(result.instancePid).not.toBeNull();
        expect(result.instancePid!).toBeGreaterThan(0);
      });

      then('terminal.onData receives PTY bytes', () => {
        expect(result.initialOutput.length).toBeGreaterThan(0);
      });
    });

    when('[t1] terminal.write sends a prompt and receives a response', () => {
      const result = useThen('write and read succeeds', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);

        // boot interact mode — auto-dismiss any dialogs, await TUI ready
        await brain.executor.boot({ mode: 'interact' });
        await awaitTuiReady({ brain, timeoutMs: 30_000 });

        // let the TUI settle — it emits escape sequences after the prompt
        await new Promise((r) => setTimeout(r, 2_000));

        // write a prompt via terminal.write (PTY uses \r for Enter)
        brain.terminal.write('respond with just the word pineapple\r');

        // await the response via onData callback (not poll)
        const responseOutput = await awaitOutput({
          brain,
          predicate: (acc) => acc.toLowerCase().includes('pineapple'),
          timeoutMs: 60_000,
        });

        // cleanup
        brain.executor.kill();

        return { responseOutput };
      });

      then('response contains the expected word', () => {
        expect(result.responseOutput.toLowerCase()).toContain('pineapple');
      });

      then('response has non-trivial length', () => {
        expect(result.responseOutput.length).toBeGreaterThan(10);
      });
    });

    when('[t2] terminal.resize does not crash in interact mode', () => {
      const result = useThen('resize succeeds', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);

        // boot interact mode — auto-dismiss any dialogs, await TUI ready
        await brain.executor.boot({ mode: 'interact' });
        await awaitTuiReady({ brain, timeoutMs: 30_000 });

        // resize the terminal — should not throw
        brain.terminal.resize({ cols: 80, rows: 24 });
        brain.terminal.resize({ cols: 200, rows: 50 });

        // verify process is still alive after resize
        const instanceAfterResize = brain.executor.instance;

        // cleanup
        brain.executor.kill();

        return { instanceAfterResize };
      });

      then('process is still alive after resize', () => {
        expect(result.instanceAfterResize).not.toBeNull();
        expect(result.instanceAfterResize!.mode).toEqual('interact');
      });
    });

    when('[t3.1] ask is called on interact handle', () => {
      then('it throws an error', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);
        await brain.executor.boot({ mode: 'interact' });

        const error = await getError(brain.ask({ prompt: 'hello' }));

        // cleanup
        brain.executor.kill();

        expect(error).toBeInstanceOf(Error);
      });
    });

    when('[t3.2] act is called on interact handle', () => {
      then('it throws an error', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);
        await brain.executor.boot({ mode: 'interact' });

        const error = await getError(brain.act({ prompt: 'hello' }));

        // cleanup
        brain.executor.kill();

        expect(error).toBeInstanceOf(Error);
      });
    });

    when(
      '[t4] dispatch -> interact proves session resume via prior context recall',
      () => {
        const result = useThen(
          'brain recalls prior dispatch context in interact mode',
          async () => {
            const brain = await genBrainCli(
              { slug: SLUG_HAIKU },
              scene.context,
            );

            // boot dispatch and tell the brain a unique word
            await brain.executor.boot({ mode: 'dispatch' });
            await brain.ask({
              prompt:
                'remember this secret code word: flamingo. just say ok to confirm.',
            });

            // switch to interact mode (resumes the same session)
            await brain.executor.boot({ mode: 'interact' });

            // register the response listener BEFORE the TUI settles — captures all data from boot
            const recallPromise = awaitOutput({
              brain,
              predicate: (acc) => acc.toLowerCase().includes('flamingo'),
              timeoutMs: 90_000,
            });

            // auto-dismiss any dialogs, await TUI ready
            await awaitTuiReady({ brain, timeoutMs: 30_000 });

            // guard: verify process survived the TUI boot
            if (!brain.executor.instance)
              throw new Error(
                'interact process exited before prompt could be sent',
              );

            // let the TUI settle
            await new Promise((r) => setTimeout(r, 2_000));

            // ask the brain to recall the word from the prior dispatch context
            brain.terminal.write(
              'what was the secret code word I told you earlier? respond with just that one word\r',
            );

            // await the response
            const recallOutput = await recallPromise;

            // cleanup
            brain.executor.kill();

            return { recallOutput };
          },
        );

        then('brain recalls the word from prior dispatch context', () => {
          expect(result.recallOutput.toLowerCase()).toContain('flamingo');
        });
      },
    );

    when('[t5] dispatch -> interact preserves series', () => {
      const result = useThen('mode switch preserves series', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);

        // boot dispatch and ask to populate series
        await brain.executor.boot({ mode: 'dispatch' });
        await brain.ask({ prompt: 'respond with just the word ok' });
        const seriesBefore = brain.memory.series;

        // switch to interact mode
        await brain.executor.boot({ mode: 'interact' });
        const modeAfterInteract = brain.executor.instance?.mode ?? null;
        const seriesAfterInteract = brain.memory.series;

        // switch back to dispatch
        await brain.executor.boot({ mode: 'dispatch' });
        const modeAfterDispatch = brain.executor.instance?.mode ?? null;
        const seriesAfterDispatch = brain.memory.series;

        // cleanup
        brain.executor.kill();

        return {
          seriesBefore,
          modeAfterInteract,
          seriesAfterInteract,
          modeAfterDispatch,
          seriesAfterDispatch,
        };
      });

      then('interact mode is set', () => {
        expect(result.modeAfterInteract).toEqual('interact');
      });

      then('series is preserved after switch to interact', () => {
        expect(result.seriesAfterInteract?.exid).toEqual(
          result.seriesBefore?.exid,
        );
      });

      then('dispatch mode is restored', () => {
        expect(result.modeAfterDispatch).toEqual('dispatch');
      });

      then('series is preserved after switch back to dispatch', () => {
        expect(result.seriesAfterDispatch?.exid).toEqual(
          result.seriesBefore?.exid,
        );
      });
    });
  });
});
