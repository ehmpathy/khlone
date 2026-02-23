import { isBrainAuthAnthropic } from './BrainAuthAnthropic';

const TEST_CASES = [
  {
    description: 'oauth via — returns true',
    input: { via: { oauth: true } },
    expected: true,
  },
  {
    description: 'apiKey via — returns true',
    input: { via: { apiKey: 'sk-ant-test-key' } },
    expected: true,
  },
  {
    description: 'both keys present — returns true',
    input: { via: { oauth: true, apiKey: 'sk-ant-test-key' } },
    expected: true,
  },
  {
    description: 'null — returns false',
    input: null,
    expected: false,
  },
  {
    description: 'empty object — returns false',
    input: {},
    expected: false,
  },
  {
    description: 'via is null — returns false',
    input: { via: null },
    expected: false,
  },
  {
    description: 'via is empty object — returns false',
    input: { via: {} },
    expected: false,
  },
  {
    description: 'non-object — returns false',
    input: 'not-an-object',
    expected: false,
  },
  {
    description: 'via with wrong oauth type — returns false',
    input: { via: { oauth: 'yes' } },
    expected: false,
  },
  {
    description: 'via with wrong apiKey type — returns false',
    input: { via: { apiKey: 123 } },
    expected: false,
  },
];

describe('isBrainAuthAnthropic', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isBrainAuthAnthropic(thisCase.input)).toEqual(thisCase.expected);
    }),
  );
});
