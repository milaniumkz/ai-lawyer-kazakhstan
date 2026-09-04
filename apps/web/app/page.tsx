"use client";

import { useState } from "react";

const flows = [
  ["01", "Вход и профиль", "OTP 111111, согласие, профиль физлица/ИП/юрлица.", "Профиль создан"],
  ["02", "Новое дело", "Текстовый или голосовой intake, категория спора и готовность дела.", "Дело создано"],
  ["03", "Документы", "Upload session, OCR-review, доказательства и проверка дублей.", "Поля OCR подтверждены"],
  ["04", "Нормы права", "Ответ только с официальной цитатой РК или безопасный отказ.", "Цитата проверена"],
  ["05", "Претензия", "Проект досудебной претензии с обязательным подтверждением.", "Проект сформирован"],
  ["06", "Подписка", "Лимиты, AI usage ledger и provider kill switch без raw PII.", "Stub blocker показан"],
];

const checks = ["OpenAPI", "PostgreSQL", "AI smoke", "Flutter golden", "Admin contract", "Security scan"];
const screens = [
  "Онбординг",
  "Вход и регистрация",
  "Регистрация пользователя",
  "SMS подтверждение",
  "Биометрия",
  "Главный экран",
  "Новое дело",
  "Категория спора",
  "Проверка документов",
  "Загрузка документа",
  "Анализ документов",
  "Формирование претензии",
  "Проект претензии",
  "Отправка претензии",
  "Мои дела",
  "Карточка дела",
  "Чат по делу",
  "Календарь и сроки",
  "Нормы права",
  "Поиск нормы права",
  "Документы и доказательства",
  "Профиль",
  "Настройки",
  "Подписка",
  "Помощь",
];

export default function WebHome() {
  const [activeFlow, setActiveFlow] = useState(flows[0]);
  const [flowState, setFlowState] = useState("Выберите сценарий");
  const [activeScreen, setActiveScreen] = useState("Главный экран");
  const [log, setLog] = useState<string[]>(["Стенд готов к RC-тестированию"]);
  const [apiStatus, setApiStatus] = useState("не проверено");
  const [aiStatus, setAiStatus] = useState("не проверено");

  async function checkHealth(path: string, setter: (value: string) => void) {
    try {
      const response = await fetch(path);
      const body = await response.json();
      setter(`${body.service}: ${body.status}`);
      setLog((items) => [`${path} OK`, ...items].slice(0, 5));
    } catch {
      setter("ошибка");
      setLog((items) => [`${path} ошибка`, ...items].slice(0, 5));
    }
  }

  function runFlow(flow: string[]) {
    setActiveFlow(flow);
    setFlowState(flow[3]);
    setLog((items) => [`${flow[1]}: ${flow[3]}`, ...items].slice(0, 5));
  }

  function runFlowAction(action: string) {
    setFlowState(action);
    setLog((items) => [`${activeFlow[1]}: ${action}`, ...items].slice(0, 5));
  }

  function openScreen(screen: string) {
    setActiveScreen(screen);
    setFlowState(`${screen}: экран открыт`);
    setLog((items) => [`${screen}: экран открыт`, ...items].slice(0, 5));
  }

  return (
    <main className="page">
      <section className="hero">
        <nav className="nav">
          <strong>AI Юрист</strong>
          <div>
            <a href="/api/v1/health">API</a>
            <a href="/admin">Admin</a>
          </div>
        </nav>
        <div className="heroGrid">
          <div>
            <p className="eyebrow">Казахстан · RC internal validation</p>
            <h1>Юридический помощник с проверкой официальных источников РК</h1>
            <p className="lead">
              Веб-версия для ПК и телефона покрывает ключевые сценарии: дело, чат, документы,
              нормы права, досудебная претензия и контроль бюджета.
            </p>
            <div className="actions">
              <button className="primary" onClick={() => runFlow(flows[1])}>Начать дело</button>
              <button className="secondary" onClick={() => checkHealth("/api/v1/health", setApiStatus)}>API: {apiStatus}</button>
              <button className="secondary" onClick={() => checkHealth("/ai/health", setAiStatus)}>AI: {aiStatus}</button>
            </div>
          </div>
          <aside className="phone" aria-label="Mobile preview">
            <div className="phoneTop" />
            <h2>{activeFlow[1]}</h2>
            <div className="screenBadge">{activeScreen}</div>
            <p>{activeFlow[2]}</p>
            <button onClick={() => runFlow(activeFlow)}>{activeFlow[3]}</button>
            <div className="activity">
              {log.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="workspace">
        <div className="panel">
          <p className="eyebrow">Активный сценарий</p>
          <h2>{activeFlow[1]}</h2>
          <p>{activeFlow[2]}</p>
          <div className="state">{flowState}</div>
          <div className="actions compact">
            <button className="primary" onClick={() => runFlowAction(`${activeFlow[3]} выполнено`)}>
              Выполнить
            </button>
            <button className="secondary" onClick={() => runFlowAction("Требуется ручная проверка юристом")}>
              На проверку
            </button>
            <button className="secondary" onClick={() => runFlowAction("Внешняя интеграция заблокирована без ключей")}>
              Blocker
            </button>
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">Журнал действий</p>
          <div className="timeline">
            {log.map((item) => (
              <button key={item} onClick={() => setFlowState(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="flows" className="section">
        <h2>Основные сценарии</h2>
        <div className="cards">
          {flows.map((flow) => (
            <button key={flow[1]} className="card cardButton" onClick={() => runFlow(flow)}>
              <span>{flow[0]}</span>
              <h3>{flow[1]}</h3>
              <p>{flow[2]}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Экраны приложения</h2>
        <div className="screenGrid">
          {screens.map((screen, index) => (
            <button
              key={screen}
              className={screen === activeScreen ? "screen active" : "screen"}
              onClick={() => openScreen(screen)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {screen}
            </button>
          ))}
        </div>
      </section>

      <section id="status" className="status">
        <div>
          <p className="eyebrow">Release Candidate</p>
          <h2>Готово для внутреннего тестирования</h2>
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
