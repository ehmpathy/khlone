import { UnexpectedCodePathError } from 'helpful-errors';
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
 * .what = send a keypress to the brain's terminal after a delay
 * .why = TUI components (theme picker, login method, trust prompt) need time to
 *        initialize their input handlers after render — a synchronous write in the
 *        onData callback arrives before the component is ready to accept input
 */
const writeAfterDelay = (input: {
  brain: Awaited<ReturnType<typeof genBrainCli>>;
  keys: string;
  delayMs: number;
}): void => {
  setTimeout(() => {
    if (input.brain.executor.instance) input.brain.terminal.write(input.keys);
  }, input.delayMs);
};

/**
 * .what = register one-shot TUI dialog auto-accept handlers on a brain's terminal
 * .why = prevents duplicate keystrokes when multiple awaitOutput calls are active
 *
 * .note = must be called ONCE per brain after interact boot, not inside awaitOutput.
 *         handlers accumulate their own output and fire at most once each.
 *         genTempDir creates fresh dirs that claude hasn't seen before, so these
 *         dialogs appear on first interact-mode boot.
 *         each keypress is delayed 500ms to let the TUI component initialize its
 *         input handler after it renders output.
 */
const registerDialogDismissers = (input: {
  brain: Awaited<ReturnType<typeof genBrainCli>>;
}): void => {
  let accumulated = '';
  let themePickerHandled = false;
  let loginMethodHandled = false;
  let trustPromptHandled = false;

  input.brain.terminal.onData((chunk) => {
    accumulated += chunk;

    // auto-accept theme picker — option 1 ("Dark mode") is pre-selected
    // note: appears on first boot in a fresh directory (no prior theme)
    if (
      !themePickerHandled &&
      input.brain.executor.instance &&
      accumulated.includes('Choose') &&
      accumulated.includes('text') &&
      accumulated.includes('style')
    ) {
      themePickerHandled = true;
      writeAfterDelay({ brain: input.brain, keys: '\r', delayMs: 500 });
    }

    // auto-accept login method — select option 2 ("Anthropic Console account") for API key auth
    // note: appears in CI where no cached auth session exists in the fresh temp dir
    if (
      !loginMethodHandled &&
      input.brain.executor.instance &&
      accumulated.includes('Select') &&
      accumulated.includes('login') &&
      accumulated.includes('method')
    ) {
      loginMethodHandled = true;
      // press down arrow to select option 2, then enter after a gap
      // note: must be two separate writes — single '\x1B[B\r' sends both in one
      //       PTY buffer and the TUI processes \r before the escape sequence
      //       updates the selection state
      writeAfterDelay({ brain: input.brain, keys: '\x1B[B', delayMs: 500 });
      writeAfterDelay({ brain: input.brain, keys: '\r', delayMs: 800 });
    }

    // auto-accept workspace trust prompt — option 1 ("Yes, I trust") is pre-selected
    // note: PTY output has ANSI escape sequences between words, so match single words
    // guard: process may have exited between data buffer and callback — skip write if dead
    if (
      !trustPromptHandled &&
      input.brain.executor.instance &&
      accumulated.includes('safety') &&
      accumulated.includes('trust')
    ) {
      trustPromptHandled = true;
      writeAfterDelay({ brain: input.brain, keys: '\r', delayMs: 500 });
    }
  });
};

/**
 * .what = await until accumulated onData output matches a predicate
 * .why = replace arbitrary timers with precise promise-based waits
 *
 * .note = dialog handlers are NOT in this function — call registerDialogDismissers
 *         once per brain after boot to avoid duplicate keystroke from concurrent calls
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

describe('genBrainCli.interact', () => {
  const scene = useBeforeAll(async () => {
    const cwd = genTempDir({ slug: 'braincli-interact' });
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

  given('[case1] a handle booted in interact mode', () => {
    when('[t0] boot interact mode', () => {
      const result = useThen('interact boot succeeds', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);

        // boot interact mode
        await brain.executor.boot({ mode: 'interact' });
        registerDialogDismissers({ brain });

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

        // boot interact mode
        await brain.executor.boot({ mode: 'interact' });
        registerDialogDismissers({ brain });

        // await the CLI TUI to fully render (check for `shortcuts` token in PTY output)
        await awaitOutput({
          brain,
          predicate: (acc) => acc.includes('shortcuts'),
          timeoutMs: 15_000,
        });

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

        // boot interact mode
        await brain.executor.boot({ mode: 'interact' });
        registerDialogDismissers({ brain });

        // await the CLI TUI to render
        await awaitOutput({
          brain,
          predicate: (acc) => acc.includes('shortcuts'),
          timeoutMs: 15_000,
        });

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
            registerDialogDismissers({ brain });

            // register the response listener BEFORE the TUI settles — captures all data from boot
            const recallPromise = awaitOutput({
              brain,
              predicate: (acc) => acc.toLowerCase().includes('flamingo'),
              timeoutMs: 90_000,
            });

            // await the CLI TUI to fully render
            await awaitOutput({
              brain,
              predicate: (acc) => acc.includes('shortcuts'),
              timeoutMs: 30_000,
            });

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
