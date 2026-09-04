import { tokens } from '../src/design-system/tokens';

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

export default function AdminHome() {
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
        <span>Ответы строятся только по разрешенным источникам РК. Высокий риск требует проверки экспертом.</span>
      </section>
      <section className="notice">
        <strong>Identity наблюдаемость</strong>
        <span>Регистрация, сессии, согласия и профили пишут audit events без raw ИИН/БИН и секретов.</span>
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
        <div className="pills">
          {budgetControls.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
      <pre className="tokens">{JSON.stringify(tokens.light, null, 2)}</pre>
    </main>
  );
}
