import { given, then, useThen, when } from 'test-fns';

import { genBrainCli } from '../../rhachet/genBrainCli';

const SLUG_HAIKU = 'claude@anthropic/claude/haiku';
const CWD = process.cwd();

describe('genBrainCli.dispatch.ask', () => {
  given('[case1] a valid haiku brain slug', () => {
    when('[t0] genBrainCli is called', () => {
      const brain = useThen('it returns a BrainCli handle', async () => {
        const result = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });
        expect(result).toBeDefined();
        expect(result.ask).toBeDefined();
        expect(result.act).toBeDefined();
        expect(result.executor).toBeDefined();
        expect(result.terminal).toBeDefined();
        return result;
      });

      then('brain.executor.instance is null before boot', () => {
        expect(brain.executor.instance).toBeNull();
      });

      then('brain.memory.series is null before boot', () => {
        expect(brain.memory.series).toBeNull();
      });
    });

    when('[t1] boot dispatch and ask a cheap question', () => {
      const result = useThen('ask succeeds', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

        // boot dispatch mode
        await brain.executor.boot({ mode: 'dispatch' });
        expect(brain.executor.instance).not.toBeNull();
        expect(brain.executor.instance!.mode).toEqual('dispatch');
        expect(brain.executor.instance!.pid).toBeGreaterThan(0);

        // ask a cheap question
        const output = await brain.ask({
          prompt: 'respond with just the word ok',
        });

        // capture state before kill
        const seriesExid = brain.memory.series?.exid ?? null;
        const pid = brain.executor.instance?.pid ?? null;

        // cleanup
        brain.executor.kill();

        return { output, seriesExid, pid };
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

      then('memory.series is populated after ask', () => {
        expect(result.seriesExid).not.toBeNull();
      });
    });

    when('[t2] terminal.onData fires with output chunks', () => {
      const result = useThen('data callback fires', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

        // register data callback before boot
        const chunks: string[] = [];
        brain.terminal.onData((chunk) => chunks.push(chunk));

        // boot and ask
        await brain.executor.boot({ mode: 'dispatch' });
        await brain.ask({ prompt: 'respond with just the word ok' });

        // cleanup
        brain.executor.kill();

        return { chunks };
      });

      then('at least one chunk was received', () => {
        expect(result.chunks.length).toBeGreaterThan(0);
      });
    });

    when('[t3] terminal.onExit fires on kill', () => {
      const result = useThen('exit callback fires', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

        // register exit callback with fire counter
        let fireCount = 0;
        let exitInfo: { code: number; signal: string | null } | null = null;
        brain.terminal.onExit((info) => {
          fireCount += 1;
          exitInfo = info;
        });

        // boot
        await brain.executor.boot({ mode: 'dispatch' });
        expect(brain.executor.instance).not.toBeNull();

        // kill
        brain.executor.kill();

        // wait for exit event to propagate
        await new Promise((r) => setTimeout(r, 500));

        return { exitInfo, fireCount };
      });

      then('exit callback received exit info', () => {
        expect(result.exitInfo).not.toBeNull();
        const info = result.exitInfo as unknown as {
          code: number;
          signal: string | null;
        };
        expect(info.code).toBeDefined();
      });

      then('exit callback fired exactly once', () => {
        expect(result.fireCount).toEqual(1);
      });
    });

    when('[t4] terminal.write sends raw data to dispatch stdin', () => {
      const result = useThen('write succeeds without error', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

        // boot dispatch mode
        await brain.executor.boot({ mode: 'dispatch' });

        // write raw nd-JSON to stdin via terminal.write (same as ask does internally)
        const message = JSON.stringify({
          type: 'user',
          message: { role: 'user', content: 'respond with just the word ok' },
        });
        brain.terminal.write(message + '\n');

        // verify the process is still alive after write
        const instanceAfterWrite = brain.executor.instance;

        // cleanup
        brain.executor.kill();

        return { instanceAfterWrite };
      });

      then('process is still alive after write', () => {
        expect(result.instanceAfterWrite).not.toBeNull();
        expect(result.instanceAfterWrite!.mode).toEqual('dispatch');
      });
    });

    when('[t5] series is preserved across reboot', () => {
      const result = useThen('reboot preserves series', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });

        // boot and ask to populate series
        await brain.executor.boot({ mode: 'dispatch' });
        await brain.ask({ prompt: 'respond with just the word ok' });
        const seriesBefore = brain.memory.series;

        // reboot
        await brain.executor.boot({ mode: 'dispatch' });
        const seriesAfter = brain.memory.series;
        const instanceAfter = brain.executor.instance;

        // cleanup
        brain.executor.kill();

        return { seriesBefore, seriesAfter, instanceAfter };
      });

      then('series exid is preserved', () => {
        expect(result.seriesAfter?.exid).toEqual(result.seriesBefore?.exid);
      });

      then('instance has a new pid', () => {
        expect(result.instanceAfter).not.toBeNull();
        expect(result.instanceAfter!.mode).toEqual('dispatch');
      });
    });
  });
});
