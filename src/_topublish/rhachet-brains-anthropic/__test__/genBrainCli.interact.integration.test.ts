import { getError, given, then, useThen, when } from 'test-fns';

import { genBrainCli } from '../../rhachet/genBrainCli';

const SLUG_HAIKU = 'claude@anthropic/claude/haiku';
const CWD = process.cwd();

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

describe('genBrainCli.interact', () => {
  given('[case1] a handle booted in interact mode', () => {
    when('[t0] boot interact mode', () => {
      const result = useThen('interact boot succeeds', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

        // boot interact mode
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
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

        // boot interact mode
        await brain.executor.boot({ mode: 'interact' });

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
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

        // boot interact mode
        await brain.executor.boot({ mode: 'interact' });

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
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });
        await brain.executor.boot({ mode: 'interact' });

        const error = await getError(brain.ask({ prompt: 'hello' }));

        // cleanup
        brain.executor.kill();

        expect(error).toBeInstanceOf(Error);
      });
    });

    when('[t3.2] act is called on interact handle', () => {
      then('it throws an error', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });
        await brain.executor.boot({ mode: 'interact' });

        const error = await getError(brain.act({ prompt: 'hello' }));

        // cleanup
        brain.executor.kill();

        expect(error).toBeInstanceOf(Error);
      });
    });

    when('[t4] dispatch -> interact preserves series', () => {
      const result = useThen('mode switch preserves series', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

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
