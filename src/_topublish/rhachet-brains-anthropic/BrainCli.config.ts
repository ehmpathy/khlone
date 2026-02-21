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
 * .why = maps a slug to the binary, spec, and tool sets needed for spawn
 */
export interface AnthropicBrainCliConfig {
  slug: AnthropicBrainCliSlug;
  binary: string;
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
 * .why = reuse BrainSpec from the atom config — single source of truth for model specs
 */
const getOneConfig = (input: {
  cliSlug: AnthropicBrainCliSlug;
}): AnthropicBrainCliConfig => {
  const atomSlug = getOneAtomSlug({ cliSlug: input.cliSlug });
  const atomConfig = CONFIG_BY_ATOM_SLUG[atomSlug];
  return {
    slug: input.cliSlug,
    binary: 'claude',
    model: atomConfig.model,
    spec: atomConfig.spec,
    tools: {
      ask: [...TOOLS_ASK],
      act: [...TOOLS_ACT],
    },
  };
};

/**
 * .what = config map from brain CLI slug to spawn config
 * .why = single source of truth for all anthropic brain CLI handles
 */
export const CONFIG_BY_CLI_SLUG: Record<
  AnthropicBrainCliSlug,
  AnthropicBrainCliConfig
> = {
  // family aliases (latest version per family)
  'claude@anthropic/claude/haiku': getOneConfig({
    cliSlug: 'claude@anthropic/claude/haiku',
  }),
  'claude@anthropic/claude/sonnet': getOneConfig({
    cliSlug: 'claude@anthropic/claude/sonnet',
  }),
  'claude@anthropic/claude/opus': getOneConfig({
    cliSlug: 'claude@anthropic/claude/opus',
  }),
  // pinned versions
  'claude@anthropic/claude/haiku/v4.5': getOneConfig({
    cliSlug: 'claude@anthropic/claude/haiku/v4.5',
  }),
  'claude@anthropic/claude/sonnet/v4': getOneConfig({
    cliSlug: 'claude@anthropic/claude/sonnet/v4',
  }),
  'claude@anthropic/claude/sonnet/v4.5': getOneConfig({
    cliSlug: 'claude@anthropic/claude/sonnet/v4.5',
  }),
  'claude@anthropic/claude/opus/v4.5': getOneConfig({
    cliSlug: 'claude@anthropic/claude/opus/v4.5',
  }),
};
