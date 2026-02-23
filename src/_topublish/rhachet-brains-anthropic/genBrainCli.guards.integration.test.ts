import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  when,
} from 'test-fns';

import { genBrainCli } from '../rhachet/genBrainCli';
import { genContextBrainAuthAnthropic } from './genContextBrainAuthAnthropic';

const SLUG_HAIKU = 'claude@anthropic/claude/haiku';

describe('genBrainCli.guards', () => {
  const scene = useBeforeAll(async () => {
    const cwd = genTempDir({ slug: 'braincli-guards' });
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

  given('[case1] an invalid brain slug', () => {
    when('[t0] genBrainCli is called', () => {
      then('it throws a BadRequestError', async () => {
        const error = await getError(
          genBrainCli({ slug: 'invalid@unknown/slug' }, scene.context),
        );
        expect(error).toBeInstanceOf(BadRequestError);
      });
    });
  });

  given('[case2] auth context variants', () => {
    when('[t0] explicit apiKey auth is provided', () => {
      then('it returns a handle', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);
        expect(brain).toBeDefined();
        expect(brain.executor.instance).toBeNull();
      });
    });

    when('[t1] no auth context is provided (defaults to oauth)', () => {
      then('it returns a handle', async () => {
        const brain = await genBrainCli(
          { slug: SLUG_HAIKU },
          { cwd: scene.cwd },
        );
        expect(brain).toBeDefined();
        expect(brain.executor.instance).toBeNull();
      });
    });

    when('[t2] empty auth context is provided (defaults to oauth)', () => {
      then('it returns a handle', async () => {
        const brain = await genBrainCli(
          { slug: SLUG_HAIKU },
          { cwd: scene.cwd, brain: {} },
        );
        expect(brain).toBeDefined();
      });
    });

    when('[t3] invalid auth shape is provided', () => {
      then('it throws a BadRequestError', async () => {
        const error = await getError(
          genBrainCli(
            { slug: SLUG_HAIKU },
            {
              cwd: scene.cwd,
              brain: { auth: { anthropic: { bad: 'shape' } as any } },
            },
          ),
        );
        expect(error).toBeInstanceOf(BadRequestError);
      });
    });
  });

  given('[case3] a handle that has not been booted', () => {
    when('[t0] ask is called', () => {
      then('it throws an error', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);
        const error = await getError(brain.ask({ prompt: 'hello' }));
        expect(error).toBeInstanceOf(Error);
      });
    });

    when('[t1] kill is called', () => {
      then('it is a safe no-op', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);
        // should not throw
        brain.executor.kill();
        expect(brain.executor.instance).toBeNull();
      });
    });

    when('[t2] act is called', () => {
      then('it throws an error', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);
        const error = await getError(brain.act({ prompt: 'hello' }));
        expect(error).toBeInstanceOf(Error);
      });
    });

    when('[t3] terminal.write is called', () => {
      then('it throws an error', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, scene.context);
        const error = await getError(
          new Promise<void>((onDone, onFail) => {
            try {
              brain.terminal.write('hello');
              onDone();
            } catch (err) {
              onFail(err);
            }
          }),
        );
        expect(error).toBeInstanceOf(Error);
      });
    });
  });
});
