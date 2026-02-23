import { given, then, when } from 'test-fns';

import type { ContextBrainAuth } from './ContextBrainAuth';

/**
 * .what = compile-time type assertions for ContextBrainAuth
 * .why = proves the generic auth context type accepts valid shapes and rejects invalid ones
 */
describe('ContextBrainAuth', () => {
  given('[case1] valid shapes', () => {
    when('[t0] positive: all optional keys omitted', () => {
      then('it compiles', () => {
        const ctx: ContextBrainAuth = {};
        expect(ctx).toBeDefined();
      });
    });

    when('[t1] positive: brain key present but empty', () => {
      then('it compiles', () => {
        const ctx: ContextBrainAuth = { brain: {} };
        expect(ctx).toBeDefined();
      });
    });

    when('[t2] positive: brain.auth present but empty', () => {
      then('it compiles', () => {
        const ctx: ContextBrainAuth = { brain: { auth: {} } };
        expect(ctx).toBeDefined();
      });
    });

    when('[t3] positive: narrowed with supplier key', () => {
      then('it compiles', () => {
        const ctx: ContextBrainAuth<{
          anthropic: { via: { apiKey: string } };
        }> = {
          brain: { auth: { anthropic: { via: { apiKey: 'sk-test' } } } },
        };
        expect(ctx).toBeDefined();
      });
    });

    when('[t4] positive: narrowed supplier key with brain omitted', () => {
      then('it compiles (brain is optional)', () => {
        const ctx: ContextBrainAuth<{
          anthropic: { via: { oauth: true } };
        }> = {};
        expect(ctx).toBeDefined();
      });
    });
  });

  given('[case2] invalid shapes', () => {
    when('[t0] negative: narrowed generic rejects wrong supplier shape', () => {
      then('it fails to compile', () => {
        type Narrowed = ContextBrainAuth<{
          anthropic: { via: { apiKey: string } };
        }>;
        const _ctx: Narrowed = {
          // @ts-expect-error — wrong shape: 'bad' is not { via: { apiKey: string } }
          brain: { auth: { anthropic: { bad: 'shape' } } },
        };
      });
    });

    when('[t1] negative: brain must be an object if present', () => {
      then('it fails to compile', () => {
        // @ts-expect-error — brain must be { auth?: ... }, not a string
        const _ctx: ContextBrainAuth = { brain: 'not-an-object' };
      });
    });

    when('[t2] negative: auth must be a record if present', () => {
      then('it fails to compile', () => {
        // @ts-expect-error — auth must be Record, not a string
        const _ctx: ContextBrainAuth = { brain: { auth: 'not-a-record' } };
      });
    });
  });
});
