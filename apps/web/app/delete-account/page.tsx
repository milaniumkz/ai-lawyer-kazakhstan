import Link from "next/link";

export default function DeleteAccountPage() {
  return (
    <main className="storePage">
      <section className="storePageCard">
        <span className="storePageBadge">AI Юрист Казахстан</span>
        <h1>Удаление аккаунта и данных</h1>
        <p>
          Пользователь может удалить аккаунт и связанные данные в приложении:
          профиль, дела, сообщения, документы, OCR-данные и историю подписки.
        </p>
        <h2>Через приложение</h2>
        <ol>
          <li>Войдите по номеру телефона.</li>
          <li>Откройте “Профиль” → “Настройки”.</li>
          <li>Выберите действие удаления аккаунта.</li>
        </ol>
        <h2>Через поддержку</h2>
        <p>
          Если доступа к аккаунту нет, отправьте запрос на
          <a href="mailto:support@89-207-250-217.sslip.io"> support@89-207-250-217.sslip.io</a>
          с номером телефона аккаунта. Запрос будет обработан вручную после проверки.
        </p>
        <Link className="storePageLink" href="/privacy">Политика конфиденциальности</Link>
      </section>
    </main>
  );
}
