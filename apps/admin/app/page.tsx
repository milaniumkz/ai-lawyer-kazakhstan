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
type LegalCategory = { code: string; nameRu: string; children?: LegalCategory[] };
type ClassificationRecord = {
  id: string;
  ownerUserId: string;
  result: {
    category_label: string;
    subcategory_label: string;
    subcategory_code: string;
    confidence: number;
    missing_facts: string[];
    risk_level: string;
  };
  userConfirmed: boolean;
};
type ChangeRequest = {
  id: string;
  action: 'create' | 'update';
  categoryCode: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  requestedBy: string;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
};
type AdminDocument = {
  id: string;
  caseId: string;
  fileName: string;
  status: string;
  extractedFields: Record<string, string>;
};
type SubscriptionPlan = { plan: string; title: string; priceKzt: number };

export default function AdminHome() {
  const [auditStatus, setAuditStatus] = useState('Audit events не загружены');
  const [providerStatus, setProviderStatus] = useState('Provider status не загружен');
  const [legalStatus, setLegalStatus] = useState('Legal source import не запускался');
  const [usageStatus, setUsageStatus] = useState('AI usage ledger не записывался');
  const [subscriptionOpsStatus, setSubscriptionOpsStatus] = useState('Subscription plans не проверялись');
  const [documentQueueStatus, setDocumentQueueStatus] = useState('Document review queue не загружена');
  const [categoryStatus, setCategoryStatus] = useState('Категории не загружены');
  const [reviewStatus, setReviewStatus] = useState('Очередь классификаций не загружена');
  const [changeStatus, setChangeStatus] = useState('Change requests не загружены');
  const [categories, setCategories] = useState<LegalCategory[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ClassificationRecord[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [selectedChangeRequest, setSelectedChangeRequest] = useState<ChangeRequest | null>(null);
  const [documentQueue, setDocumentQueue] = useState<AdminDocument[]>([]);
  const [draftCode, setDraftCode] = useState('family.admin_review_test');
  const [draftName, setDraftName] = useState('Админская тестовая категория');
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

  async function loadCategoryTree() {
    setBusy(true);
    try {
      const tree = (await apiJson('/admin/legal-categories')) as LegalCategory[];
      setCategories(tree);
      const children = tree.reduce((sum, item) => sum + (item.children?.length ?? 0), 0);
      setCategoryStatus(`Категории: ${tree.length} разделов, ${children} подкатегорий`);
    } catch (error) {
      setCategoryStatus(error instanceof Error ? `Category API error: ${error.message}` : 'Category API error');
    } finally {
      setBusy(false);
    }
  }

  async function loadReviewQueue() {
    setBusy(true);
    try {
      const queue = (await apiJson('/admin/classifications/review-queue')) as ClassificationRecord[];
      setReviewQueue(queue);
      setReviewStatus(`Очередь: ${queue.length}; first=${queue[0]?.result.subcategory_code ?? 'none'}`);
    } catch (error) {
      setReviewStatus(error instanceof Error ? `Review API error: ${error.message}` : 'Review API error');
    } finally {
      setBusy(false);
    }
  }

  async function confirmFirstClassification() {
    const item = reviewQueue[0];
    if (!item) {
      setReviewStatus('Нет классификаций для подтверждения');
      return;
    }
    setBusy(true);
    try {
      const confirmed = (await apiJson(`/admin/classifications/${item.id}/confirm`, { method: 'POST' })) as ClassificationRecord;
      setReviewQueue((current) => current.map((record) => (record.id === confirmed.id ? confirmed : record)));
      setReviewStatus(`Подтверждено: ${confirmed.result.subcategory_code}`);
    } catch (error) {
      setReviewStatus(error instanceof Error ? `Confirm API error: ${error.message}` : 'Confirm API error');
    } finally {
      setBusy(false);
    }
  }

  async function expertOverrideFirstClassification() {
    const item = reviewQueue[0];
    if (!item) {
      setReviewStatus('Нет классификаций для экспертного исправления');
      return;
    }
    setBusy(true);
    try {
      const updated = (await apiJson(`/admin/classifications/${item.id}/override`, {
        method: 'POST',
        body: JSON.stringify({ subcategoryCode: 'family.divorce', reason: 'admin expert review smoke' }),
      })) as ClassificationRecord;
      setReviewQueue((current) => current.map((record) => (record.id === updated.id ? updated : record)));
      setReviewStatus(`Эксперт исправил: ${updated.result.subcategory_code}`);
    } catch (error) {
      setReviewStatus(error instanceof Error ? `Override API error: ${error.message}` : 'Override API error');
    } finally {
      setBusy(false);
    }
  }

  async function createCategoryChangeRequest() {
    setBusy(true);
    try {
      const request = (await apiJson('/admin/legal-categories/change-requests', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          categoryCode: draftCode,
          reason: 'admin safe taxonomy request',
          payload: {
            code: draftCode,
            parentCode: 'family',
            nameRu: draftName,
            nameKk: draftName,
            nameEn: draftCode,
            descriptionRu: draftName,
            descriptionKk: draftName,
            descriptionEn: draftCode,
            defaultLegalRoute: 'civil',
            requiredFactSchema: { fields: ['parties', 'goal'] },
          },
        }),
      })) as ChangeRequest;
      setChangeRequests((current) => [request, ...current]);
      setChangeStatus(`Создана заявка: ${request.id.slice(0, 8)}`);
    } catch (error) {
      setChangeStatus(error instanceof Error ? `Change API error: ${error.message}` : 'Change API error');
    } finally {
      setBusy(false);
    }
  }

  async function createCategoryUpdateRequest() {
    setBusy(true);
    try {
      const request = (await apiJson('/admin/legal-categories/change-requests', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update',
          categoryCode: 'family.alimony.child',
          reason: 'admin safe label update request',
          payload: {
            descriptionRu: 'Взыскание алиментов на ребёнка: обновлено через безопасную заявку',
          },
        }),
      })) as ChangeRequest;
      setChangeRequests((current) => [request, ...current]);
      setChangeStatus(`Update заявка: ${request.id.slice(0, 8)}`);
    } catch (error) {
      setChangeStatus(error instanceof Error ? `Change API error: ${error.message}` : 'Change API error');
    } finally {
      setBusy(false);
    }
  }

  async function loadChangeRequests() {
    setBusy(true);
    try {
      const requests = (await apiJson('/admin/legal-categories/change-requests')) as ChangeRequest[];
      setChangeRequests(requests);
      setChangeStatus(`Change requests: ${requests.length}; first=${requests[0]?.status ?? 'none'}`);
    } catch (error) {
      setChangeStatus(error instanceof Error ? `Change API error: ${error.message}` : 'Change API error');
    } finally {
      setBusy(false);
    }
  }

  async function openFirstChangeRequest() {
    const item = changeRequests[0];
    if (!item) {
      setChangeStatus('Нет change request для открытия');
      return;
    }
    setBusy(true);
    try {
      const details = (await apiJson(`/admin/legal-categories/change-requests/${item.id}`)) as ChangeRequest;
      setSelectedChangeRequest(details);
      setChangeStatus(`Открыты детали: ${details.categoryCode}`);
    } catch (error) {
      setChangeStatus(error instanceof Error ? `Detail API error: ${error.message}` : 'Detail API error');
    } finally {
      setBusy(false);
    }
  }

  async function reviewFirstChangeRequest(action: 'approve' | 'reject') {
    const item = changeRequests.find((request) => request.status === 'pending');
    if (!item) {
      setChangeStatus('Нет pending change request');
      return;
    }
    setBusy(true);
    try {
      const reviewed = (await apiJson(`/admin/legal-categories/change-requests/${item.id}/${action}`, {
        method: 'POST',
        ...(action === 'reject' ? { body: JSON.stringify({ reason: 'admin rejected from UI' }) } : {}),
      })) as ChangeRequest;
      setChangeRequests((current) => current.map((request) => (request.id === reviewed.id ? reviewed : request)));
      setChangeStatus(`${action === 'approve' ? 'Approved' : 'Rejected'}: ${reviewed.categoryCode}`);
      if (action === 'approve') void loadCategoryTree();
    } catch (error) {
      setChangeStatus(error instanceof Error ? `Review change error: ${error.message}` : 'Review change error');
    } finally {
      setBusy(false);
    }
  }

  async function recordAiUsageFixture() {
    setBusy(true);
    try {
      const result = (await apiJson('/usage/ai', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'admin-rc-user',
          provider: 'stub',
          modelAlias: 'simple',
          inputUnits: 12,
          outputUnits: 8,
          durationMs: 240,
          estimatedCostKzt: 1,
          complexity: 'simple',
          risk: 'low',
          correlationId: 'admin-ops',
        }),
      })) as { budget: { usedKzt: number; monthlyLimitKzt: number } };
      setUsageStatus(`AI usage recorded: ₸ ${result.budget.usedKzt}/${result.budget.monthlyLimitKzt}`);
    } catch (error) {
      setUsageStatus(error instanceof Error ? `AI usage API error: ${error.message}` : 'AI usage API error');
    } finally {
      setBusy(false);
    }
  }

  async function loadSubscriptionPlans() {
    setBusy(true);
    try {
      const plans = (await apiJson('/subscriptions/plans')) as SubscriptionPlan[];
      setSubscriptionOpsStatus(`Plans=${plans.length}; standard=₸ ${plans.find((item) => item.plan === 'standard')?.priceKzt ?? 0}`);
    } catch (error) {
      setSubscriptionOpsStatus(error instanceof Error ? `Subscription ops error: ${error.message}` : 'Subscription ops error');
    } finally {
      setBusy(false);
    }
  }

  async function loadDocumentReviewQueue() {
    setBusy(true);
    try {
      const queue = (await apiJson('/admin/documents/review-queue')) as AdminDocument[];
      setDocumentQueue(queue);
      setDocumentQueueStatus(`Document queue: ${queue.length}; first=${queue[0]?.status ?? 'none'}`);
    } catch (error) {
      setDocumentQueueStatus(error instanceof Error ? `Document queue API error: ${error.message}` : 'Document queue API error');
    } finally {
      setBusy(false);
    }
  }

  async function confirmFirstDocumentOcr() {
    const item = documentQueue[0];
    if (!item) {
      setDocumentQueueStatus('Нет документов для OCR confirm');
      return;
    }
    setBusy(true);
    try {
      const updated = (await apiJson(`/admin/documents/${item.id}/ocr-confirm`, {
        method: 'POST',
        body: JSON.stringify({ fields: { ...item.extractedFields, adminReviewed: 'true' } }),
      })) as AdminDocument;
      setDocumentQueue((current) => current.map((document) => (document.id === updated.id ? updated : document)));
      setDocumentQueueStatus(`OCR confirmed: ${updated.fileName}`);
    } catch (error) {
      setDocumentQueueStatus(error instanceof Error ? `OCR confirm API error: ${error.message}` : 'OCR confirm API error');
    } finally {
      setBusy(false);
    }
  }

  async function rejectFirstDocument() {
    const item = documentQueue[0];
    if (!item) {
      setDocumentQueueStatus('Нет документов для reject');
      return;
    }
    setBusy(true);
    try {
      const updated = (await apiJson(`/admin/documents/${item.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'admin_review_rejected' }),
      })) as AdminDocument;
      setDocumentQueue((current) => current.map((document) => (document.id === updated.id ? updated : document)));
      setDocumentQueueStatus(`Rejected: ${updated.fileName}`);
    } catch (error) {
      setDocumentQueueStatus(error instanceof Error ? `Reject API error: ${error.message}` : 'Reject API error');
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
        <strong>Category review</strong>
        <span>Категории и классификации читаются через admin RBAC; экспертные правки пишутся в feedback.</span>
        <button disabled={busy} onClick={() => { void loadCategoryTree(); }}>Загрузить категории</button>
        <small>{categoryStatus}</small>
        <div className="pills">
          {categories.slice(0, 8).map((category) => (
            <span key={category.code}>{category.nameRu}</span>
          ))}
        </div>
        <button disabled={busy} onClick={() => { void loadReviewQueue(); }}>Загрузить review queue</button>
        <small>{reviewStatus}</small>
        <div className="queue">
          {reviewQueue.slice(0, 5).map((item) => (
            <div key={item.id}>
              <strong>{item.result.subcategory_label}</strong>
              <span>{Math.round(item.result.confidence * 100)}% · {item.result.risk_level} · {item.userConfirmed ? 'confirmed' : 'pending'}</span>
            </div>
          ))}
        </div>
        <button disabled={busy} onClick={() => { void confirmFirstClassification(); }}>Подтвердить первую</button>
        <button disabled={busy} onClick={() => { void expertOverrideFirstClassification(); }}>Expert override первой</button>
      </section>
      <section className="notice">
        <strong>Taxonomy changes</strong>
        <span>Изменения taxonomy проходят через pending request; approve применяет БД и повышает version.</span>
        <input value={draftCode} onChange={(event) => setDraftCode(event.target.value)} aria-label="Код категории" />
        <input value={draftName} onChange={(event) => setDraftName(event.target.value)} aria-label="Название категории" />
        <button disabled={busy} onClick={() => { void createCategoryChangeRequest(); }}>Создать create request</button>
        <button disabled={busy} onClick={() => { void createCategoryUpdateRequest(); }}>Создать update request</button>
        <button disabled={busy} onClick={() => { void loadChangeRequests(); }}>Загрузить change requests</button>
        <button disabled={busy} onClick={() => { void openFirstChangeRequest(); }}>Открыть детали первой</button>
        <small>{changeStatus}</small>
        <div className="queue">
          {changeRequests.slice(0, 5).map((item) => (
            <div key={item.id}>
              <strong>{item.categoryCode}</strong>
              <span>{item.action} · {item.status}</span>
            </div>
          ))}
        </div>
        {selectedChangeRequest ? (
          <pre className="detailPanel">{JSON.stringify({
            id: selectedChangeRequest.id,
            action: selectedChangeRequest.action,
            categoryCode: selectedChangeRequest.categoryCode,
            status: selectedChangeRequest.status,
            requestedBy: selectedChangeRequest.requestedBy,
            reviewedBy: selectedChangeRequest.reviewedBy,
            reason: selectedChangeRequest.reason,
            payload: selectedChangeRequest.payload,
          }, null, 2)}</pre>
        ) : null}
        <button disabled={busy} onClick={() => { void reviewFirstChangeRequest('approve'); }}>Approve pending</button>
        <button disabled={busy} onClick={() => { void reviewFirstChangeRequest('reject'); }}>Reject pending</button>
      </section>
      <section className="notice">
        <strong>Documents/evidence</strong>
        <span>Файлы проходят allowlist, duplicate hash check и OCR-review. Antivirus/storage production adapters остаются external blockers.</span>
        <button disabled={busy} onClick={() => { void loadDocumentReviewQueue(); }}>Загрузить document queue</button>
        <small>{documentQueueStatus}</small>
        <div className="queue">
          {documentQueue.slice(0, 5).map((item) => (
            <div key={item.id}>
              <strong>{item.fileName}</strong>
              <span>{item.status} · case {item.caseId.slice(0, 8)}</span>
            </div>
          ))}
        </div>
        <button disabled={busy} onClick={() => { void confirmFirstDocumentOcr(); }}>Confirm OCR первой</button>
        <button disabled={busy} onClick={() => { void rejectFirstDocument(); }}>Reject первой</button>
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
        <button disabled={busy} onClick={() => { void recordAiUsageFixture(); }}>Записать AI usage</button>
        <small>{usageStatus}</small>
        <button disabled={busy} onClick={() => { void toggleStubProvider(); }}>Переключить provider kill switch</button>
        <small>{providerStatus}</small>
        <button disabled={busy} onClick={() => { void loadSubscriptionPlans(); }}>Загрузить subscription plans</button>
        <small>{subscriptionOpsStatus}</small>
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
