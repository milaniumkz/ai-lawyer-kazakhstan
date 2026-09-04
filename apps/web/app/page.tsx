const flows = [
  ['01', 'Вход и профиль', 'Телефон/email, OTP, согласие, профили физлица/ИП/юрлица.'],
  ['02', 'Новое дело', 'Текстовый или голосовой intake, категория спора и готовность дела.'],
  ['03', 'Документы', 'Upload session, OCR-review, доказательства и проверка дублей.'],
  ['04', 'Нормы права', 'Ответ только с официальной цитатой РК или безопасный отказ.'],
  ['05', 'Претензия', 'Проект досудебной претензии с обязательным подтверждением.'],
  ['06', 'Подписка', 'Лимиты, AI usage ledger и provider kill switch без raw PII.'],
];

const checks = ['OpenAPI', 'PostgreSQL adapters', 'AI smoke', 'Flutter golden', 'Admin contract', 'Security scan'];

export default function WebHome() {
  return (
    <main className="page">
      <section className="hero">
        <nav className="nav">
          <strong>AI Юрист</strong>
          <div>
            <a href="/api/health">API</a>
            <a href="/admin">Admin</a>
          </div>
        </nav>
        <div className="heroGrid">
          <div>
            <p className="eyebrow">Казахстан · RC internal validation</p>
            <h1>Юридический помощник с проверкой официальных источников РК</h1>
            <p className="lead">
              Веб-версия для ПК и телефона повторяет ключевые mobile-сценарии: дело, чат, документы, нормы права,
              досудебная претензия и контроль бюджета.
            </p>
            <div className="actions">
              <a className="primary" href="#flows">Открыть сценарии</a>
              <a className="secondary" href="#status">Статус RC</a>
            </div>
          </div>
          <aside className="phone" aria-label="Mobile preview">
            <div className="phoneTop" />
            <h2>Расскажите проблему</h2>
            <p>AI подготовит дело, но юридически значимые действия требуют подтверждения источниками РК.</p>
            <button>Начать</button>
          </aside>
        </div>
      </section>

      <section id="flows" className="section">
        <h2>Основные сценарии</h2>
        <div className="cards">
          {flows.map(([number, title, text]) => (
            <article key={title} className="card">
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="status" className="status">
        <div>
          <p className="eyebrow">Release Candidate</p>
          <h2>Готово для локального и внутреннего тестирования</h2>
          <p>Production launch зависит от внешних доступов: госинтеграции, платежи/SMS/storage, signing и legal approval.</p>
        </div>
        <div className="checks">
          {checks.map((check) => (
            <span key={check}>{check}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
