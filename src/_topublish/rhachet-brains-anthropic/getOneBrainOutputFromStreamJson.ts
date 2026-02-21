import { createHash } from 'crypto';
import { UnexpectedCodePathError } from 'helpful-errors';
import {
  BrainEpisode,
  BrainExchange,
  BrainOutput,
  BrainOutputMetrics,
  BrainSeries,
  type BrainSpec,
} from 'rhachet';
import type { Readable } from 'stream';

/**
 * .what = sha256 hash a value
 * .why = used to construct hash fields on domain objects
 */
const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

/**
 * .what = extract the numeric value from an IsoPrice
 * .why = IsoPrice is a branded string like '$0.000001' — need the number for multiplication
 */
const getOneNumericFromIsoPrice = (price: string): number => {
  const cleaned = price.replace(/[^0-9.-]/g, '');
  return Number.parseFloat(cleaned) || 0;
};

/**
 * .what = format a number as an IsoPrice
 * .why = construct IsoPrice-shaped values from computed costs
 */
const getOneIsoPrice = (value: number): string => `$${value.toFixed(10)}`;

/**
 * .what = parse nd-JSON event stream from claude `-p --output-format stream-json` into a typed BrainOutput
 * .why = the core transform — turns raw vendor stream into the contract's return type
 *
 * .note = the stream emits these top-level event types:
 *   - system: init metadata
 *   - assistant: assistant turn content
 *   - result: final result with session_id, cost, and output text
 *   - stream_event: wraps anthropic API events (message_start, content_block_delta, message_delta, message_stop)
 *
 * .note = detect `result` event as completion — do NOT wait for process exit (CLI may hang after final event)
 */
