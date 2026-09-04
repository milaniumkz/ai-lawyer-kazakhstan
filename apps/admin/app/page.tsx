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
      <pre className="tokens">{JSON.stringify(tokens.light, null, 2)}</pre>
    </main>
  );
}
