import { BadRequestError } from 'helpful-errors';

import type { BrainCli } from './BrainCli';
import type { ContextBrainAuth } from './ContextBrainAuth';
import { getOneSupplierSlugFromBrainSlug } from './getOneSupplierSlugFromBrainSlug';

/**
 * .what = route a brain slug to the correct supplier and return a BrainCli handle
 * .why = dependency inversion — khlone never touches vendor CLI args
 */
export const genBrainCli = async <
  TBrainAuthSupply extends Record<string, any> = Record<string, unknown>,
>(
  input: { slug: string },
  context: {
    cwd: string;
    env?: Record<string, string>;
  } & ContextBrainAuth<TBrainAuthSupply>,
): Promise<BrainCli> => {
  // extract supplier prefix from slug
  const supplierSlug = getOneSupplierSlugFromBrainSlug({
    slug: input.slug,
  });

  // route to supplier
  if (supplierSlug === 'anthropic') {
    const { genBrainCli: genAnthropicBrainCli } = await import(
      '../rhachet-brains-anthropic/genBrainCli'
    );
    return genAnthropicBrainCli(input, context);
  }

  // fail fast for unsupported suppliers
  throw new BadRequestError(
    `unsupported brain supplier: '${supplierSlug}' (from slug '${input.slug}')`,
    { slug: input.slug, supplierSlug },
  );
};
