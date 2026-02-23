import type { BrainOutput, BrainSeries } from 'rhachet';

/**
 * .what = the mode a brain CLI process can be booted in
 * .why = dispatch for structured headless i/o, interact for raw PTY relay
 */
export type BrainCliMode = 'dispatch' | 'interact';

/**
 * .what = the handle contract for a headless brain CLI process
 * .why = stable ref that survives process churn — the daemon codes against this shape
 */
export interface BrainCli {
  // dispatch methods — structured task submission
  ask(input: { prompt: string }): Promise<BrainOutput<string>>;
  act(input: { prompt: string }): Promise<BrainOutput<string>>;

  // durable state — survives process reboots
  memory: { series: BrainSeries | null };

  // process lifecycle — ephemeral, per-boot
  executor: {
    instance: { pid: number; mode: BrainCliMode } | null;
    boot(input: { mode: BrainCliMode }): Promise<void>;
    kill(): void;
  };

  // raw i/o surface — works in both modes
  terminal: {
    write(data: string): void;
    resize(input: { cols: number; rows: number }): void;
    onData(cb: (chunk: string) => void): void;
    onExit(cb: (info: { code: number; signal: string | null }) => void): void;
  };
}
