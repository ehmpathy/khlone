import { given, then, when } from 'test-fns';

import type { BrainAuthAnthropic } from './BrainAuthAnthropic';
import { genContextBrainAuthAnthropic } from './genContextBrainAuthAnthropic';

/**
 * .what = compile-time type assertions for BrainAuthAnthropic and genContextBrainAuthAnthropic
 * .why = proves PickOne enforces exactly one auth variant at compile time
 */
describe('BrainAuthAnthropic', () => {
  given('[case1] valid via shapes', () => {
    when('[t0] positive: oauth via', () => {
      then('it compiles', () => {
        const auth: BrainAuthAnthropic = { via: { oauth: true } };
        expect(auth).toBeDefined();
      });
    });

    when('[t1] positive: apiKey via', () => {
      then('it compiles', () => {
        const auth: BrainAuthAnthropic = { via: { apiKey: 'sk-test' } };
        expect(auth).toBeDefined();
      });
    });
  });

  given('[case2] invalid via shapes', () => {
    when('[t0] negative: empty via', () => {
      then('it fails to compile', () => {
        // @ts-expect-error — via must have exactly one key (oauth or apiKey)
        const _auth: BrainAuthAnthropic = { via: {} };
      });
    });

    when('[t1] negative: oauth with wrong value type', () => {
      then('it fails to compile', () => {
        // @ts-expect-error — oauth must be true, not a string
        const _auth: BrainAuthAnthropic = { via: { oauth: 'yes' } };
      });
    });

    when('[t2] negative: apiKey with wrong value type', () => {
      then('it fails to compile', () => {
        // @ts-expect-error — apiKey must be string, not number
        const _auth: BrainAuthAnthropic = { via: { apiKey: 123 } };
      });
    });

    when('[t3] negative: unrecognized via key', () => {
      then('it fails to compile', () => {
        // @ts-expect-error — 'password' is not a valid via key
        const _auth: BrainAuthAnthropic = { via: { password: 'secret' } };
      });
    });

    when('[t4] negative: absent via key', () => {
      then('it fails to compile', () => {
        // @ts-expect-error — via is required
        const _auth: BrainAuthAnthropic = {};
      });
    });
  });

  given('[case3] genContextBrainAuthAnthropic type safety', () => {
    when('[t0] positive: valid apiKey via', () => {
      then('it compiles and returns correct shape', () => {
        const ctx = genContextBrainAuthAnthropic({
          via: { apiKey: 'sk-test' },
        });
        expect(ctx.brain).toBeDefined();
        expect(ctx.brain!.auth).toBeDefined();
      });
    });

    when('[t1] positive: valid oauth via', () => {
      then('it compiles', () => {
        const ctx = genContextBrainAuthAnthropic({
          via: { oauth: true },
        });
        expect(ctx).toBeDefined();
      });
    });

    when('[t2] negative: empty via', () => {
      then('it fails to compile', () => {
        // @ts-expect-error — via must have exactly one key
        genContextBrainAuthAnthropic({ via: {} });
      });
    });

    when('[t3] negative: wrong via key', () => {
      then('it fails to compile', () => {
        // @ts-expect-error — 'token' is not a valid via key
        genContextBrainAuthAnthropic({ via: { token: 'abc' } });
      });
    });
  });
});
