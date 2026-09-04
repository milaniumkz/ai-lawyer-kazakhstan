import { tokens } from '../src/design-system/tokens';

const cards = [
  ['Активные дела', '128'],
  ['На проверке эксперта', '17'],
  ['Расход AI за месяц', '₸ 482 000'],
  ['OTP / stub auth', 'local'],
];

const auditEvents = ['otp_requested', 'login', 'session_created', 'profile_created', 'logout_all_devices'];

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
      <pre className="tokens">{JSON.stringify(tokens.light, null, 2)}</pre>
    </main>
  );
}
