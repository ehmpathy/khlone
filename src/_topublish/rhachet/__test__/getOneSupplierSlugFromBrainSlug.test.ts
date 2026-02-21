import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { getOneSupplierSlugFromBrainSlug } from '../getOneSupplierSlugFromBrainSlug';

const TEST_CASES = [
  {
    description: 'extracts anthropic from a claude brain slug',
    given: { slug: 'claude@anthropic/claude/opus/v4.5' },
    expect: { output: 'anthropic' },
  },
  {
    description: 'extracts anthropic from a sonnet slug',
    given: { slug: 'claude@anthropic/claude/sonnet/v4.5' },
    expect: { output: 'anthropic' },
  },
  {
    description: 'extracts xai from a grok slug',
    given: { slug: 'grok@xai/grok/v1' },
    expect: { output: 'xai' },
  },
  {
    description: 'extracts opencode from an opencode slug',
    given: { slug: 'opencode@opencode/opencode/v1' },
    expect: { output: 'opencode' },
  },
];

describe('getOneSupplierSlugFromBrainSlug', () => {
  given('valid brain slugs', () => {
    TEST_CASES.map((thisCase) =>
      when(thisCase.description, () => {
        then('it returns the correct supplier slug', () => {
          const result = getOneSupplierSlugFromBrainSlug({
            slug: thisCase.given.slug,
          });
          expect(result).toEqual(thisCase.expect.output);
        });
      }),
    );
  });

  given('a slug with no @ separator', () => {
    when('called', () => {
      then('it throws a BadRequestError', async () => {
        const error = await getError(() =>
          getOneSupplierSlugFromBrainSlug({ slug: 'invalid-slug' }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect((error as Error).message).toContain('no @ separator');
      });
    });
  });

  given('a slug with no / after supplier', () => {
    when('called', () => {
      then('it throws a BadRequestError', async () => {
        const error = await getError(() =>
          getOneSupplierSlugFromBrainSlug({ slug: 'claude@anthropic' }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect((error as Error).message).toContain('no / after supplier');
      });
    });
  });
});
