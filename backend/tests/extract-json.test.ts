import { extractJson } from '../src/infrastructure/utils/extract-json';

describe('extractJson', () => {
  it('should parse a plain JSON string', () => {
    const input = '{"key": "value"}';
    expect(extractJson(input)).toEqual({ key: 'value' });
  });

  it('should extract JSON from a markdown code block', () => {
    const input = '```json\n{"summary": "test"}\n```';
    expect(extractJson(input)).toEqual({ summary: 'test' });
  });

  it('should extract JSON when surrounded by extra text', () => {
    const input = 'Here is the result: {"topics": [1, 2, 3]} end';
    expect(extractJson(input)).toEqual({ topics: [1, 2, 3] });
  });

  it('should handle markdown block with uppercase JSON tag', () => {
    const input = '```JSON\n{"key": 42}\n```';
    expect(extractJson(input)).toEqual({ key: 42 });
  });

  it('should throw when no valid JSON is found', () => {
    expect(() => extractJson('no json here')).toThrow('Unable to extract valid JSON from Gemini response');
  });

  it('should throw when braces are present but content is not valid JSON', () => {
    expect(() => extractJson('{ this is not json }')).toThrow();
  });
});
