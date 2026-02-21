import { type ChildProcess, spawn } from 'child_process';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import type { BrainSeries } from 'rhachet';

import type { BrainCli } from '../rhachet/BrainCli';
import {
  type AnthropicBrainCliConfig,
  type AnthropicBrainCliSlug,
  CONFIG_BY_CLI_SLUG,
} from './BrainCli.config';
import { getOneBrainOutputFromStreamJson } from './getOneBrainOutputFromStreamJson';
import { getOneDispatchArgs } from './getOneDispatchArgs';
import { getOneInteractArgs } from './getOneInteractArgs';

/**
 * .what = construct a BrainCli handle for a claude code CLI process
 * .why = the anthropic supplier — wires spawn, dispatch, terminal, and series management
 */
export const genBrainCli = async (
  input: { slug: string },
  context: { cwd: string },
): Promise<BrainCli> => {
  // validate slug against known configs
  const config: AnthropicBrainCliConfig | undefined =
    CONFIG_BY_CLI_SLUG[input.slug as AnthropicBrainCliSlug];
  if (!config)
    BadRequestError.throw('unrecognized anthropic brain CLI slug', {
      slug: input.slug,
      valid: Object.keys(CONFIG_BY_CLI_SLUG),
    });

  // mutable handle state
  let instance: BrainCli['executor']['instance'] = null;
  let series: BrainSeries | null = null;
  let lastTaskMode: 'ask' | 'act' | null = null;
  let childProcess: ChildProcess | null = null;
  let ptyProcess: ReturnType<typeof import('@lydell/node-pty').spawn> | null =
    null;

  // event callback registries — persist across process reboots
  const dataListeners: Array<(chunk: string) => void> = [];
  const exitListeners: Array<
    (info: { code: number; signal: string | null }) => void
  > = [];

  /**
   * .what = wire child process events to terminal callbacks
   * .why = unify event dispatch for both spawn modes
   */
  const wireChildProcessHooks = (proc: ChildProcess): void => {
    // stdout data -> dataListeners
    proc.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      for (const cb of dataListeners) cb(text);
    });

    // stderr data -> dataListeners (interleave for observability)
    proc.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      for (const cb of dataListeners) cb(text);
    });

    // exit -> clear instance, fire exitListeners (only if this proc is still current)
    proc.on('exit', (code, signal) => {
      if (childProcess !== proc) return;
      instance = null;
      childProcess = null;
      const info = {
        code: code ?? 1,
        signal: signal ?? null,
      };
      for (const cb of exitListeners) cb(info);
    });
  };

  /**
   * .what = wire pty process events to terminal callbacks
   * .why = unify event dispatch for interact mode
   */
  const wirePtyProcessHooks = (
    proc: ReturnType<typeof import('@lydell/node-pty').spawn>,
  ): void => {
    // onData -> dataListeners
    proc.onData((data: string) => {
      for (const cb of dataListeners) cb(data);
    });

    // onExit -> clear instance, fire exitListeners (only if this proc is still current)
    proc.onExit((exitInfo: { exitCode: number; signal?: number }) => {
      if (ptyProcess !== proc) return;
      instance = null;
      ptyProcess = null;
      const info = {
        code: exitInfo.exitCode,
        signal: exitInfo.signal != null ? String(exitInfo.signal) : null,
      };
      for (const cb of exitListeners) cb(info);
    });
  };

  /**
   * .what = kill the current process if alive
   * .why = clean teardown before reboot or on explicit kill
   */
  const killCurrentProcess = (): void => {
    // send SIGTERM but do NOT null childProcess/ptyProcess here
    // the exit handler will null them and fire exitListeners
    // this prevents the race where boot-after-kill spawns a new process
    // whose state gets clobbered by the old process's exit handler
    if (childProcess) childProcess.kill('SIGTERM');
    if (ptyProcess) ptyProcess.kill();
    instance = null;
  };

  // the handle
  const handle: BrainCli = {
    /**
     * .what = dispatch a read-only task
     * .why = enforced via restricted --allowedTools at spawn time
     */
    ask: async (askInput) => {
      // guard: must be in dispatch mode
      if (!instance)
        UnexpectedCodePathError.throw(
          'cannot ask: no live process. call executor.boot first',
        );
      if (instance.mode !== 'dispatch')
        UnexpectedCodePathError.throw(
          'cannot ask: handle is in interact mode. boot dispatch first',
        );

      // respawn with ask tools if prior boot used act tools
      if (lastTaskMode !== 'ask') {
        lastTaskMode = 'ask';
        await handle.executor.boot({ mode: 'dispatch' });
      }

      // write nd-JSON message to stdin
      if (!childProcess?.stdin)
        UnexpectedCodePathError.throw('dispatch process has no stdin');
      const message = JSON.stringify({
        type: 'user',
        message: { role: 'user', content: askInput.prompt },
        session_id: series?.exid ?? undefined,
      });
      childProcess.stdin.write(message + '\n');

      // collect BrainOutput from stream
      const brainOutput = await getOneBrainOutputFromStreamJson({
        prompt: askInput.prompt,
        stdout: childProcess.stdout!,
        spec: config.spec,
        seriesPrior: series,
      });

      // update series
      series = brainOutput.series;

      return brainOutput;
    },

    /**
     * .what = dispatch a full-tool task
     * .why = enforced via full --allowedTools at spawn time
     */
    act: async (actInput) => {
      // guard: must be in dispatch mode
      if (!instance)
        UnexpectedCodePathError.throw(
          'cannot act: no live process. call executor.boot first',
        );
      if (instance.mode !== 'dispatch')
        UnexpectedCodePathError.throw(
          'cannot act: handle is in interact mode. boot dispatch first',
        );

      // respawn with act tools if prior boot used ask tools
      if (lastTaskMode !== 'act') {
        lastTaskMode = 'act';
        await handle.executor.boot({ mode: 'dispatch' });
      }

      // write nd-JSON message to stdin
      if (!childProcess?.stdin)
        UnexpectedCodePathError.throw('dispatch process has no stdin');
      const message = JSON.stringify({
        type: 'user',
        message: { role: 'user', content: actInput.prompt },
        session_id: series?.exid ?? undefined,
      });
      childProcess.stdin.write(message + '\n');

      // collect BrainOutput from stream
      const brainOutput = await getOneBrainOutputFromStreamJson({
        prompt: actInput.prompt,
        stdout: childProcess.stdout!,
        spec: config.spec,
        seriesPrior: series,
      });

      // update series
      series = brainOutput.series;

      return brainOutput;
    },

    // durable state
    memory: {
      get series() {
        return series;
      },
      set series(v) {
        series = v;
      },
    },

    // process lifecycle
    executor: {
      get instance() {
        return instance;
      },

      /**
       * .what = boot or reboot the handle into a mode
       * .why = spawns the CLI process with appropriate args for the mode
       */
      boot: async (bootInput) => {
        // kill extant process if alive
        killCurrentProcess();

        if (bootInput.mode === 'dispatch') {
          // compute args for dispatch mode — default to ask tools if no prior task mode
          const taskMode = lastTaskMode ?? 'ask';
          lastTaskMode = taskMode;
          const args = getOneDispatchArgs({
            config,
            taskMode,
            series,
          });

          // spawn via child_process with pipe stdio
          childProcess = spawn(config.binary, args, {
            cwd: context.cwd,
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe'],
          });

          // update instance state
          instance = {
            pid: childProcess.pid!,
            mode: 'dispatch',
          };

          // wire event hooks
          wireChildProcessHooks(childProcess);
          return;
        }

        if (bootInput.mode === 'interact') {
          // compute args for interact mode
          const args = getOneInteractArgs({ config, series });

          // spawn via @lydell/node-pty for raw PTY
          const nodePty = await import('@lydell/node-pty');
          ptyProcess = nodePty.spawn(config.binary, args, {
            name: 'xterm-256color',
            cols: 120,
            rows: 40,
            cwd: context.cwd,
            env: { ...process.env } as Record<string, string>,
          });

          // update instance state
          instance = {
            pid: ptyProcess.pid,
            mode: 'interact',
          };

          // wire event hooks
          wirePtyProcessHooks(ptyProcess);
          return;
        }

        UnexpectedCodePathError.throw('invalid boot mode', {
          mode: bootInput.mode,
        });
      },

      /**
       * .what = kill the current process
       * .why = clean shutdown — no-op if not booted
       */
      kill: () => {
        killCurrentProcess();
      },
    },

    // terminal i/o
    terminal: {
      /**
       * .what = write raw data to process stdin
       * .why = relay user keystrokes or protocol data
       */
      write: (data) => {
        if (!instance)
          UnexpectedCodePathError.throw('cannot write: no live process');
        if (instance.mode === 'dispatch' && childProcess?.stdin) {
          childProcess.stdin.write(data);
          return;
        }
        if (instance.mode === 'interact' && ptyProcess) {
          ptyProcess.write(data);
          return;
        }
        UnexpectedCodePathError.throw(
          'cannot write: process handle not available',
        );
      },

      /**
       * .what = resize the terminal
       * .why = interact mode needs terminal dimensions; dispatch is no-op
       */
      resize: (resizeInput) => {
        if (ptyProcess) {
          ptyProcess.resize(resizeInput.cols, resizeInput.rows);
        }
        // dispatch mode: no-op (no terminal to resize)
      },

      /**
       * .what = register a data callback
       * .why = persists across process reboots — register once, survive reboots
       */
      onData: (cb) => {
        dataListeners.push(cb);
      },

      /**
       * .what = register an exit callback
       * .why = persists across process reboots — register once, survive reboots
       */
      onExit: (cb) => {
        exitListeners.push(cb);
      },
    },
  };

  return handle;
};
