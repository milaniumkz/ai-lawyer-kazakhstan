import { classifyWithProvider } from './structured-classifier.adapter';

describe('structured classifier provider boundary', () => {
  const previous = { provider: process.env.AI_PROVIDER, key: process.env.AI_API_KEY };
  afterEach(() => {
    jest.restoreAllMocks();
    if (previous.provider === undefined) delete process.env.AI_PROVIDER; else process.env.AI_PROVIDER = previous.provider;
    if (previous.key === undefined) delete process.env.AI_API_KEY; else process.env.AI_API_KEY = previous.key;
  });
  it('uses approved codes and required facts while enforcing server risk rules', async () => {
    process.env.AI_PROVIDER = 'openai'; process.env.AI_API_KEY = 'test';
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ output_text: JSON.stringify({
      code: 'labor.wage_arrears', confidence: 0.89, facts: [{ field: 'employment_period', value: 'июнь' }, { field: 'invented', value: 'ignore' }], alternatives: ['labor.wage_arrears', 'civil.debt.loan'],
    }) }), { status: 200 }));
    const result = await classifyWithProvider('Работодатель не выплатил зарплату за июнь');
    expect(result.facts).toEqual({ employment_period: 'июнь' });
    expect(result.missing_facts).not.toContain('employment_period');
    expect(result.missing_facts).toContain('amount');
    expect(result.reasons).toContain('structured_provider_classification');
    expect(result.alternatives.map(item => item.code)).toEqual(['civil.debt.loan']);
  });
  it('rejects unknown output and safely marks provider failure for review', async () => {
    process.env.AI_PROVIDER = 'openai'; process.env.AI_API_KEY = 'test';
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ output_text: JSON.stringify({ code: 'invented.foreign', confidence: 1, facts: [], alternatives: [] }) }), { status: 200 }));
    const result = await classifyWithProvider('Работодатель не выплатил зарплату');
    expect(result.required_human_review).toBe(true);
    expect(result.reasons).toContain('provider_unavailable_manual_review');
    expect(result.jurisdiction).toBe('KZ');
  });
});
