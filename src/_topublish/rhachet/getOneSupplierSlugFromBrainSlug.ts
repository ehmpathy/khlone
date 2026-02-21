import { BadRequestError } from 'helpful-errors';

/**
 * .what = extract the supplier slug from a brain slug
 * .why = the contract factory routes to the correct supplier without knowledge of slug internals
 *
 * .note = slug format: '<name>@<supplier>/<path...>'
 * .note = e.g., 'claude@anthropic/claude/opus/v4.5' returns 'anthropic'
 */
export const getOneSupplierSlugFromBrainSlug = (input: {
  slug: string;
}): string => {
  // find the @ separator
  const atIndex = input.slug.indexOf('@');
  if (atIndex === -1)
    BadRequestError.throw('invalid brain slug: no @ separator', {
      slug: input.slug,
    });

  // extract the supplier prefix between @ and first /
  const afterAt = input.slug.slice(atIndex + 1);
  const slashIndex = afterAt.indexOf('/');
  if (slashIndex === -1)
    BadRequestError.throw('invalid brain slug: no / after supplier', {
      slug: input.slug,
    });

  return afterAt.slice(0, slashIndex);
};
