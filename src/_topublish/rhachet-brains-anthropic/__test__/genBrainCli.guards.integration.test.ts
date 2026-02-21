import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { genBrainCli } from '../../rhachet/genBrainCli';

const SLUG_HAIKU = 'claude@anthropic/claude/haiku';
const CWD = process.cwd();

describe('genBrainCli.guards', () => {
  given('[case1] an invalid brain slug', () => {
    when('[t0] genBrainCli is called', () => {
      then('it throws a BadRequestError', async () => {
        const error = await getError(
          genBrainCli({ slug: 'invalid@unknown/slug' }, { cwd: CWD }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
      });
    });
  });

  given('[case2] a handle that has not been booted', () => {
    when('[t0] ask is called', () => {
      then('it throws an error', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });
        const error = await getError(brain.ask({ prompt: 'hello' }));
        expect(error).toBeInstanceOf(Error);
      });
    });

    when('[t1] kill is called', () => {
      then('it is a safe no-op', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });
        // should not throw
        brain.executor.kill();
        expect(brain.executor.instance).toBeNull();
      });
    });

    when('[t2] act is called', () => {
      then('it throws an error', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });
        const error = await getError(brain.act({ prompt: 'hello' }));
        expect(error).toBeInstanceOf(Error);
      });
    });

    when('[t3] terminal.write is called', () => {
      then('it throws an error', async () => {
        const brain = await genBrainCli({ slug: SLUG_HAIKU }, { cwd: CWD });
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
