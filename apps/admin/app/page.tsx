"use client";

import { useState } from 'react';
import { tokens } from '../src/design-system/tokens';
import { apiPaths } from '../src/api/api-paths';

const cards = [
  ['Активные дела', '128'],
  ['На проверке эксперта', '17'],
  ['Расход AI за месяц', '₸ 482 000'],
  ['OTP / stub auth', 'local'],
];

const auditEvents = ['otp_requested', 'login', 'session_created', 'profile_created', 'logout_all_devices'];
const caseStatuses = ['consultation', 'clarification_required', 'transcribing', 'classifying', 'ready'];
const documentStatuses = ['upload_pending', 'quarantined', 'ocr_review_required', 'ready', 'rejected'];
const ragStatuses = ['confirmed', 'invalid', 'insufficient_authoritative_sources', 'clarify_or_human_review'];
const templateStatuses = ['draft', 'expert_review', 'approved', 'published', 'archived'];
const budgetControls = ['70%', '85%', '100%', 'kill switch', 'TTS disable'];

type AuditEvent = { id: string; action: string; correlationId: string; createdAt: string };
type ProviderConfig = { provider: string; enabled: boolean; killSwitchReason?: string };

export default function AdminHome() {
  const [auditStatus, setAuditStatus] = useState('Audit events не загружены');
  const [providerStatus, setProviderStatus] = useState('Provider status не загружен');
  const [legalStatus, setLegalStatus] = useState('Legal source import не запускался');
  const [busy, setBusy] = useState(false);

  async function apiJson(path: string, init?: RequestInit) {
    const response = await fetch(`/api/v1${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': 'admin-ops',
        'x-user-role': 'admin',
        ...(init?.headers ?? {}),
      },
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message ?? body.error ?? path);
    return body;
  }

  async function loadAuditEvents() {
    setBusy(true);
    try {
      const events = (await apiJson('/admin/audit-events')) as AuditEvent[];
      setAuditStatus(`Audit events: ${events.length}; last=${events[0]?.action ?? 'none'}`);
    } catch (error) {
      setAuditStatus(error instanceof Error ? `Audit API error: ${error.message}` : 'Audit API error');
    } finally {
      setBusy(false);
    }
  }

  async function toggleStubProvider() {
    setBusy(true);
    try {
      const current = (await apiJson('/admin/providers')) as ProviderConfig[];
      const stub = current.find((item) => item.provider === 'stub') ?? { provider: 'stub', enabled: true };
      const next = (await apiJson('/admin/providers', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'stub',
          enabled: !stub.enabled,
          killSwitchReason: stub.enabled ? 'admin_rc_kill_switch' : undefined,
        }),
      })) as ProviderConfig;
      setProviderStatus(`Provider stub: ${next.enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      setProviderStatus(error instanceof Error ? `Provider API error: ${error.message}` : 'Provider API error');
    } finally {
      setBusy(false);
    }
  }

  async function importLegalSourceFixture() {
    setBusy(true);
    try {
      const source = (await apiJson('/legal-sources/manual-import', {
        method: 'POST',
        body: JSON.stringify({
          officialId: `admin:fixture:${Date.now()}`,
          title: 'Admin RC официальный фрагмент',
          sourceType: 'law',
          authority: 'Әділет',
          language: 'ru',
          article: '1',
          text: 'Официальный тестовый фрагмент РК для проверки ручного импорта.',
          sourceUrl: 'https://adilet.zan.kz/rus/docs/admin-rc',
          effectiveFrom: '2024-01-01T00:00:00.000Z',
          sourceVersion: '2024-01-01',
          status: 'active',
        }),
      })) as { id: string };
      setLegalStatus(`Legal source imported: ${source.id.slice(0, 8)}`);
    } catch (error) {
      setLegalStatus(error instanceof Error ? `Legal source API error: ${error.message}` : 'Legal source API error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <p>AI-Юрист Казахстан</p>
        <h1>Панель контроля качества и бюджета</h1>
      </section>
      <section className="grid">
        {cards.map(([label, value]) => (
          <article className="card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <section className="notice">
        <strong>Юридический guardrail</strong>
        <span>Ответы строятся только по официальным источникам РК. Высокий риск требует проверки экспертом.</span>
      </section>
      <section className="notice">
        <strong>Identity наблюдаемость</strong>
        <span>Регистрация, сессии, согласия и профили пишут audit events без raw ИИН/БИН и секретов.</span>
        <button disabled={busy} onClick={() => { void loadAuditEvents(); }}>Загрузить audit events</button>
        <small>{auditStatus}</small>
        <div className="pills">
          {auditEvents.map((event) => (
            <span key={event}>{event}</span>
          ))}
        </div>
      </section>
      <section className="notice">
        <strong>Case/chat/voice</strong>
        <span>Создание дела идемпотентно, голосовой intake работает в stub mode, статусы совместимы с SSE/WebSocket контрактом.</span>
        <div className="pills">
          {caseStatuses.map((status) => (
            <span key={status}>{status}</span>
          ))}
        </div>
      </section>
      <section className="notice">
        <strong>Documents/evidence</strong>
        <span>Файлы проходят allowlist, duplicate hash check и OCR-review. Antivirus/storage production adapters остаются external blockers.</span>
        <div className="pills">
          {documentStatuses.map((status) => (
            <span key={status}>{status}</span>
          ))}
        </div>
      </section>
      <section className="notice">
        <strong>Legal RAG</strong>
        <span>Юридический ответ показывается только с подтвержденной официальной цитатой РК; иначе safe refusal.</span>
        <button disabled={busy} onClick={() => { void importLegalSourceFixture(); }}>Импортировать legal source</button>
        <small>{legalStatus}</small>
        <div className="pills">
          {ragStatuses.map((status) => (
            <span key={status}>{status}</span>
          ))}
        </div>
      </section>
      <section className="notice">
        <strong>Templates</strong>
        <span>Досудебная претензия генерируется только как проект с user confirmation и expert review flag.</span>
        <div className="pills">
          {templateStatuses.map((status) => (
            <span key={status}>{status}</span>
          ))}
        </div>
      </section>
      <section className="notice">
        <strong>Budget operations</strong>
        <span>Usage ledger хранит provider/model alias, units, cost, complexity, risk и correlation ID без raw PII.</span>
        <button disabled={busy} onClick={() => { void toggleStubProvider(); }}>Переключить provider kill switch</button>
        <small>{providerStatus}</small>
        <div className="pills">
          {budgetControls.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
      <pre className="tokens">{JSON.stringify(tokens.light, null, 2)}</pre>
      <pre className="tokens">API paths: {apiPaths.length}</pre>
    </main>
  );
}