export const getOneBrainOutputFromStreamJson = (input: {
  prompt: string;
  stdout: Readable;
  spec: BrainSpec;
  seriesPrior: BrainSeries | null;
}): Promise<BrainOutput<string>> => {
  return new Promise<BrainOutput<string>>((onResolve, onReject) => {
    // accumulate parsed state
    let textAccumulated = '';
    let sessionId: string | null = null;
    let tokensInput = 0;
    let tokensOutput = 0;
    let tokensCacheGet = 0;
    let tokensCacheSet = 0;
    let costUsd: number | null = null;
    let durationMs: number | null = null;
    let resultText: string | null = null;
    let compactionDetected = false;
    let resolved = false;

    // line buffer for nd-JSON parse
    let buffer = '';

    /**
     * .what = process a complete nd-JSON line
     * .why = dispatch by event type to accumulate text, tokens, session_id
     */
    const processLine = (line: string): void => {
      // skip empty lines
      const trimmed = line.trim();
      if (!trimmed) return;

      // parse JSON
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(trimmed);
      } catch {
        // skip non-JSON lines (e.g., raw stderr bleed)
        return;
      }

      const eventType = event.type as string | undefined;

      // handle result event — final output with session_id and cost
      if (eventType === 'result') {
        sessionId = (event.session_id as string) ?? sessionId;
        costUsd = (event.cost_usd as number) ?? costUsd;
        durationMs = (event.duration_ms as number) ?? durationMs;
        resultText = (event.result as string) ?? resultText;

        // extract usage from result event if present
        const usage = event.usage as
          | {
              input_tokens?: number;
              output_tokens?: number;
              cache_creation_input_tokens?: number;
              cache_read_input_tokens?: number;
            }
          | undefined;
        if (usage) {
          if (usage.input_tokens) tokensInput = usage.input_tokens;
          if (usage.output_tokens) tokensOutput = usage.output_tokens;
          if (usage.cache_creation_input_tokens)
            tokensCacheSet = usage.cache_creation_input_tokens;
          if (usage.cache_read_input_tokens)
            tokensCacheGet = usage.cache_read_input_tokens;
        }

        // also check num_turns for token fallback
        const totalCost = event.total_cost as number | undefined;
        if (totalCost != null && costUsd == null) costUsd = totalCost;

        // result event signals completion
        finalize();
        return;
      }

      // handle assistant event — may contain content blocks directly
      if (eventType === 'assistant') {
        const message = event.message as
          | {
              content?: Array<{ type: string; text?: string }>;
              usage?: {
                input_tokens?: number;
                output_tokens?: number;
                cache_creation_input_tokens?: number;
                cache_read_input_tokens?: number;
              };
            }
          | undefined;
        if (message?.content) {
          for (const block of message.content) {
            if (block.type === 'text' && block.text) {
              textAccumulated += block.text;
            }
          }
        }
        if (message?.usage) {
          if (message.usage.input_tokens)
            tokensInput = message.usage.input_tokens;
          if (message.usage.output_tokens)
            tokensOutput = message.usage.output_tokens;
          if (message.usage.cache_creation_input_tokens)
            tokensCacheSet = message.usage.cache_creation_input_tokens;
          if (message.usage.cache_read_input_tokens)
            tokensCacheGet = message.usage.cache_read_input_tokens;
        }
        sessionId = (event.session_id as string) ?? sessionId;
        return;
      }

      // handle stream_event — wraps anthropic API events
      if (eventType === 'stream_event') {
        const inner = event.event as Record<string, unknown> | undefined;
        if (!inner) return;
        processStreamEvent(inner);
        return;
      }

      // handle system event — may contain session_id or compact_boundary
      if (eventType === 'system') {
        sessionId = (event.session_id as string) ?? sessionId;
        if ((event.subtype as string) === 'compact_boundary')
          compactionDetected = true;
        return;
      }

      // handle top-level compact_boundary event (alternate shape)
      if (eventType === 'compact_boundary') {
        compactionDetected = true;
        return;
      }
    };

    /**
     * .what = process an inner anthropic API stream event
     * .why = extract tokens from message_start/message_delta, text from content_block_delta
     */
    const processStreamEvent = (event: Record<string, unknown>): void => {
      const innerType = event.type as string | undefined;

      // message_start — initial input token count
      if (innerType === 'message_start') {
        const message = event.message as
          | { usage?: { input_tokens?: number } }
          | undefined;
        if (message?.usage?.input_tokens) {
          tokensInput = message.usage.input_tokens;
        }
        return;
      }

      // content_block_delta — accumulate text
      if (innerType === 'content_block_delta') {
        const delta = event.delta as
          | { type?: string; text?: string }
          | undefined;
        if (delta?.type === 'text_delta' && delta.text) {
          textAccumulated += delta.text;
        }
        return;
      }

      // message_delta — cumulative token counts
      if (innerType === 'message_delta') {
        const usage = event.usage as
          | {
              input_tokens?: number;
              output_tokens?: number;
              cache_creation_input_tokens?: number;
              cache_read_input_tokens?: number;
            }
          | undefined;
        if (usage) {
          if (usage.input_tokens) tokensInput = usage.input_tokens;
          if (usage.output_tokens) tokensOutput = usage.output_tokens;
          if (usage.cache_creation_input_tokens)
            tokensCacheSet = usage.cache_creation_input_tokens;
          if (usage.cache_read_input_tokens)
            tokensCacheGet = usage.cache_read_input_tokens;
        }
        return;
      }
    };

    /**
     * .what = detach all listeners from the stdout stream
     * .why = prevent listener leak when the same stream is reused across calls
     */
    const detachListeners = (): void => {
      input.stdout.removeListener('data', onDataHandler);
      input.stdout.removeListener('end', onEndHandler);
      input.stdout.removeListener('error', onErrorHandler);
    };

    /**
     * .what = construct the BrainOutput from accumulated state
     * .why = consolidate all parsed data into the contract return type
     */
    const finalize = (): void => {
      if (resolved) return;
      resolved = true;
      detachListeners();

      // prefer result text over accumulated text (result is the clean final output)
      const outputText = resultText ?? textAccumulated;

      // derive cost from tokens x spec rates
      const rates = input.spec.cost.cash;
      const costInput =
        getOneNumericFromIsoPrice(rates.input as string) * tokensInput;
      const costOutput =
        getOneNumericFromIsoPrice(rates.output as string) * tokensOutput;
      const costCacheGet =
        getOneNumericFromIsoPrice(rates.cache.get as string) * tokensCacheGet;
      const costCacheSet =
        getOneNumericFromIsoPrice(rates.cache.set as string) * tokensCacheSet;

      // total: prefer CLI-reported cost, fallback to derived
      const costTotalNum =
        costUsd ?? costInput + costOutput + costCacheGet + costCacheSet;

      // derive time cost
      const costTime =
        durationMs != null ? { milliseconds: durationMs } : { milliseconds: 0 };

      // construct metrics
      const metrics = new BrainOutputMetrics({
        size: {
          tokens: {
            input: tokensInput,
            output: tokensOutput,
            cache: { get: tokensCacheGet, set: tokensCacheSet },
          },
          chars: {
            input: input.prompt.length,
            output: outputText.length,
            cache: { get: 0, set: 0 },
          },
        },
        cost: {
          time: costTime,
          cash: {
            total: getOneIsoPrice(costTotalNum),
            deets: {
              input: getOneIsoPrice(costInput),
              output: getOneIsoPrice(costOutput),
              cache: {
                get: getOneIsoPrice(costCacheGet),
                set: getOneIsoPrice(costCacheSet),
              },
            },
          },
        },
      } as BrainOutputMetrics);

      // construct exchange
      const exchange = new BrainExchange({
        hash: sha256(`${input.prompt}:${outputText}`),
        input: input.prompt,
        output: outputText,
        exid: null,
      });

      // decide whether this exchange belongs to the latest episode or starts a new one
      const episodesPrior = input.seriesPrior?.episodes ?? [];
      const episodeLatest = episodesPrior[episodesPrior.length - 1] ?? null;
      const isSameContextWindow =
        !compactionDetected &&
        episodeLatest != null &&
        sessionId != null &&
        episodeLatest.exid === sessionId;

      // derive episode exid — suffix with index when compaction splits a session into multiple episodes
      const isCompactionSplit =
        !isSameContextWindow &&
        compactionDetected &&
        sessionId != null &&
        episodeLatest?.exid != null &&
        (episodeLatest.exid === sessionId ||
          episodeLatest.exid.startsWith(`${sessionId}/`));
      const episodeExid = isCompactionSplit
        ? `${sessionId}/${episodesPrior.length}`
        : sessionId;

      // construct episode — append exchange to latest if same context window, else start fresh
      const episode = isSameContextWindow
        ? new BrainEpisode({
            hash: sha256(
              `${sessionId}:${[...episodeLatest.exchanges, exchange].map((e) => e.hash).join(':')}`,
            ),
            exid: episodeExid,
            exchanges: [...episodeLatest.exchanges, exchange],
          })
        : new BrainEpisode({
            hash: sha256(`${sessionId ?? 'ephemeral'}:${exchange.hash}`),
            exid: episodeExid,
            exchanges: [exchange],
          });

      // construct series — replace latest episode if same context window, else append new one
      const episodesForSeries = isSameContextWindow
        ? [...episodesPrior.slice(0, -1), episode]
        : [...episodesPrior, episode];

      const series = new BrainSeries({
        hash: sha256(sessionId ?? 'ephemeral'),
        exid: sessionId,
        episodes: episodesForSeries,
      });

      // construct output
      const brainOutput = new BrainOutput<string>({
        output: outputText,
        metrics,
        episode,
        series,
      });

      onResolve(brainOutput);
    };

    // named handlers — enable detach after finalize to prevent listener leak
    const onDataHandler = (chunk: Buffer | string): void => {
      if (resolved) return;
      buffer += chunk.toString();

      // process complete lines
      const lines = buffer.split('\n');
      // keep the last partial line in the buffer
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        processLine(line);
        if (resolved) return;
      }
    };

    const onEndHandler = (): void => {
      // process any leftover buffer
      if (buffer.trim()) {
        processLine(buffer);
      }
      if (!resolved) {
        finalize();
      }
    };

    const onErrorHandler = (error: Error): void => {
      if (resolved) return;
      resolved = true;
      detachListeners();
      onReject(
        new UnexpectedCodePathError('stream error while read of brain output', {
          error: error.message,
        }),
      );
    };

    // wire stdout handlers
    input.stdout.on('data', onDataHandler);
    input.stdout.on('end', onEndHandler);
    input.stdout.on('error', onErrorHandler);
  });
};
