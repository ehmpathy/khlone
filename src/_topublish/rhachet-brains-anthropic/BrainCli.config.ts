import { BadRequestError } from 'helpful-errors';
import type { BrainSpec } from 'rhachet';
import {
  type AnthropicBrainAtomSlug,
  CONFIG_BY_ATOM_SLUG,
} from 'rhachet-brains-anthropic/dist/domain.operations/atoms/BrainAtom.config';

/**
 * .what = supported anthropic brain CLI slugs
 * .why = type-safe slug specification for BrainCli handles
 *
 * .note = format: '<binary>@<supplier>/<atom-slug>'
 * .note = the CLI replaces the repl — it supplies its own tool-use loop — so the slug references the atom (model) directly
 */
export type AnthropicBrainCliSlug =
  | 'claude@anthropic/claude/haiku'
  | 'claude@anthropic/claude/haiku/v4.5'
  | 'claude@anthropic/claude/sonnet'
  | 'claude@anthropic/claude/sonnet/v4'
  | 'claude@anthropic/claude/sonnet/v4.5'
  | 'claude@anthropic/claude/opus'
  | 'claude@anthropic/claude/opus/v4.5';

/**
 * .what = config shape for a brain CLI supplier
 * .why = maps a slug to the model, spec, and tool sets needed for spawn
 */
export interface AnthropicBrainCliConfig {
  slug: AnthropicBrainCliSlug;
  model: string;
  spec: BrainSpec;
  tools: {
    ask: string[];
    act: string[];
  };
}

// shared tool sets
const TOOLS_ASK = ['Read', 'Grep', 'Glob', 'WebSearch', 'WebFetch'] as const;
const TOOLS_ACT = [
  'Read',
  'Grep',
  'Glob',
  'Edit',
  'Write',
  'Bash',
  'WebSearch',
  'WebFetch',
] as const;

/**
 * .what = extract the atom slug from a CLI slug
 * .why = the atom slug portion after '<binary>@<supplier>/' maps to CONFIG_BY_ATOM_SLUG
 */
const getOneAtomSlug = (input: {
  cliSlug: AnthropicBrainCliSlug;
}): AnthropicBrainAtomSlug => {
  // cli slug format: '<binary>@<supplier>/<atom-slug>'
  const afterAt = input.cliSlug.slice(input.cliSlug.indexOf('@') + 1);
  const atomSlug = afterAt.slice(afterAt.indexOf('/') + 1);
  return atomSlug as AnthropicBrainAtomSlug;
};

/**
 * .what = build a BrainCli config from a CLI slug
 * .why = explicit config derivation — called directly, no hidden map
 */
export const getOneAnthropicBrainCliConfig = (input: {
  slug: string;
}): AnthropicBrainCliConfig => {
  // validate slug format
  const validSlugs: AnthropicBrainCliSlug[] = [
    'claude@anthropic/claude/haiku',
    'claude@anthropic/claude/haiku/v4.5',
    'claude@anthropic/claude/sonnet',
    'claude@anthropic/claude/sonnet/v4',
    'claude@anthropic/claude/sonnet/v4.5',
    'claude@anthropic/claude/opus',
    'claude@anthropic/claude/opus/v4.5',
  ];
  if (!validSlugs.includes(input.slug as AnthropicBrainCliSlug))
    BadRequestError.throw('unrecognized anthropic brain CLI slug', {
      slug: input.slug,
      valid: validSlugs,
    });

  // derive atom config from slug
  const cliSlug = input.slug as AnthropicBrainCliSlug;
  const atomSlug = getOneAtomSlug({ cliSlug });
  const atomConfig = CONFIG_BY_ATOM_SLUG[atomSlug];

  return {
    slug: cliSlug,
    model: atomConfig.model,
    spec: atomConfig.spec,
    tools: {
      ask: [...TOOLS_ASK],
      act: [...TOOLS_ACT],
    },
  };
};
