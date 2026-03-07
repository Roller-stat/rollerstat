export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'it', 'pt'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type TranslationMode = 'translate-only';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  pt: 'Portuguese',
};

interface TranslatePostInput {
  sourceLocale: SupportedLocale;
  targetLocale: SupportedLocale;
  mode: TranslationMode;
  title: string;
  summary: string;
  content: string;
  tags: string[];
}

interface TranslatePostOutput {
  title: string;
  summary: string;
  content: string;
  tags: string[];
}

function stripCodeFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  const withoutStart = trimmed.replace(/^```(?:json)?\s*/i, '');
  return withoutStart.replace(/\s*```$/, '').trim();
}

function parseJsonObject(text: string): Record<string, unknown> {
  const cleaned = stripCodeFence(text);
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(candidate) as Record<string, unknown>;
}

function resolveGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const modelName = (process.env.MODEL_NAME || 'gemini-2.0-flash-lite').trim();

  if (!apiKey) {
    return null;
  }

  return { apiKey, modelName };
}

function buildPrompt(input: TranslatePostInput): string {
  const sourceLanguage = LOCALE_LABELS[input.sourceLocale];
  const targetLanguage = LOCALE_LABELS[input.targetLocale];

  return [
    'You are a professional multilingual editor for a sports media website.',
    `Task: Translate from ${sourceLanguage} to ${targetLanguage}.`,
    'Mode: translate-only (no rewriting, no tone changes, no extra content).',
    'Rules:',
    '- Preserve meaning and factual content exactly.',
    '- Keep Markdown/MDX structure intact.',
    '- Do not add prefaces, explanations, or comments.',
    '- Return JSON only with keys: title, summary, content, tags.',
    '- tags must be an array of short strings.',
    '',
    `Input title:\n${input.title}`,
    '',
    `Input summary:\n${input.summary}`,
    '',
    `Input content:\n${input.content}`,
    '',
    `Input tags (JSON array): ${JSON.stringify(input.tags || [])}`,
  ].join('\n');
}

export async function translatePostWithGemini(
  input: TranslatePostInput,
): Promise<TranslatePostOutput> {
  if (input.sourceLocale === input.targetLocale) {
    return {
      title: input.title.trim(),
      summary: input.summary.trim(),
      content: input.content,
      tags: (input.tags || []).map((tag) => tag.trim()).filter(Boolean),
    };
  }

  const config = resolveGeminiConfig();
  if (!config) {
    throw new Error('Missing GEMINI_API_KEY for locale generation.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    config.modelName,
  )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(input) }],
          },
        ],
      }),
      signal: controller.signal,
    });

    const payload = (await response.json()) as {
      error?: { message?: string };
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    if (!response.ok) {
      const message = payload.error?.message || `Gemini request failed with status ${response.status}`;
      throw new Error(message);
    }

    const rawText =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('\n')
        .trim() || '';

    if (!rawText) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsed = parseJsonObject(rawText);
    const title = String(parsed.title || '').trim();
    const summary = String(parsed.summary || '').trim();
    const content = String(parsed.content || '').trim();
    const rawTags = Array.isArray(parsed.tags) ? parsed.tags : [];
    const tags = rawTags.map((tag) => String(tag || '').trim()).filter(Boolean);

    if (!title || !summary || !content) {
      throw new Error('Gemini translation response is missing required fields.');
    }

    return {
      title,
      summary,
      content,
      tags,
    };
  } finally {
    clearTimeout(timeout);
  }
}
