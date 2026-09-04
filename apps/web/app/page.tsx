"use client";

import { useMemo, useState } from "react";

type View = "home" | "cases" | "case" | "chat" | "documents" | "analysis" | "deadlines" | "legal" | "claim" | "profile" | "settings" | "subscription" | "help";
type CaseItem = { id: string; title: string; type: string; status: string; date: string; progress: number };
type Message = { role: "user" | "assistant"; text: string };
type DocumentItem = { name: string; status: string };

const screenLabels = [
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

const initialCases: CaseItem[] = [
  { id: "2024-0015", title: "Взыскание долга", type: "Гражданское право", status: "В работе", date: "15 мая 2024", progress: 65 },
  { id: "2024-0012", title: "Алименты", type: "Семейное право", status: "Подготовка документов", date: "10 мая 2024", progress: 42 },
];

export default function WebHome() {
  const [view, setView] = useState<View>("home");
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [activeCaseId, setActiveCaseId] = useState(initialCases[0].id);
  const [caseText, setCaseText] = useState("Нужно взыскать долг по договору займа. Есть расписка и переписка.");
  const [documents, setDocuments] = useState<DocumentItem[]>([{ name: "Расписка.pdf", status: "OCR-review" }]);
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [claimReady, setClaimReady] = useState(false);
  const [sent, setSent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [legalQuery, setLegalQuery] = useState("Как взыскать долг по расписке?");
  const [legalAnswer, setLegalAnswer] = useState("Введите вопрос и нажмите найти норму.");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Опишите ситуацию. Я проверю факты, документы и официальные источники РК." },
  ]);
  const [profileType, setProfileType] = useState("Физлицо");
  const [syncState, setSyncState] = useState("Не синхронизировано");

  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0];
  const filteredCases = useMemo(
    () => cases.filter((item) => item.title.toLowerCase().includes(caseSearch.toLowerCase()) || caseSearch.length < 3),
    [cases, caseSearch],
  );

  function addCase() {
    const next: CaseItem = {
      id: `2026-${String(cases.length + 21).padStart(4, "0")}`,
      title: caseText.includes("алимент") ? "Алименты" : "Новое дело",
      type: caseText.includes("труд") ? "Трудовой спор" : "Гражданское право",
      status: "Категория определена",
      date: "04 сентября 2026",
      progress: 18,
    };
    setCases([next, ...cases]);
    setActiveCaseId(next.id);
    setView("case");
  }

  function sendMessage() {
    if (!chatInput.trim()) return;
    setMessages((items) => [
      ...items,
      { role: "user", text: chatInput },
      { role: "assistant", text: "Для ответа потребуется договор, расписка, переписка и подтвержденная норма из официального источника РК." },
    ]);
    setChatInput("");
  }

  function addDocument(name: string) {
    setDocuments((items) => [{ name, status: "Загружен" }, ...items]);
  }

  async function apiJson(path: string, init?: RequestInit) {
    const response = await fetch(`/api/v1${path}`, {
      ...init,
      headers: { "content-type": "application/json", "x-correlation-id": "web-app-sync", ...(init?.headers ?? {}) },
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message ?? body.error ?? `${path} failed`);
    return body;
  }

  async function syncWithApi() {
    setSyncState("Синхронизация...");
    try {
      const suffix = Date.now().toString().slice(-7).padStart(7, "0");
      const registered = await apiJson("/auth/register", {
        method: "POST",
        body: JSON.stringify({ channel: "phone", phone: `+7701${suffix}`, password: "Demo12345", consentVersion: "v1" }),
      });
      const verified = await apiJson("/auth/otp/verify", { method: "POST", body: JSON.stringify({ otpId: registered.otpId, code: "111111" }) });
      const legalCase = await apiJson("/cases", {
        method: "POST",
        headers: { "idempotency-key": `web-app-${Date.now()}` },
        body: JSON.stringify({ ownerUserId: verified.user.id, problemText: caseText }),
      });
      const answer = await apiJson("/rag/answer", { method: "POST", body: JSON.stringify({ query: legalQuery }) });
      setSyncState(`Сохранено: дело ${legalCase.id.slice(0, 8)}, RAG ${answer.status}`);
    } catch (error) {
      setSyncState(error instanceof Error ? `Ошибка: ${error.message}` : "Ошибка синхронизации");
    }
  }

  function renderView() {
    if (view === "cases") {
      return (
        <section className="contentPanel">
          <Header title="Мои дела" subtitle="Фильтр, поиск и карточки дел" />
          <div className="searchRow">
            <input value={caseSearch} onChange={(event) => setCaseSearch(event.target.value)} placeholder="Поиск дела" />
            <button onClick={() => setCaseSearch("")}>Очистить</button>
          </div>
          <div className="list">
            {filteredCases.map((item) => (
              <button className="caseRow" key={item.id} onClick={() => { setActiveCaseId(item.id); setView("case"); }}>
                <span className="roundIcon">⚖</span>
                <span><strong>{item.title}</strong><small>Дело №{item.id} · {item.type}</small><small className="goldDot">● {item.status}</small></span>
                <em>{item.date}</em>
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (view === "case") {
      return (
        <section className="contentPanel">
          <Header title="Карточка дела" subtitle={`Дело №${activeCase.id} · ${activeCase.type}`} />
          <div className="caseHero">
            <span className="largeIcon">⚖</span>
            <div><h2>{activeCase.title}</h2><p>{activeCase.status}</p></div>
            <strong>{activeCase.progress}%</strong>
          </div>
          <progress value={activeCase.progress} max="100" />
          <div className="tileGrid">
            <Info label="Категория" value={activeCase.type} />
            <Info label="Срок" value={activeCase.date} />
            <Info label="Документы" value={`${documents.length} файла`} />
            <Info label="Маршрут" value="Досудебная подготовка" />
          </div>
          <div className="actionBar">
            <button className="primary" onClick={() => setView("chat")}>Продолжить работу</button>
            <button onClick={() => setView("documents")}>Открыть документы</button>
            <button onClick={() => setView("claim")}>Сформировать претензию</button>
          </div>
        </section>
      );
    }

    if (view === "chat") {
      return (
        <section className="contentPanel chatPanel">
          <Header title="Чат по делу" subtitle={activeCase.title} />
          <div className="messages">
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role}>{message.text}</div>)}
          </div>
          <div className="composer">
            <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} placeholder="Сообщение юристу AI" />
            <button className="primary" onClick={sendMessage}>Отправить</button>
          </div>
        </section>
      );
    }

    if (view === "documents" || view === "analysis") {
      return (
        <section className="contentPanel">
          <Header title={view === "documents" ? "Документы и доказательства" : "Анализ документов"} subtitle="Загрузка документа, OCR и проверка фактов" />
          <div className="actionBar">
            <button className="primary" onClick={() => addDocument("Договор займа.pdf")}>Загрузить файл</button>
            <button onClick={() => addDocument("Скан документа.jpg")}>Сканировать документ</button>
            <button onClick={() => setOcrConfirmed(true)}>{ocrConfirmed ? "Поля подтверждены" : "Подтвердить поля"}</button>
          </div>
          <div className="list">
            {documents.map((doc) => <div className="docRow" key={doc.name}><strong>{doc.name}</strong><span>{ocrConfirmed ? "Готов" : doc.status}</span></div>)}
          </div>
          <div className="analysisBox">
            <strong>Проверка документов</strong>
            <p>{analysisDone ? "Анализ завершен. Можно формировать претензию." : "Не хватает акта сверки. Подтвердите отсутствие или загрузите документ."}</p>
            <button className="primary" onClick={() => { setAnalysisDone(true); setView("analysis"); }}>Анализировать документы</button>
            <button disabled={!analysisDone} onClick={() => setView("claim")}>Сформировать претензию</button>
          </div>
        </section>
      );
    }

    if (view === "deadlines") {
      return (
        <section className="contentPanel">
          <Header title="Календарь и сроки" subtitle="Контроль процессуальных дат" />
          <div className="calendar"><strong>04</strong><span>Сентябрь 2026</span></div>
          <div className="list"><div className="docRow"><strong>Досудебная претензия</strong><span>10 дней</span></div><div className="docRow"><strong>Исковое заявление</strong><span>22 мая</span></div></div>
        </section>
      );
    }

    if (view === "legal") {
      return (
        <section className="contentPanel">
          <Header title="Нормы права" subtitle="Поиск нормы права только по официальным источникам РК" />
          <div className="searchRow">
            <input value={legalQuery} onChange={(event) => setLegalQuery(event.target.value)} />
            <button className="primary" onClick={() => setLegalAnswer("В официальных источниках не найдено достаточного подтверждения. Требуется проверка юристом.")}>Найти норму</button>
          </div>
          <div className="analysisBox"><strong>Citation Validator</strong><p>{legalAnswer}</p></div>
        </section>
      );
    }

    if (view === "claim") {
      return (
        <section className="contentPanel">
          <Header title={sent ? "Отправка претензии" : claimReady ? "Проект претензии" : "Формирование претензии"} subtitle="Досудебная претензия с ручным подтверждением" />
          <textarea value={caseText} onChange={(event) => setCaseText(event.target.value)} />
          <div className="claimPreview">Прошу погасить задолженность по договору займа. Сумма требования: 1 250 000 ₸. Перед отправкой нужна проверка пользователя.</div>
          <div className="actionBar">
            <button className="primary" onClick={() => setClaimReady(true)}>{claimReady ? "Проект сформирован" : "Сформировать проект"}</button>
            <button disabled={!claimReady} onClick={() => setSent(true)}>{sent ? "Отправка зафиксирована" : "Зафиксировать отправку"}</button>
          </div>
        </section>
      );
    }

    if (view === "profile" || view === "settings" || view === "subscription" || view === "help") {
      return (
        <section className="contentPanel">
          <Header title={view === "profile" ? "Профиль" : view === "settings" ? "Настройки" : view === "subscription" ? "Подписка" : "Помощь"} subtitle="Профиль пользователя, безопасность и поддержка" />
          <div className="chips">{["Физлицо", "ИП", "Юрлицо"].map((type) => <button className={profileType === type ? "chip active" : "chip"} key={type} onClick={() => setProfileType(type)}>{type}</button>)}</div>
          <input placeholder="Ф.И.О. / название" defaultValue="Дмитрий" />
          <input placeholder="ИИН/БИН" defaultValue="********1234" />
          <label className="toggle"><input type="checkbox" /> Скрывать ИИН/БИН в логах</label>
          <div className="actionBar">
            <button className="primary" onClick={() => setSyncState(`Профиль сохранен: ${profileType}`)}>Сохранить профиль</button>
            <button onClick={() => setSyncState("Обращение создано")}>Написать в поддержку</button>
          </div>
        </section>
      );
    }

    return (
      <section className="homeScreen">
        <div className="topLine">
          <div><h1>Здравствуйте, Дмитрий</h1><p>Ваш умный юридический помощник</p></div>
          <button className="avatar" onClick={() => setView("profile")}>ДС</button>
        </div>
        <button className={recording ? "mic active" : "mic"} onClick={() => setRecording(!recording)} aria-label="Рассказать проблему"><span>⌾</span></button>
        <h2>Рассказать проблему</h2>
        <p className="hint">{recording ? "Запись активна. Нажмите еще раз, чтобы остановить." : "Нажмите и говорите голосом"}</p>
        <div className="quickGrid">
          <button onClick={() => setView("case")}>Новое дело<small>Создать новое дело</small></button>
          <button onClick={() => setView("documents")}>Мои документы<small>Просмотр и загрузка</small></button>
          <button onClick={() => setView("deadlines")}>Сроки и календарь<small>Даты и напоминания</small></button>
        </div>
        <div className="sectionTitle"><h3>Последние дела</h3><button onClick={() => setView("cases")}>Все дела</button></div>
        <div className="list">
          {cases.slice(0, 2).map((item) => (
            <button className="caseRow" key={item.id} onClick={() => { setActiveCaseId(item.id); setView("case"); }}>
              <span className="roundIcon">⚖</span><span><strong>{item.title}</strong><small>Дело №{item.id} · {item.type}</small><small className="goldDot">● {item.status}</small></span><em>{item.date}</em>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <main className="appShell">
      <aside className="sidebar">
        <strong>AI Юрист</strong>
        <nav>
          <Nav label="Главная" current={view === "home"} onClick={() => setView("home")} />
          <Nav label="Дела" current={view === "cases" || view === "case" || view === "chat"} onClick={() => setView("cases")} />
          <Nav label="Документы" current={view === "documents" || view === "analysis"} onClick={() => setView("documents")} />
          <Nav label="Сроки" current={view === "deadlines"} onClick={() => setView("deadlines")} />
          <Nav label="Нормы права" current={view === "legal"} onClick={() => setView("legal")} />
          <Nav label="Профиль" current={view === "profile"} onClick={() => setView("profile")} />
        </nav>
        <button className="sync" onClick={syncWithApi}>Синхронизировать</button>
        <small>{syncState}</small>
      </aside>
      <section className="deviceFrame">
        {renderView()}
        <nav className="bottomNav">
          <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>Главная</button>
          <button className={view === "cases" ? "active" : ""} onClick={() => setView("cases")}>Дела</button>
          <button className={view === "documents" ? "active" : ""} onClick={() => setView("documents")}>Документы</button>
          <button className={view === "deadlines" ? "active" : ""} onClick={() => setView("deadlines")}>Сроки</button>
          <button className={view === "profile" ? "active" : ""} onClick={() => setView("profile")}>Профиль</button>
        </nav>
      </section>
      <aside className="rightPanel">
        <Header title="Новое дело" subtitle="Голосовое описание и категория спора" />
        <textarea value={caseText} onChange={(event) => setCaseText(event.target.value)} />
        <div className="actionBar"><button className="primary" onClick={addCase}>Подтвердить и создать дело</button><button onClick={() => setView("legal")}>Поиск нормы права</button></div>
        <div className="screenList">{screenLabels.map((label, index) => <button key={label} onClick={() => setView(index > 20 ? "profile" : index > 17 ? "legal" : index > 14 ? "cases" : index > 8 ? "documents" : "home")}><span>{String(index + 1).padStart(2, "0")}</span>{label}</button>)}</div>
      </aside>
    </main>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="panelHeader"><h2>{title}</h2><p>{subtitle}</p></header>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="info"><small>{label}</small><strong>{value}</strong></div>;
}

function Nav({ label, current, onClick }: { label: string; current: boolean; onClick: () => void }) {
  return <button className={current ? "active" : ""} onClick={onClick}>{label}</button>;
}
