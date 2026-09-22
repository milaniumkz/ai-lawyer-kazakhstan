import { LegalSourceFragment } from './legal.types';

interface OpenAiResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{ text?: string }>;
  }>;
  error?: { message?: string };
}

export function isOpenAiLegalEnabled() {
  return (process.env.AI_PROVIDER ?? '').toLowerCase() === 'openai' && Boolean(openAiApiKey());
}

export async function generateOpenAiLegalAnswer(input: { query: string; fragment: LegalSourceFragment }) {
  const apiKey = openAiApiKey();
  if (!apiKey) throw new Error('OPENAI_API_KEY_REQUIRED');

  const model = process.env.AI_COMPLEX_MODEL || process.env.AI_MEDIUM_MODEL || process.env.OPENAI_MODEL || 'gpt-5';
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 20000));

  try {
    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: 'developer',
            content:
              'Ты AI-юрист для Казахстана. Отвечай только на основе переданного официального источника РК. ' +
              'Не выдумывай нормы, не используй право РФ, не заменяй лицензированного юриста. ' +
              'Если фактов недостаточно, укажи, что нужна проверка юристом.',
          },
          {
            role: 'user',
            content: [
              `Вопрос пользователя: ${input.query}`,
              `Официальный источник: ${input.fragment.sourceUrl}`,
              `Название: ${input.fragment.title}`,
              input.fragment.article ? `Статья: ${input.fragment.article}` : '',
              `Текст источника: ${input.fragment.text}`,
              'Сформируй краткий ответ на русском языке и добавь строку "Источник:" с URL.',
            ]
              .filter(Boolean)
              .join('\n'),
          },
        ],
      }),
    });

    const body = (await response.json()) as OpenAiResponse;
    if (!response.ok) throw new Error(body.error?.message ?? `OPENAI_HTTP_${response.status}`);

    const outputText = extractOutputText(body).trim();
    if (!outputText) throw new Error('OPENAI_EMPTY_OUTPUT');
    return { message: outputText, modelId: model, provider: 'openai' };
  } finally {
    clearTimeout(timeout);
  }
}

function openAiApiKey() {
  return process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
}

function extractOutputText(body: OpenAiResponse) {
  if (body.output_text) return body.output_text;
  return (
    body.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? '')
      .join('')
      .trim() ?? ''
  );
}
