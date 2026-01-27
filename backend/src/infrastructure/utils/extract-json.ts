export function extractJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {}

  const markdownMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (markdownMatch) {
    return JSON.parse(markdownMatch[1]);
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    const sliced = text.slice(firstBrace, lastBrace + 1);
    return JSON.parse(sliced);
  }

  throw new Error('Unable to extract valid JSON from Gemini response');
}
