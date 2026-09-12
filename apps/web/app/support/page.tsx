import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="storePage">
      <section className="storePageCard">
        <span className="storePageBadge">AI Юрист Казахстан</span>
        <h1>Поддержка</h1>
        <p>
          По вопросам тестирования, доступа, удаления данных и работы приложения
          используйте встроенный раздел “Помощь” или e-mail поддержки.
        </p>
        <h2>Контакт</h2>
        <p>
          E-mail: <a href="mailto:support@89-207-250-217.sslip.io">support@89-207-250-217.sslip.io</a>
        </p>
        <h2>Что указать в обращении</h2>
        <ul>
          <li>номер телефона аккаунта;</li>
          <li>экран или действие, где возникла проблема;</li>
          <li>время ошибки и короткое описание результата.</li>
        </ul>
        <Link className="storePageLink" href="/">Открыть приложение</Link>
      </section>
    </main>
  );
}
