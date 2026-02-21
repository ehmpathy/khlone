import { UnexpectedCodePathError } from 'helpful-errors';
import { BrainEpisode, BrainExchange, BrainSeries } from 'rhachet';
import { Readable } from 'stream';
import { getError, given, then, useThen, when } from 'test-fns';

import { CONFIG_BY_CLI_SLUG } from '../BrainCli.config';
import { getOneBrainOutputFromStreamJson } from '../getOneBrainOutputFromStreamJson';

const spec = CONFIG_BY_CLI_SLUG['claude@anthropic/claude/opus/v4.5'].spec;

/**
 * .what = create a readable stream from nd-JSON lines
 * .why = synthetic test data for the stream parser
 */
const getOneStreamFromLines = (lines: string[]): Readable => {
  const stream = new Readable({ read() {} });
  // push all lines as a single chunk (simulates buffered read)
  const data = lines.join('\n') + '\n';
  process.nextTick(() => {
    stream.push(data);
    stream.push(null);
  });
  return stream;
};

describe('getOneBrainOutputFromStreamJson', () => {
  given('a stream with system, assistant, and result events', () => {
    when('parsed', () => {
      const result = useThen('it returns a BrainOutput', async () => {
        const lines = [
          JSON.stringify({
            type: 'system',
            session_id: 'sess-abc-123',
          }),
          JSON.stringify({
            type: 'assistant',
            message: {
              content: [{ type: 'text', text: 'the answer is 4' }],
            },
            session_id: 'sess-abc-123',
          }),
          JSON.stringify({
            type: 'result',
            result: 'the answer is 4',
            session_id: 'sess-abc-123',
            cost_usd: 0.003,
            duration_ms: 1234,
            is_error: false,
          }),
        ];
        return getOneBrainOutputFromStreamJson({
          prompt: 'what is 2+2?',
          stdout: getOneStreamFromLines(lines),
          spec,
          seriesPrior: null,
        });
      });

      then('output contains the text', () => {
        expect(result.output).toEqual('the answer is 4');
      });

      then('series.exid is the session_id', () => {
        expect(result.series).not.toBeNull();
        expect(result.series!.exid).toEqual('sess-abc-123');
      });

      then('episode.exid is the session_id', () => {
        expect(result.episode.exid).toEqual('sess-abc-123');
      });

      then('metrics.cost.time reflects duration', () => {
        expect(result.metrics.cost.time).toEqual({
          milliseconds: 1234,
        });
      });

      then('metrics.cost.cash.total reflects CLI cost', () => {
        expect(result.metrics.cost.cash.total).toContain('0.003');
      });
    });
  });

  given('a stream with stream_event wrappers and token counts', () => {
    when('parsed', () => {
      const result = useThen('it returns a BrainOutput', async () => {
        const lines = [
          JSON.stringify({
            type: 'system',
            session_id: 'sess-def-456',
          }),
          JSON.stringify({
            type: 'stream_event',
            event: {
              type: 'message_start',
              message: { usage: { input_tokens: 500 } },
            },
          }),
          JSON.stringify({
            type: 'stream_event',
            event: {
              type: 'content_block_delta',
              delta: { type: 'text_delta', text: 'hello ' },
            },
          }),
          JSON.stringify({
            type: 'stream_event',
            event: {
              type: 'content_block_delta',
              delta: { type: 'text_delta', text: 'world' },
            },
          }),
          JSON.stringify({
            type: 'stream_event',
            event: {
              type: 'message_delta',
              usage: {
                input_tokens: 500,
                output_tokens: 20,
                cache_creation_input_tokens: 10,
                cache_read_input_tokens: 100,
              },
            },
          }),
          JSON.stringify({
            type: 'result',
            result: 'hello world',
            session_id: 'sess-def-456',
            cost_usd: 0.001,
            duration_ms: 500,
            is_error: false,
          }),
        ];
        return getOneBrainOutputFromStreamJson({
          prompt: 'say hello world',
          stdout: getOneStreamFromLines(lines),
          spec,
          seriesPrior: null,
        });
      });

      then('metrics.size.tokens.input reflects message_start', () => {
        expect(result.metrics.size.tokens.input).toEqual(500);
      });

      then('metrics.size.tokens.output reflects message_delta', () => {
        expect(result.metrics.size.tokens.output).toEqual(20);
      });

      then('metrics.size.tokens.cache reflects message_delta', () => {
        expect(result.metrics.size.tokens.cache.set).toEqual(10);
        expect(result.metrics.size.tokens.cache.get).toEqual(100);
      });

      then('output text is the result text', () => {
        expect(result.output).toEqual('hello world');
      });
    });
  });

  given('a stream that ends without a result event', () => {
    when('parsed', () => {
      const result = useThen('it finalizes on stream end', async () => {
        const lines = [
          JSON.stringify({
            type: 'assistant',
            message: {
              content: [{ type: 'text', text: 'partial output' }],
            },
          }),
        ];
        return getOneBrainOutputFromStreamJson({
          prompt: 'test prompt',
          stdout: getOneStreamFromLines(lines),
          spec,
          seriesPrior: null,
        });
      });

      then('output contains the accumulated text', () => {
        expect(result.output).toEqual('partial output');
      });

      then('series.exid is null', () => {
        expect(result.series!.exid).toBeNull();
      });
    });
  });

  given('a stream that emits an error', () => {
    when('parsed', () => {
      then('it throws an UnexpectedCodePathError', async () => {
        const stream = new Readable({ read() {} });

        // emit error after a tick
        process.nextTick(() => {
          stream.destroy(new Error('connection reset'));
        });

        const error = await getError(
          getOneBrainOutputFromStreamJson({
            prompt: 'test prompt',
            stdout: stream,
            spec,
            seriesPrior: null,
          }),
        );
        expect(error).toBeInstanceOf(UnexpectedCodePathError);
        expect((error as Error).message).toContain('stream error');
      });
    });
  });

  given(
    '[case5] a prior series with same session_id (same context window)',
    () => {
      when('[t0] parsed with a result from the same session', () => {
        const result = useThen(
          'it appends exchange to latest episode and replaces it',
          async () => {
            const priorExchange = new BrainExchange({
              hash: 'exchange-1-hash',
              input: 'first prompt',
              output: 'first output',
              exid: null,
            });
            const priorEpisode = new BrainEpisode({
              hash: 'episode-1-hash',
              exid: 'sess-same',
              exchanges: [priorExchange],
            });
            const seriesPrior = new BrainSeries({
              hash: 'series-hash',
              exid: 'sess-same',
              episodes: [priorEpisode],
            });
            const lines = [
              JSON.stringify({
                type: 'result',
                result: 'second output',
                session_id: 'sess-same',
                cost_usd: 0.002,
                duration_ms: 800,
                is_error: false,
              }),
            ];
            return getOneBrainOutputFromStreamJson({
              prompt: 'second prompt',
              stdout: getOneStreamFromLines(lines),
              spec,
              seriesPrior,
            });
          },
        );

        then(
          'series still has exactly 1 episode (replaced, not appended)',
          () => {
            expect(result.series!.episodes.length).toEqual(1);
          },
        );

        then('episode has 2 exchanges (prior + new)', () => {
          expect(result.episode.exchanges.length).toEqual(2);
          expect(result.episode.exchanges[0]!.input).toEqual('first prompt');
          expect(result.episode.exchanges[1]!.input).toEqual('second prompt');
        });

        then('episode exid matches session_id', () => {
          expect(result.episode.exid).toEqual('sess-same');
        });

        then('series exid matches session_id', () => {
          expect(result.series!.exid).toEqual('sess-same');
        });
      });
    },
  );

  given(
    '[case6] a prior series with different session_id (new context window)',
    () => {
      when('[t0] parsed with a result from a new session', () => {
        const result = useThen(
          'it appends a new episode to the series',
          async () => {
            const priorExchange = new BrainExchange({
              hash: 'exchange-1-hash',
              input: 'first prompt',
              output: 'first output',
              exid: null,
            });
            const priorEpisode = new BrainEpisode({
              hash: 'episode-1-hash',
              exid: 'sess-old',
              exchanges: [priorExchange],
            });
            const seriesPrior = new BrainSeries({
              hash: 'series-hash',
              exid: 'sess-old',
              episodes: [priorEpisode],
            });
            const lines = [
              JSON.stringify({
                type: 'result',
                result: 'new context output',
                session_id: 'sess-new',
                cost_usd: 0.002,
                duration_ms: 800,
                is_error: false,
              }),
            ];
            return getOneBrainOutputFromStreamJson({
              prompt: 'new context prompt',
              stdout: getOneStreamFromLines(lines),
              spec,
              seriesPrior,
            });
          },
        );

        then('series has 2 episodes (old + new)', () => {
          expect(result.series!.episodes.length).toEqual(2);
        });

        then('first episode is the prior one (untouched)', () => {
          expect(result.series!.episodes[0]!.exid).toEqual('sess-old');
          expect(result.series!.episodes[0]!.exchanges.length).toEqual(1);
        });

        then('second episode is the new one with 1 exchange', () => {
          expect(result.series!.episodes[1]!.exid).toEqual('sess-new');
          expect(result.series!.episodes[1]!.exchanges.length).toEqual(1);
          expect(result.series!.episodes[1]!.exchanges[0]!.input).toEqual(
            'new context prompt',
          );
        });

        then('series exid updates to the new session_id', () => {
          expect(result.series!.exid).toEqual('sess-new');
        });
      });
    },
  );

  given(
    '[case7] a prior series with same session_id but compact_boundary event (compaction)',
    () => {
      when('[t0] parsed with a compact_boundary before the result', () => {
        const result = useThen(
          'it starts a new episode despite same session_id',
          async () => {
            const priorExchange = new BrainExchange({
              hash: 'exchange-1-hash',
              input: 'first prompt',
              output: 'first output',
              exid: null,
            });
            const priorEpisode = new BrainEpisode({
              hash: 'episode-1-hash',
              exid: 'sess-same',
              exchanges: [priorExchange],
            });
            const seriesPrior = new BrainSeries({
              hash: 'series-hash',
              exid: 'sess-same',
              episodes: [priorEpisode],
            });
            const lines = [
              JSON.stringify({
                type: 'system',
                session_id: 'sess-same',
                subtype: 'compact_boundary',
              }),
              JSON.stringify({
                type: 'result',
                result: 'post-compaction output',
                session_id: 'sess-same',
                cost_usd: 0.002,
                duration_ms: 600,
                is_error: false,
              }),
            ];
            return getOneBrainOutputFromStreamJson({
              prompt: 'post-compaction prompt',
              stdout: getOneStreamFromLines(lines),
              spec,
              seriesPrior,
            });
          },
        );

        then('series has 2 episodes (pre + post compaction)', () => {
          expect(result.series!.episodes.length).toEqual(2);
        });

        then('first episode is the prior one (untouched)', () => {
          expect(result.series!.episodes[0]!.exid).toEqual('sess-same');
          expect(result.series!.episodes[0]!.exchanges.length).toEqual(1);
        });

        then(
          'second episode has suffixed exid to distinguish from pre-compaction episode',
          () => {
            expect(result.series!.episodes[1]!.exid).toEqual('sess-same/1');
            expect(result.series!.episodes[1]!.exchanges.length).toEqual(1);
            expect(result.series!.episodes[1]!.exchanges[0]!.input).toEqual(
              'post-compaction prompt',
            );
          },
        );
      });
    },
  );
});
